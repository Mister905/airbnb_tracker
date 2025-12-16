import { PrismaService } from '../prisma/prisma.service';
interface ApifyListingData {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    price?: number | {
        amount?: number;
        value?: number;
        price?: number;
        total?: number;
        currency?: string;
        currencyCode?: string;
    } | string;
    currency?: string;
    rating?: number | {
        value?: number;
        rating?: number;
        score?: number;
        average?: number;
    } | string;
    reviewCount?: number | {
        value?: number;
        count?: number;
        total?: number;
    } | string;
    amenities?: any[];
    photos?: Array<{
        url: string;
        caption?: string;
    }>;
    images?: Array<{
        url: string;
        caption?: string;
    } | string>;
    photoUrls?: string[];
    reviews?: Array<{
        id: string;
        reviewerName?: string;
        reviewerAvatar?: string;
        rating?: number;
        comment?: string;
        date?: string;
    }>;
    reviewsList?: Array<any>;
    reviewList?: Array<any>;
    [key: string]: any;
}
export declare class IngestionService {
    private prisma;
    private readonly logger;
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
