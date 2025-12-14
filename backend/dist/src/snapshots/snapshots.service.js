"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SnapshotsService = class SnapshotsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllSnapshots(listingId, userId, page = 1, limit = 50, startDate, endDate) {
        const listing = await this.prisma.listing.findFirst({
            where: {
                id: listingId,
                trackedUrl: {
                    userId,
                },
            },
        });
        if (!listing) {
            throw new common_1.NotFoundException(`Listing with ID ${listingId} not found`);
        }
        const skip = (page - 1) * limit;
        const where = {
            listingId,
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [snapshots, total] = await Promise.all([
            this.prisma.listingSnapshot.findMany({
                where,
                include: {
                    photos: {
                        orderBy: { order: 'asc' },
                    },
                    reviews: {
                        orderBy: { date: 'desc' },
                    },
                    scrapeRun: true,
                },
                skip,
                take: Math.min(limit, 300),
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.listingSnapshot.count({ where }),
        ]);
        return {
            data: snapshots,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOneSnapshot(id, userId) {
        const snapshot = await this.prisma.listingSnapshot.findFirst({
            where: {
                id,
                listing: {
                    trackedUrl: {
                        userId,
                    },
                },
            },
            include: {
                listing: {
                    include: {
                        trackedUrl: true,
                    },
                },
                photos: {
                    orderBy: { order: 'asc' },
                },
                reviews: {
                    orderBy: { date: 'desc' },
                },
                scrapeRun: true,
            },
        });
        if (!snapshot) {
            throw new common_1.NotFoundException(`Snapshot with ID ${id} not found`);
        }
        return snapshot;
    }
    async compareSnapshots(fromId, toId, userId) {
        const [fromSnapshot, toSnapshot] = await Promise.all([
            this.findOneSnapshot(fromId, userId),
            this.findOneSnapshot(toId, userId),
        ]);
        if (fromSnapshot.listingId !== toSnapshot.listingId) {
            throw new common_1.BadRequestException('Snapshots must be from the same listing');
        }
        const descriptionDiff = this.compareText(fromSnapshot.description || '', toSnapshot.description || '');
        const amenitiesDiff = this.compareAmenities(fromSnapshot.amenities || [], toSnapshot.amenities || []);
        const photosDiff = this.comparePhotos(fromSnapshot.photos, toSnapshot.photos);
        const reviewsByMonth = this.groupReviewsByMonth(fromSnapshot.reviews, toSnapshot.reviews);
        return {
            from: fromSnapshot,
            to: toSnapshot,
            diffs: {
                description: descriptionDiff,
                amenities: amenitiesDiff,
                photos: photosDiff,
                reviews: reviewsByMonth,
                price: {
                    from: fromSnapshot.price,
                    to: toSnapshot.price,
                    changed: fromSnapshot.price !== toSnapshot.price,
                },
                rating: {
                    from: fromSnapshot.rating,
                    to: toSnapshot.rating,
                    changed: fromSnapshot.rating !== toSnapshot.rating,
                },
                reviewCount: {
                    from: fromSnapshot.reviewCount,
                    to: toSnapshot.reviewCount,
                    changed: fromSnapshot.reviewCount !== toSnapshot.reviewCount,
                },
            },
        };
    }
    compareText(from, to) {
        return {
            from,
            to,
            changed: from !== to,
        };
    }
    compareAmenities(from, to) {
        const fromSet = new Set(from.map((a) => a.id || a.name));
        const toSet = new Set(to.map((a) => a.id || a.name));
        const added = to.filter((a) => !fromSet.has(a.id || a.name));
        const removed = from.filter((a) => !toSet.has(a.id || a.name));
        return {
            from,
            to,
            added,
            removed,
            changed: added.length > 0 || removed.length > 0,
        };
    }
    comparePhotos(from, to) {
        const fromUrls = new Set(from.map((p) => p.url));
        const toUrls = new Set(to.map((p) => p.url));
        const added = to.filter((p) => !fromUrls.has(p.url));
        const removed = from.filter((p) => !toUrls.has(p.url));
        return {
            from,
            to,
            added,
            removed,
            changed: added.length > 0 || removed.length > 0,
        };
    }
    groupReviewsByMonth(from, to) {
        const fromByMonth = new Map();
        const toByMonth = new Map();
        from.forEach((review) => {
            if (review.date) {
                const month = new Date(review.date).toISOString().slice(0, 7);
                if (!fromByMonth.has(month)) {
                    fromByMonth.set(month, []);
                }
                fromByMonth.get(month).push(review);
            }
        });
        to.forEach((review) => {
            if (review.date) {
                const month = new Date(review.date).toISOString().slice(0, 7);
                if (!toByMonth.has(month)) {
                    toByMonth.set(month, []);
                }
                toByMonth.get(month).push(review);
            }
        });
        const allMonths = new Set([...fromByMonth.keys(), ...toByMonth.keys()]);
        return Array.from(allMonths)
            .sort()
            .reverse()
            .map((month) => ({
            month,
            from: fromByMonth.get(month) || [],
            to: toByMonth.get(month) || [],
        }));
    }
};
exports.SnapshotsService = SnapshotsService;
exports.SnapshotsService = SnapshotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SnapshotsService);
//# sourceMappingURL=snapshots.service.js.map