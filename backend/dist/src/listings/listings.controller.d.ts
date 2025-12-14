import { ListingsService } from './listings.service';
import { CreateTrackedUrlDto, UpdateTrackedUrlDto } from './dto/tracked-url.dto';
export declare class ListingsController {
    private readonly listingsService;
    constructor(listingsService: ListingsService);
    createTrackedUrl(req: any, createDto: CreateTrackedUrlDto): Promise<{
        url: string;
        enabled: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllTrackedUrls(req: any): Promise<({
        listing: {
            snapshots: {
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
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            location: string | null;
        };
    } & {
        url: string;
        enabled: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOneTrackedUrl(id: string, req: any): Promise<{
        listing: {
            snapshots: {
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
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            location: string | null;
        };
    } & {
        url: string;
        enabled: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTrackedUrl(id: string, req: any, updateDto: UpdateTrackedUrlDto): Promise<{
        url: string;
        enabled: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeTrackedUrl(id: string, req: any): Promise<{
        url: string;
        enabled: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllListings(req: any, page?: number, limit?: number): Promise<{
        data: ({
            trackedUrl: {
                url: string;
                enabled: boolean;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            snapshots: {
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
            }[];
            _count: {
                photos: number;
                reviews: number;
                snapshots: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            trackedUrlId: string;
            airbnbId: string | null;
            title: string | null;
            location: string | null;
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
            url: string;
            enabled: boolean;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        snapshots: {
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
        }[];
        _count: {
            photos: number;
            reviews: number;
            snapshots: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        trackedUrlId: string;
        airbnbId: string | null;
        title: string | null;
        location: string | null;
    }>;
}
