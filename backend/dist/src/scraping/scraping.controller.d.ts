import { ScrapingService } from './scraping.service';
export declare class ScrapingController {
    private readonly scrapingService;
    constructor(scrapingService: ScrapingService);
    manualScrape(req: any, body: {
        trackedUrlId: string;
    }): Promise<{
        error: string | null;
        id: string;
        trackedUrlId: string | null;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        apifyRunId: string | null;
        snapshotId: string | null;
    }>;
    getScrapeStatus(trackedUrlId: string, req: any): Promise<{
        error: string | null;
        id: string;
        trackedUrlId: string | null;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        apifyRunId: string | null;
        snapshotId: string | null;
    }[]>;
}
