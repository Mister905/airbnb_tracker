import { ListingsService } from './listings.service';
import { CreateTrackedUrlDto, UpdateTrackedUrlDto } from './dto/tracked-url.dto';
export declare class ListingsController {
    private readonly listingsService;
    constructor(listingsService: ListingsService);
    createTrackedUrl(req: any, createDto: CreateTrackedUrlDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        enabled: boolean;
        userId: string;
    }>;
    findAllTrackedUrls(req: any): Promise<({
        listing: {
            snapshots: {
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
            }[];
        } & {
            id: string;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            description: string | null;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        enabled: boolean;
        userId: string;
    })[]>;
    findOneTrackedUrl(id: string, req: any): Promise<{
        listing: {
            snapshots: {
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
            }[];
        } & {
            id: string;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            description: string | null;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        enabled: boolean;
        userId: string;
    }>;
    updateTrackedUrl(id: string, req: any, updateDto: UpdateTrackedUrlDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        enabled: boolean;
        userId: string;
    }>;
    removeTrackedUrl(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        enabled: boolean;
        userId: string;
    }>;
    findAllListings(req: any, page?: number, limit?: number): Promise<{
        data: ({
            trackedUrl: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                url: string;
                enabled: boolean;
                userId: string;
            };
            snapshots: {
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
            }[];
            _count: {
                snapshots: number;
                photos: number;
                reviews: number;
            };
        } & {
            id: string;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            description: string | null;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOneListing(id: string, req: any): Promise<{
        trackedUrl: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            url: string;
            enabled: boolean;
            userId: string;
        };
        snapshots: {
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
        }[];
        _count: {
            snapshots: number;
            photos: number;
            reviews: number;
        };
    } & {
        id: string;
        trackedUrlId: string;
        airbnbId: string | null;
        title: string | null;
        description: string | null;
        location: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
