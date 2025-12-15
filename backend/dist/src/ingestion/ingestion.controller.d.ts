import { IngestionService } from './ingestion.service';
export declare class IngestionController {
    private readonly ingestionService;
    constructor(ingestionService: IngestionService);
    ingest(req: any, body: {
        trackedUrlId: string;
        data: any[];
        scrapeRunId: string;
    }): Promise<{
        id: string;
        version: number;
        description: string | null;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        price: number | null;
        currency: string | null;
        rating: number | null;
        reviewCount: number | null;
        createdAt: Date;
        listingId: string;
    }>;
}
