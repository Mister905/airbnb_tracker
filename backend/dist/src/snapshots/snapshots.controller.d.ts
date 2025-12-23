import { SnapshotsService } from './snapshots.service';
export declare class SnapshotsController {
    private readonly snapshotsService;
    constructor(snapshotsService: SnapshotsService);
    findAllSnapshots(listingId: string, req: any, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        data: ({
            photos: {
                id: string;
                createdAt: Date;
                listingId: string;
                snapshotId: string | null;
                url: string;
                caption: string | null;
                order: number | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
                date: Date | null;
            }[];
            scrapeRun: {
                error: string | null;
                id: string;
                trackedUrlId: string | null;
                snapshotId: string | null;
                status: string;
                startedAt: Date;
                completedAt: Date | null;
                apifyRunId: string | null;
            };
        } & {
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOneSnapshot(id: string, req: any): Promise<{
        listing: {
            trackedUrl: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                url: string;
                enabled: boolean;
                userId: string;
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
        };
        photos: {
            id: string;
            createdAt: Date;
            listingId: string;
            snapshotId: string | null;
            url: string;
            caption: string | null;
            order: number | null;
        }[];
        reviews: {
            id: string;
            createdAt: Date;
            listingId: string;
            rating: number | null;
            snapshotId: string | null;
            reviewId: string;
            reviewerName: string | null;
            reviewerAvatar: string | null;
            comment: string | null;
            date: Date | null;
        }[];
        scrapeRun: {
            error: string | null;
            id: string;
            trackedUrlId: string | null;
            snapshotId: string | null;
            status: string;
            startedAt: Date;
            completedAt: Date | null;
            apifyRunId: string | null;
        };
    } & {
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
    compareSnapshots(fromId: string, toId: string, req: any): Promise<{
        from: {
            listing: {
                trackedUrl: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    url: string;
                    enabled: boolean;
                    userId: string;
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
            };
            photos: {
                id: string;
                createdAt: Date;
                listingId: string;
                snapshotId: string | null;
                url: string;
                caption: string | null;
                order: number | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
                date: Date | null;
            }[];
            scrapeRun: {
                error: string | null;
                id: string;
                trackedUrlId: string | null;
                snapshotId: string | null;
                status: string;
                startedAt: Date;
                completedAt: Date | null;
                apifyRunId: string | null;
            };
        } & {
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
        };
        to: {
            listing: {
                trackedUrl: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    url: string;
                    enabled: boolean;
                    userId: string;
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
            };
            photos: {
                id: string;
                createdAt: Date;
                listingId: string;
                snapshotId: string | null;
                url: string;
                caption: string | null;
                order: number | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
                date: Date | null;
            }[];
            scrapeRun: {
                error: string | null;
                id: string;
                trackedUrlId: string | null;
                snapshotId: string | null;
                status: string;
                startedAt: Date;
                completedAt: Date | null;
                apifyRunId: string | null;
            };
        } & {
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
        };
        diffs: {
            description: {
                from: string;
                to: string;
                changed: boolean;
            };
            amenities: {
                from: any[];
                to: any[];
                added: any[];
                removed: any[];
                unchanged: any[];
                changed: boolean;
            };
            photos: {
                from: any[];
                to: any[];
                added: any[];
                removed: any[];
                changed: boolean;
            };
            reviews: {
                month: string;
                from: any[];
                to: any[];
            }[];
            price: {
                from: number;
                to: number;
                changed: boolean;
            };
            rating: {
                from: number;
                to: number;
                changed: boolean;
            };
            reviewCount: {
                from: number;
                to: number;
                changed: boolean;
            };
        };
    }>;
}
