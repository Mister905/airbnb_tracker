import { ScrapingService } from './scraping.service';
import { ManualScrapeDto } from './dto/manual-scrape.dto';
export declare class ScrapingController {
    private readonly scrapingService;
    constructor(scrapingService: ScrapingService);
    manualScrape(req: any, dto: ManualScrapeDto): Promise<{
        error: string | null;
        id: string;
        trackedUrlId: string | null;
        snapshotId: string | null;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        apifyRunId: string | null;
    }>;
    getScrapeStatus(trackedUrlId: string, req: any): Promise<{
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
