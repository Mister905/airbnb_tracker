import { PrismaService } from '../prisma/prisma.service';
export declare class SnapshotsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllSnapshots(listingId: string, userId: string, page?: number, limit?: number, startDate?: Date, endDate?: Date): Promise<{
        data: ({
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
            photos: {
                url: string;
                id: string;
                createdAt: Date;
                listingId: string;
                order: number | null;
                snapshotId: string | null;
                caption: string | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                date: Date | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
            }[];
        } & {
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOneSnapshot(id: string, userId: string): Promise<{
        listing: {
            trackedUrl: {
                url: string;
                enabled: boolean;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
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
        };
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
        photos: {
            url: string;
            id: string;
            createdAt: Date;
            listingId: string;
            order: number | null;
            snapshotId: string | null;
            caption: string | null;
        }[];
        reviews: {
            id: string;
            createdAt: Date;
            listingId: string;
            rating: number | null;
            snapshotId: string | null;
            date: Date | null;
            reviewId: string;
            reviewerName: string | null;
            reviewerAvatar: string | null;
            comment: string | null;
        }[];
    } & {
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
    compareSnapshots(fromId: string, toId: string, userId: string): Promise<{
        from: {
            listing: {
                trackedUrl: {
                    url: string;
                    enabled: boolean;
                    id: string;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
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
            };
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
            photos: {
                url: string;
                id: string;
                createdAt: Date;
                listingId: string;
                order: number | null;
                snapshotId: string | null;
                caption: string | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                date: Date | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
            }[];
        } & {
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
        };
        to: {
            listing: {
                trackedUrl: {
                    url: string;
                    enabled: boolean;
                    id: string;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
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
            };
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
            photos: {
                url: string;
                id: string;
                createdAt: Date;
                listingId: string;
                order: number | null;
                snapshotId: string | null;
                caption: string | null;
            }[];
            reviews: {
                id: string;
                createdAt: Date;
                listingId: string;
                rating: number | null;
                snapshotId: string | null;
                date: Date | null;
                reviewId: string;
                reviewerName: string | null;
                reviewerAvatar: string | null;
                comment: string | null;
            }[];
        } & {
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
    private compareText;
    private compareAmenities;
    private comparePhotos;
    private groupReviewsByMonth;
}
