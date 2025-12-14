import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from '../ingestion/ingestion.service';
export declare class ScrapingService {
    private prisma;
    private configService;
    private ingestionService;
    private apifyClient;
    constructor(prisma: PrismaService, configService: ConfigService, ingestionService: IngestionService);
    scheduledScrape(): Promise<void>;
    manualScrape(trackedUrlId: string, userId: string): Promise<{
        error: string | null;
        id: string;
        trackedUrlId: string | null;
        snapshotId: string | null;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        apifyRunId: string | null;
    }>;
    private scrapeUrl;
    getScrapeStatus(trackedUrlId: string, userId: string): Promise<{
        error: string | null;
        id: string;
        trackedUrlId: string | null;
        snapshotId: string | null;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        apifyRunId: string | null;
    }[]>;
}
