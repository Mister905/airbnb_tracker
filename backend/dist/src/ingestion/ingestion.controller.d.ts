import { IngestionService } from './ingestion.service';
import { IngestDto } from './dto/ingest.dto';
export declare class IngestionController {
    private readonly ingestionService;
    constructor(ingestionService: IngestionService);
    ingest(req: any, dto: IngestDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        version: number;
        listingId: string;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        price: number | null;
        currency: string | null;
        rating: number | null;
        reviewCount: number | null;
    }>;
}
