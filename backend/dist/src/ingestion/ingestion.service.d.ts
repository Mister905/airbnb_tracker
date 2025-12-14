import { PrismaService } from '../prisma/prisma.service';
interface ApifyListingData {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    price?: number;
    currency?: string;
    rating?: number;
    reviewCount?: number;
    amenities?: any[];
    photos?: Array<{
        url: string;
        caption?: string;
    }>;
    reviews?: Array<{
        id: string;
        reviewerName?: string;
        reviewerAvatar?: string;
        rating?: number;
        comment?: string;
        date?: string;
    }>;
}
export declare class IngestionService {
    private prisma;
    constructor(prisma: PrismaService);
    ingestData(trackedUrlId: string, userId: string, data: ApifyListingData[], scrapeRunId: string): Promise<{
        id: string;
        createdAt: Date;
        listingId: string;
        version: number;
        description: string | null;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        price: number | null;
        currency: string | null;
        rating: number | null;
        reviewCount: number | null;
    }>;
}
export {};
