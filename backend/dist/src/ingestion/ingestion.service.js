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
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IngestionService = class IngestionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ingestData(trackedUrlId, userId, data, scrapeRunId) {
        if (!data || data.length === 0) {
            return;
        }
        const listingData = data[0];
        let listing = await this.prisma.listing.findUnique({
            where: { trackedUrlId },
        });
        if (!listing) {
            listing = await this.prisma.listing.create({
                data: {
                    trackedUrlId,
                    airbnbId: listingData.id,
                    title: listingData.title,
                    description: listingData.description,
                    location: listingData.location,
                },
            });
        }
        else {
            listing = await this.prisma.listing.update({
                where: { id: listing.id },
                data: {
                    title: listingData.title,
                    description: listingData.description,
                    location: listingData.location,
                },
            });
        }
        const latestSnapshot = await this.prisma.listingSnapshot.findFirst({
            where: { listingId: listing.id },
            orderBy: { version: 'desc' },
        });
        const nextVersion = (latestSnapshot?.version || 0) + 1;
        const snapshot = await this.prisma.listingSnapshot.create({
            data: {
                listingId: listing.id,
                version: nextVersion,
                description: listingData.description,
                amenities: listingData.amenities || [],
                price: listingData.price,
                currency: listingData.currency,
                rating: listingData.rating,
                reviewCount: listingData.reviewCount,
            },
        });
        if (scrapeRunId) {
            await this.prisma.scrapeRun.update({
                where: { id: scrapeRunId },
                data: { snapshotId: snapshot.id },
            });
        }
        if (listingData.photos && listingData.photos.length > 0) {
            await Promise.all(listingData.photos.map((photo, index) => this.prisma.photo.create({
                data: {
                    listingId: listing.id,
                    snapshotId: snapshot.id,
                    url: photo.url,
                    caption: photo.caption,
                    order: index,
                },
            })));
        }
        if (listingData.reviews && listingData.reviews.length > 0) {
            await Promise.all(listingData.reviews.map((review) => this.prisma.review.upsert({
                where: { reviewId: review.id },
                create: {
                    listingId: listing.id,
                    snapshotId: snapshot.id,
                    reviewId: review.id,
                    reviewerName: review.reviewerName,
                    reviewerAvatar: review.reviewerAvatar,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.date ? new Date(review.date) : null,
                },
                update: {
                    snapshotId: snapshot.id,
                    rating: review.rating,
                    comment: review.comment,
                },
            })));
        }
        return snapshot;
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map