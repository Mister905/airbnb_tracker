"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const apify_client_1 = require("apify-client");
const ingestion_service_1 = require("../ingestion/ingestion.service");
const url_utils_1 = require("./utils/url-utils");
let ScrapingService = class ScrapingService {
    constructor(prisma, configService, ingestionService) {
        this.prisma = prisma;
        this.configService = configService;
        this.ingestionService = ingestionService;
        const apifyToken = this.configService.get('APIFY_TOKEN');
        if (apifyToken) {
            this.apifyClient = new apify_client_1.ApifyClient({ token: apifyToken });
        }
    }
    async scheduledScrape() {
        console.log('Running scheduled scrape at midnight UTC');
        const enabledUrls = await this.prisma.trackedUrl.findMany({
            where: { enabled: true },
        });
        for (const url of enabledUrls) {
            try {
                await this.scrapeUrl(url.id, url.userId);
            }
            catch (error) {
                console.error(`Error scraping URL ${url.id}:`, error);
            }
        }
    }
    async manualScrape(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id: trackedUrlId, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        return this.scrapeUrl(trackedUrlId, userId);
    }
    async scrapeUrl(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findUnique({
            where: { id: trackedUrlId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        const scrapeRun = await this.prisma.scrapeRun.create({
            data: {
                trackedUrlId,
                status: 'pending',
            },
        });
        const actorId = this.configService.get('APIFY_ACTOR_ID_ROOMS') ||
            this.configService.get('APIFY_ACTOR_ID') ||
            'tri_angle~airbnb-rooms-urls-scraper';
        try {
            if (!this.apifyClient) {
                throw new Error('Apify client not configured');
            }
            if (!actorId) {
                throw new Error('APIFY_ACTOR_ID_ROOMS or APIFY_ACTOR_ID must be configured in .env file');
            }
            const run = await this.apifyClient.actor(actorId).call({
                startUrls: [{ url: url.url }],
            });
            await this.prisma.scrapeRun.update({
                where: { id: scrapeRun.id },
                data: {
                    apifyRunId: run.id,
                    status: 'running',
                },
            });
            const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
            if (finishedRun.status === 'SUCCEEDED') {
                const dataset = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
                const listings = dataset.items;
                console.log(`[Scraping] Rooms scraper completed. Retrieved ${listings.length} listings`);
                let listingsWithReviews = listings;
                const reviewsActorId = this.configService.get('APIFY_ACTOR_ID_REVIEWS');
                if (reviewsActorId && listings.length > 0) {
                    console.log(`[Scraping] Starting reviews scraper with actor: ${reviewsActorId}`);
                    try {
                        const roomUrls = (0, url_utils_1.extractRoomUrls)(listings);
                        console.log(`[Scraping] Extracted ${roomUrls.length} room URLs for reviews scraping`);
                        if (roomUrls.length > 0) {
                            const batchSize = parseInt(this.configService.get('BATCH_SIZE') || '5', 10);
                            const rateLimitDelay = parseFloat(this.configService.get('RATE_LIMIT_DELAY') || '2.0');
                            const reviewTimeout = parseInt(this.configService.get('REVIEW_TIMEOUT') || '300', 10);
                            const maxReviews = parseInt(this.configService.get('MAX_REVIEWS_PER_LISTING') || '50', 10);
                            const reviewConcurrency = parseInt(this.configService.get('REVIEW_CONCURRENCY') || '3', 10);
                            const totalBatches = Math.ceil(roomUrls.length / batchSize);
                            console.log(`[Scraping] Processing ${totalBatches} batch(es) of reviews (batch size: ${batchSize})`);
                            const allReviews = [];
                            for (let i = 0; i < roomUrls.length; i += batchSize) {
                                const batch = roomUrls.slice(i, i + batchSize);
                                const batchNum = Math.floor(i / batchSize) + 1;
                                console.log(`[Scraping] Processing batch ${batchNum}/${totalBatches} (${batch.length} rooms)`);
                                try {
                                    const reviewsRun = await this.apifyClient.actor(reviewsActorId).call({
                                        startUrls: batch.map(url => ({ url })),
                                        maxReviews,
                                        maxConcurrency: reviewConcurrency,
                                    });
                                    console.log(`[Scraping] Reviews scraper started for batch ${batchNum}. Run ID: ${reviewsRun.id}`);
                                    const reviewsFinishedRun = await this.waitForReviewsCompletion(reviewsRun.id, reviewTimeout);
                                    if (reviewsFinishedRun && reviewsFinishedRun.status === 'SUCCEEDED') {
                                        console.log(`[Scraping] Reviews scraper completed successfully for batch ${batchNum}`);
                                        if (reviewsFinishedRun.defaultDatasetId) {
                                            const reviewsDataset = await this.apifyClient.dataset(reviewsFinishedRun.defaultDatasetId).listItems();
                                            const batchReviews = reviewsDataset.items;
                                            allReviews.push(...batchReviews);
                                            console.log(`[Scraping] Retrieved ${batchReviews.length} review entries from batch ${batchNum}`);
                                        }
                                        else {
                                            console.warn(`[Scraping] No dataset ID for batch ${batchNum}`);
                                        }
                                    }
                                    else {
                                        const status = reviewsFinishedRun?.status || 'UNKNOWN';
                                        console.warn(`[Scraping] Reviews scraper failed for batch ${batchNum} with status: ${status}. Continuing with next batch.`);
                                    }
                                    if (i + batchSize < roomUrls.length) {
                                        console.log(`[Scraping] Waiting ${rateLimitDelay} seconds before next batch...`);
                                        await new Promise(resolve => setTimeout(resolve, rateLimitDelay * 1000));
                                    }
                                }
                                catch (batchError) {
                                    console.error(`[Scraping] Error processing batch ${batchNum}:`, batchError);
                                }
                            }
                            console.log(`[Scraping] Total reviews collected: ${allReviews.length}`);
                            listingsWithReviews = this.mergeReviewsWithListings(listings, allReviews);
                            console.log(`[Scraping] Merged reviews with listings`);
                        }
                        else {
                            console.warn(`[Scraping] No room URLs extracted. Proceeding without reviews.`);
                        }
                    }
                    catch (reviewError) {
                        console.error(`[Scraping] Error during reviews scraping:`, reviewError);
                        console.warn(`[Scraping] Proceeding with listings data without reviews.`);
                    }
                }
                else {
                    if (!reviewsActorId) {
                        console.log(`[Scraping] APIFY_ACTOR_ID_REVIEWS not configured. Skipping reviews scraping.`);
                    }
                }
                await this.prisma.scrapeRun.update({
                    where: { id: scrapeRun.id },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                    },
                });
                await this.ingestionService.ingestData(trackedUrlId, userId, listingsWithReviews, scrapeRun.id);
            }
            else {
                throw new Error(`Apify run failed: ${finishedRun.status}`);
            }
        }
        catch (error) {
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
            const friendlyError = new Error(detailedError);
            if (error instanceof Error && 'statusCode' in error) {
                friendlyError.statusCode = error.statusCode;
            }
            throw friendlyError;
        }
        return scrapeRun;
    }
    async waitForReviewsCompletion(runId, timeoutSeconds = 300) {
        const startTime = Date.now();
        const timeout = timeoutSeconds * 1000;
        const pollInterval = parseInt(this.configService.get('REVIEW_POLL_INTERVAL') || '10', 10) * 1000;
        console.log(`[Scraping] Waiting for reviews scraper (run ID: ${runId}) to complete...`);
        console.log(`[Scraping] Timeout: ${timeoutSeconds}s, Poll interval: ${pollInterval / 1000}s`);
        while (Date.now() - startTime < timeout) {
            try {
                const run = await this.apifyClient.run(runId).get();
                const status = run.status;
                if (status === 'SUCCEEDED') {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    console.log(`[Scraping] ✅ Reviews scraper completed successfully! Duration: ${elapsed}s`);
                    return run;
                }
                else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT' || status === 'TIMING-OUT' || status === 'ABORTING') {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    console.error(`[Scraping] ❌ Reviews scraper ${status.toLowerCase()} after ${elapsed}s`);
                    return run;
                }
                else if (status === 'READY' || status === 'RUNNING') {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    console.log(`[Scraping] ⏳ Status: ${status} | Elapsed: ${elapsed}s`);
                }
                else {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    console.log(`[Scraping] ⏳ Status: ${status} | Elapsed: ${elapsed}s`);
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            catch (error) {
                console.error(`[Scraping] Error checking reviews scraper status:`, error);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        const elapsedMinutes = Math.floor(timeoutSeconds / 60);
        console.error(`[Scraping] ❌ Reviews scraper timed out after ${elapsedMinutes} minutes`);
        console.error(`[Scraping] The scrape may still be running. Check Apify console: https://console.apify.com/actor-runs/${runId}`);
        return null;
    }
    mergeReviewsWithListings(listings, reviewsData) {
        const reviewsByRoom = new Map();
        const reviewsWithoutRoom = [];
        for (const reviewEntry of reviewsData) {
            let reviewRoomId = null;
            const startUrl = reviewEntry.startUrl || reviewEntry.start_url || '';
            if (startUrl) {
                const urlStr = typeof startUrl === 'string' ? startUrl : (startUrl.url || '');
                reviewRoomId = (0, url_utils_1.extractRoomIdFromUrl)(urlStr);
            }
            if (!reviewRoomId) {
                const reviewee = reviewEntry.reviewee;
                if (reviewee && typeof reviewee === 'object') {
                    const profilePath = reviewee.profilePath || reviewee.profile_path;
                    if (profilePath) {
                        reviewRoomId = (0, url_utils_1.extractRoomIdFromUrl)(profilePath);
                    }
                }
            }
            if (!reviewRoomId) {
                reviewRoomId = reviewEntry.roomId || reviewEntry.room_id || null;
            }
            if (reviewRoomId) {
                const roomIdStr = String(reviewRoomId);
                if (!reviewsByRoom.has(roomIdStr)) {
                    reviewsByRoom.set(roomIdStr, []);
                }
                reviewsByRoom.get(roomIdStr).push(reviewEntry);
            }
            else {
                reviewsWithoutRoom.push(reviewEntry);
                console.warn(`[Scraping] Could not extract room_id from review.startUrl: ${startUrl}`);
            }
        }
        if (reviewsWithoutRoom.length > 0) {
            console.warn(`[Scraping] ${reviewsWithoutRoom.length} reviews could not be matched to a room_id`);
        }
        console.log(`[Scraping] Mapped ${Array.from(reviewsByRoom.values()).reduce((sum, reviews) => sum + reviews.length, 0)} reviews to ${reviewsByRoom.size} rooms`);
        for (const listing of listings) {
            let listingId = null;
            listingId = listing.roomId || listing.id || listing.listingId || null;
            if (!listingId) {
                const listingUrl = listing.url || listing.listingUrl || listing.roomUrl || '';
                listingId = (0, url_utils_1.extractRoomIdFromUrl)(listingUrl);
            }
            if (listingId) {
                const listingIdStr = String(listingId);
                if (reviewsByRoom.has(listingIdStr)) {
                    listing.reviews = reviewsByRoom.get(listingIdStr) || [];
                    console.log(`[Scraping] Matched ${listing.reviews.length} reviews to listing ${listingIdStr}`);
                }
                else {
                    listing.reviews = [];
                }
            }
            else {
                listing.reviews = [];
                console.warn(`[Scraping] Could not extract listing_id from listing`);
            }
        }
        return listings;
    }
    async getScrapeStatus(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id: trackedUrlId, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        const runs = await this.prisma.scrapeRun.findMany({
            where: { trackedUrlId },
            orderBy: { startedAt: 'desc' },
            take: 10,
        });
        return runs;
    }
};
exports.ScrapingService = ScrapingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapingService.prototype, "scheduledScrape", null);
exports.ScrapingService = ScrapingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        ingestion_service_1.IngestionService])
], ScrapingService);
//# sourceMappingURL=scraping.service.js.map