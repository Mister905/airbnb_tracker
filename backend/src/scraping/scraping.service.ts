import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { IngestionService } from '../ingestion/ingestion.service';

@Injectable()
export class ScrapingService {
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
    console.log('Running scheduled scrape at midnight UTC');
    
    const enabledUrls = await this.prisma.trackedUrl.findMany({
      where: { enabled: true },
    });

    for (const url of enabledUrls) {
      try {
        await this.scrapeUrl(url.id, url.userId);
      } catch (error) {
        console.error(`Error scraping URL ${url.id}:`, error);
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

    try {
      if (!this.apifyClient) {
        throw new Error('Apify client not configured');
      }

      const actorId = this.configService.get<string>('APIFY_ACTOR_ID') || 'airbnb-scraper';
      
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

      // Wait for completion and ingest
      const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
      
      if (finishedRun.status === 'SUCCEEDED') {
        const dataset = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
        
        await this.prisma.scrapeRun.update({
          where: { id: scrapeRun.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // Ingest the data
        await this.ingestionService.ingestData(
          trackedUrlId,
          userId,
          dataset.items as any[],
          scrapeRun.id,
        );
      } else {
        throw new Error(`Apify run failed: ${finishedRun.status}`);
      }
    } catch (error) {
      await this.prisma.scrapeRun.update({
        where: { id: scrapeRun.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }

    return scrapeRun;
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
