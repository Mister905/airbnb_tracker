import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { IngestionService } from '../ingestion/ingestion.service';
import { extractRoomUrls, extractRoomIdFromUrl } from './utils/url-utils';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private apifyClient: ApifyClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ingestionService: IngestionService,
  ) {
    const apifyToken = this.configService.get<string>('APIFY_TOKEN');
    if (apifyToken) {
      this.apifyClient = new ApifyClient({ token: apifyToken });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledScrape() {
    this.logger.log('Running scheduled scrape at midnight UTC');
    
    const enabledUrls = await this.prisma.trackedUrl.findMany({
      where: { enabled: true },
    });

    for (const url of enabledUrls) {
      try {
        await this.scrapeUrl(url.id, url.userId);
      } catch (error) {
        this.logger.error(`Error scraping URL ${url.id}`, error instanceof Error ? error.stack : String(error));
      }
    }
  }

  async manualScrape(trackedUrlId: string, userId: string) {
    // Verify ownership
    const url = await this.prisma.trackedUrl.findFirst({
      where: { id: trackedUrlId, userId },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
    }

    return this.scrapeUrl(trackedUrlId, userId);
  }

  private async scrapeUrl(trackedUrlId: string, userId: string) {
    const url = await this.prisma.trackedUrl.findUnique({
      where: { id: trackedUrlId },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
    }

    // Create scrape run
    const scrapeRun = await this.prisma.scrapeRun.create({
      data: {
        trackedUrlId,
        status: 'pending',
      },
    });

    // Get actor ID before try block so it's available in catch
    const actorId = 
      this.configService.get<string>('APIFY_ACTOR_ID_ROOMS') || 
      this.configService.get<string>('APIFY_ACTOR_ID') || 
      'tri_angle~airbnb-rooms-urls-scraper';

    try {
      if (!this.apifyClient) {
        throw new Error('Apify client not configured');
      }

      if (!actorId) {
        throw new Error('APIFY_ACTOR_ID_ROOMS or APIFY_ACTOR_ID must be configured in .env file');
      }
      
      // Start Apify run
      const run = await this.apifyClient.actor(actorId).call({
        startUrls: [{ url: url.url }],
      });

      // Update scrape run with Apify run ID
      await this.prisma.scrapeRun.update({
        where: { id: scrapeRun.id },
        data: {
          apifyRunId: run.id,
          status: 'running',
        },
      });

      // Wait for completion
      const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
      
      if (finishedRun.status === 'SUCCEEDED') {
        const dataset = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
        const listings = dataset.items as any[];
        
        this.logger.log(`Rooms scraper completed. Retrieved ${listings.length} listings`);
        
        // Step 2: Extract room URLs and scrape reviews (following Python implementation)
        let listingsWithReviews = listings;
        const reviewsActorId = this.configService.get<string>('APIFY_ACTOR_ID_REVIEWS');
        
        if (reviewsActorId && listings.length > 0) {
          this.logger.log(`Starting reviews scraper with actor: ${reviewsActorId}`);
          
          try {
            // Extract room URLs from listings
            const roomUrls = extractRoomUrls(listings);
            this.logger.debug(`Extracted ${roomUrls.length} room URLs for reviews scraping`);
            
            if (roomUrls.length > 0) {
              // Process reviews in batches (matching Python BATCH_SIZE logic)
              const batchSize = parseInt(this.configService.get<string>('BATCH_SIZE') || '5', 10);
              const rateLimitDelay = parseFloat(this.configService.get<string>('RATE_LIMIT_DELAY') || '2.0');
              const reviewTimeout = parseInt(this.configService.get<string>('REVIEW_TIMEOUT') || '300', 10);
              const maxReviews = parseInt(this.configService.get<string>('MAX_REVIEWS_PER_LISTING') || '50', 10);
              const reviewConcurrency = parseInt(this.configService.get<string>('REVIEW_CONCURRENCY') || '3', 10);
              
              const totalBatches = Math.ceil(roomUrls.length / batchSize);
              this.logger.log(`Processing ${totalBatches} batch(es) of reviews (batch size: ${batchSize})`);
              
              const allReviews: any[] = [];
              
              for (let i = 0; i < roomUrls.length; i += batchSize) {
                const batch = roomUrls.slice(i, i + batchSize);
                const batchNum = Math.floor(i / batchSize) + 1;
                
                this.logger.debug(`Processing batch ${batchNum}/${totalBatches} (${batch.length} rooms)`);
                
                try {
                  // Start reviews scraper for this batch
                  const reviewsRun = await this.apifyClient.actor(reviewsActorId).call({
                    startUrls: batch.map(url => ({ url })),
                    maxReviews,
                    maxConcurrency: reviewConcurrency,
                  });
                  
                  this.logger.debug(`Reviews scraper started for batch ${batchNum}. Run ID: ${reviewsRun.id}`);
                  
                  // Wait for reviews scraper to complete (with timeout)
                  const reviewsFinishedRun = await this.waitForReviewsCompletion(reviewsRun.id, reviewTimeout);
                  
                  if (reviewsFinishedRun && reviewsFinishedRun.status === 'SUCCEEDED') {
                    this.logger.log(`Reviews scraper completed successfully for batch ${batchNum}`);
                    
                    // Fetch reviews data
                    if (reviewsFinishedRun.defaultDatasetId) {
                      const reviewsDataset = await this.apifyClient.dataset(reviewsFinishedRun.defaultDatasetId).listItems();
                      const batchReviews = reviewsDataset.items as any[];
                      allReviews.push(...batchReviews);
                      this.logger.debug(`Retrieved ${batchReviews.length} review entries from batch ${batchNum}`);
                    } else {
                      this.logger.warn(`No dataset ID for batch ${batchNum}`);
                    }
                  } else {
                    const status = reviewsFinishedRun?.status || 'UNKNOWN';
                    this.logger.warn(`Reviews scraper failed for batch ${batchNum} with status: ${status}. Continuing with next batch.`);
                  }
                  
                  // Rate limiting between batches (except for last batch)
                  if (i + batchSize < roomUrls.length) {
                    await new Promise(resolve => setTimeout(resolve, rateLimitDelay * 1000));
                  }
                } catch (batchError) {
                  this.logger.error(`Error processing batch ${batchNum}`, batchError instanceof Error ? batchError.stack : String(batchError));
                  // Continue with next batch even if this one fails
                }
              }
              
              this.logger.log(`Total reviews collected: ${allReviews.length}`);
              
              // Merge reviews with listings (matching by room ID)
              listingsWithReviews = this.mergeReviewsWithListings(listings, allReviews);
              
              this.logger.debug('Merged reviews with listings');
            } else {
              this.logger.warn('No room URLs extracted. Proceeding without reviews.');
            }
          } catch (reviewError) {
            this.logger.error('Error during reviews scraping', reviewError instanceof Error ? reviewError.stack : String(reviewError));
            this.logger.warn('Proceeding with listings data without reviews.');
            // Continue with listings data even if reviews scraping fails
          }
        } else {
          if (!reviewsActorId) {
            this.logger.debug('APIFY_ACTOR_ID_REVIEWS not configured. Skipping reviews scraping.');
          }
        }
        
        await this.prisma.scrapeRun.update({
          where: { id: scrapeRun.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // Ingest the data (with merged reviews if available)
        await this.ingestionService.ingestData(
          trackedUrlId,
          userId,
          listingsWithReviews,
          scrapeRun.id,
        );
      } else {
        throw new Error(`Apify run failed: ${finishedRun.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const detailedError = errorMessage.includes('Actor was not found') 
        ? `Apify actor "${actorId}" not found. Please check your APIFY_ACTOR_ID_ROOMS configuration in .env file.`
        : errorMessage;
      
      await this.prisma.scrapeRun.update({
        where: { id: scrapeRun.id },
        data: {
          status: 'failed',
          error: detailedError,
          completedAt: new Date(),
        },
      });
      
      // Create a more user-friendly error
      const friendlyError = new Error(detailedError);
      if (error instanceof Error && 'statusCode' in error) {
        (friendlyError as any).statusCode = (error as any).statusCode;
      }
      throw friendlyError;
    }

    return scrapeRun;
  }

  /**
   * Wait for reviews scraper to complete with timeout
   * Based on Python implementation: wait_for_reviews_completion
   */
  private async waitForReviewsCompletion(runId: string, timeoutSeconds: number = 300): Promise<{ status: string; defaultDatasetId?: string } | null> {
    const startTime = Date.now();
    const timeout = timeoutSeconds * 1000;
    const pollInterval = parseInt(this.configService.get<string>('REVIEW_POLL_INTERVAL') || '10', 10) * 1000;
    
    this.logger.debug(`Waiting for reviews scraper (run ID: ${runId}) to complete. Timeout: ${timeoutSeconds}s`);
    
    while (Date.now() - startTime < timeout) {
      try {
        const run = await this.apifyClient.run(runId).get();
        const status = run.status;
        
        if (status === 'SUCCEEDED') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.logger.log(`Reviews scraper completed successfully. Duration: ${elapsed}s`);
          return run;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT' || status === 'TIMING-OUT' || status === 'ABORTING') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.logger.error(`Reviews scraper ${status.toLowerCase()} after ${elapsed}s`);
          return run;
        } else if (status === 'READY' || status === 'RUNNING') {
          // Only log periodically to avoid spam
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed % 30 === 0) {
            this.logger.debug(`Status: ${status} | Elapsed: ${elapsed}s`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        this.logger.error(`Error checking reviews scraper status`, error instanceof Error ? error.stack : String(error));
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    const elapsedMinutes = Math.floor(timeoutSeconds / 60);
    this.logger.error(`Reviews scraper timed out after ${elapsedMinutes} minutes. Check Apify console: https://console.apify.com/actor-runs/${runId}`);
    return null;
  }

  /**
   * Merge reviews data with listings based on room ID
   * Based on Python implementation: merge_reviews_with_listings
   */
  private mergeReviewsWithListings(listings: any[], reviewsData: any[]): any[] {
    // Create a mapping of room_id -> reviews
    const reviewsByRoom = new Map<string, any[]>();
    const reviewsWithoutRoom: any[] = [];

    for (const reviewEntry of reviewsData) {
      // PRIMARY: Extract room_id from startUrl (most reliable for Apify reviews scraper)
      let reviewRoomId: string | null = null;
      
      const startUrl = reviewEntry.startUrl || reviewEntry.start_url || '';
      if (startUrl) {
        const urlStr = typeof startUrl === 'string' ? startUrl : (startUrl.url || '');
        reviewRoomId = extractRoomIdFromUrl(urlStr);
      }

      // FALLBACK: Try reviewee.profilePath if startUrl didn't work
      if (!reviewRoomId) {
        const reviewee = reviewEntry.reviewee;
        if (reviewee && typeof reviewee === 'object') {
          const profilePath = reviewee.profilePath || reviewee.profile_path;
          if (profilePath) {
            reviewRoomId = extractRoomIdFromUrl(profilePath);
          }
        }
      }

      // LAST RESORT: Try other fields (legacy support)
      if (!reviewRoomId) {
        reviewRoomId = reviewEntry.roomId || reviewEntry.room_id || null;
      }

      if (reviewRoomId) {
        const roomIdStr = String(reviewRoomId);
        if (!reviewsByRoom.has(roomIdStr)) {
          reviewsByRoom.set(roomIdStr, []);
        }
        reviewsByRoom.get(roomIdStr)!.push(reviewEntry);
      } else {
        reviewsWithoutRoom.push(reviewEntry);
        this.logger.warn(`Could not extract room_id from review.startUrl`);
      }
    }

    if (reviewsWithoutRoom.length > 0) {
      this.logger.warn(`${reviewsWithoutRoom.length} reviews could not be matched to a room_id`);
    }

    this.logger.debug(`Mapped ${Array.from(reviewsByRoom.values()).reduce((sum, reviews) => sum + reviews.length, 0)} reviews to ${reviewsByRoom.size} rooms`);

    // Merge reviews with listings
    for (const listing of listings) {
      // Get listing's room ID (primary identifier)
      let listingId: string | null = null;
      
      listingId = listing.roomId || listing.id || listing.listingId || null;
      
      // Fallback: Extract from URL if direct ID not available
      if (!listingId) {
        const listingUrl = listing.url || listing.listingUrl || listing.roomUrl || '';
        listingId = extractRoomIdFromUrl(listingUrl);
      }

      // Match reviews to this listing using room ID
      if (listingId) {
        const listingIdStr = String(listingId);
        if (reviewsByRoom.has(listingIdStr)) {
          listing.reviews = reviewsByRoom.get(listingIdStr) || [];
          this.logger.debug(`Matched ${listing.reviews.length} reviews to listing ${listingIdStr}`);
        } else {
          listing.reviews = [];
        }
      } else {
        listing.reviews = [];
        this.logger.warn(`Could not extract listing_id from listing`);
      }
    }

    return listings;
  }

  async getScrapeStatus(trackedUrlId: string, userId: string) {
    const url = await this.prisma.trackedUrl.findFirst({
      where: { id: trackedUrlId, userId },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
    }

    const runs = await this.prisma.scrapeRun.findMany({
      where: { trackedUrlId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return runs;
  }
}
