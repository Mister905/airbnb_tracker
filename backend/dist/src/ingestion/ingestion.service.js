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
            console.log('[Ingestion] No data provided to ingest');
            return;
        }
        console.log(`[Ingestion] Processing ${data.length} item(s) from Apify`);
        const listingData = data[0];
        console.log('[Ingestion] Data keys:', Object.keys(listingData));
        if (listingData.photos) {
            console.log('[Ingestion] Photos found:', Array.isArray(listingData.photos) ? listingData.photos.length : 'not an array');
        }
        if (listingData.reviews) {
            console.log('[Ingestion] Reviews found:', Array.isArray(listingData.reviews) ? listingData.reviews.length : 'not an array');
        }
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
        let priceValue = null;
        if (listingData.price !== undefined && listingData.price !== null) {
            if (typeof listingData.price === 'number') {
                priceValue = listingData.price;
            }
            else if (typeof listingData.price === 'object') {
                const priceObj = listingData.price;
                priceValue = priceObj.amount || priceObj.value || priceObj.price || priceObj.total || null;
                if (priceValue !== null && typeof priceValue !== 'number') {
                    priceValue = parseFloat(String(priceValue)) || null;
                }
            }
            else if (typeof listingData.price === 'string') {
                priceValue = parseFloat(listingData.price) || null;
            }
        }
        let currencyValue = listingData.currency;
        if (!currencyValue && typeof listingData.price === 'object' && listingData.price !== null) {
            const priceObj = listingData.price;
            currencyValue = priceObj.currency || priceObj.currencyCode || null;
        }
        let ratingValue = null;
        if (listingData.rating !== undefined && listingData.rating !== null) {
            if (typeof listingData.rating === 'number') {
                ratingValue = listingData.rating;
            }
            else if (typeof listingData.rating === 'object') {
                const ratingObj = listingData.rating;
                ratingValue = ratingObj.value || ratingObj.rating || ratingObj.score || ratingObj.average || null;
                if (ratingValue !== null && typeof ratingValue !== 'number') {
                    ratingValue = parseFloat(String(ratingValue)) || null;
                }
            }
            else if (typeof listingData.rating === 'string') {
                ratingValue = parseFloat(listingData.rating) || null;
            }
        }
        let reviewCountValue = null;
        if (listingData.reviewCount !== undefined && listingData.reviewCount !== null) {
            if (typeof listingData.reviewCount === 'number') {
                reviewCountValue = listingData.reviewCount;
            }
            else if (typeof listingData.reviewCount === 'object') {
                const reviewCountObj = listingData.reviewCount;
                reviewCountValue = reviewCountObj.value || reviewCountObj.count || reviewCountObj.total || null;
                if (reviewCountValue !== null && typeof reviewCountValue !== 'number') {
                    reviewCountValue = parseInt(String(reviewCountValue), 10) || null;
                }
            }
            else if (typeof listingData.reviewCount === 'string') {
                reviewCountValue = parseInt(listingData.reviewCount, 10) || null;
            }
        }
        if (!reviewCountValue && listingData.rating && typeof listingData.rating === 'object' && listingData.rating !== null) {
            const ratingObj = listingData.rating;
            const reviewsCount = ratingObj.reviewsCount || ratingObj.reviewCount || ratingObj.count;
            if (reviewsCount !== undefined && reviewsCount !== null) {
                reviewCountValue = typeof reviewsCount === 'number' ? reviewsCount : parseInt(String(reviewsCount), 10) || null;
            }
        }
        let normalizedAmenities = [];
        if (listingData.amenities && Array.isArray(listingData.amenities)) {
            for (const category of listingData.amenities) {
                if (category && typeof category === 'object' && category.values && Array.isArray(category.values)) {
                    for (const amenity of category.values) {
                        if (amenity && typeof amenity === 'object') {
                            if (amenity.available === true || amenity.available === 'true') {
                                const amenityTitle = amenity.title || amenity.name || amenity.label || String(amenity);
                                if (amenityTitle) {
                                    normalizedAmenities.push(amenityTitle);
                                }
                            }
                        }
                        else if (typeof amenity === 'string') {
                            normalizedAmenities.push(amenity);
                        }
                    }
                }
                else if (typeof category === 'string') {
                    normalizedAmenities.push(category);
                }
                else if (category && typeof category === 'object') {
                    const categoryName = category.title || category.name || category.label;
                    if (categoryName) {
                        normalizedAmenities.push(categoryName);
                    }
                }
            }
        }
        else if (Array.isArray(listingData.amenities)) {
            normalizedAmenities = listingData.amenities;
        }
        console.log(`[Ingestion] Extracted ${normalizedAmenities.length} amenities from nested structure`);
        const snapshot = await this.prisma.listingSnapshot.create({
            data: {
                listingId: listing.id,
                version: nextVersion,
                description: listingData.description,
                amenities: normalizedAmenities.length > 0 ? normalizedAmenities : (listingData.amenities || []),
                price: priceValue,
                currency: currencyValue,
                rating: ratingValue,
                reviewCount: reviewCountValue,
            },
        });
        if (scrapeRunId) {
            await this.prisma.scrapeRun.update({
                where: { id: scrapeRunId },
                data: { snapshotId: snapshot.id },
            });
        }
        let photos = [];
        if (listingData.images && Array.isArray(listingData.images)) {
            photos = listingData.images;
        }
        else if (listingData.image_urls && Array.isArray(listingData.image_urls)) {
            photos = listingData.image_urls;
        }
        else if (listingData.photos && Array.isArray(listingData.photos)) {
            photos = listingData.photos;
        }
        else if (listingData.photoUrls && Array.isArray(listingData.photoUrls)) {
            photos = listingData.photoUrls;
        }
        if (photos.length > 0) {
            console.log(`[Ingestion] Processing ${photos.length} photos for listing ${listing.id}`);
            await Promise.all(photos.map((photo, index) => {
                let photoUrl = null;
                let photoCaption = null;
                if (typeof photo === 'string') {
                    photoUrl = photo;
                }
                else if (typeof photo === 'object' && photo !== null) {
                    const photoObj = photo;
                    photoUrl = photoObj.imageUrl || photoObj.url || photoObj.src || photoObj.href || null;
                    photoCaption = photoObj.caption || photoObj.alt || photoObj.title || photoObj.description || null;
                }
                if (!photoUrl) {
                    console.warn(`[Ingestion] Skipping photo at index ${index} - no URL found:`, photo);
                    return Promise.resolve(null);
                }
                return this.prisma.photo.create({
                    data: {
                        listingId: listing.id,
                        snapshotId: snapshot.id,
                        url: photoUrl,
                        caption: photoCaption,
                        order: index,
                    },
                });
            }));
        }
        else {
            console.log(`[Ingestion] No photos found in data. Available keys:`, Object.keys(listingData));
            if (listingData.images) {
                console.log(`[Ingestion] images field exists but is not an array:`, typeof listingData.images, listingData.images);
            }
        }
        const reviews = listingData.reviews || listingData.reviewsList || listingData.reviewList || [];
        if (Array.isArray(reviews) && reviews.length > 0) {
            console.log(`[Ingestion] Processing ${reviews.length} reviews for listing ${listing.id}`);
            await Promise.all(reviews.map((review) => {
                let reviewerName = null;
                const reviewerObj = review.reviewer;
                if (reviewerObj && typeof reviewerObj === 'object') {
                    reviewerName = reviewerObj.name ||
                        reviewerObj.fullName ||
                        reviewerObj.firstName ||
                        reviewerObj.displayName ||
                        null;
                }
                else {
                    reviewerName = review.reviewerName ||
                        review.author ||
                        review.name ||
                        (typeof review.reviewer === 'string' ? review.reviewer : null) ||
                        null;
                }
                let rating = null;
                const ratingValue = review.rating || review.stars || review.score || null;
                if (ratingValue !== null && ratingValue !== undefined) {
                    if (typeof ratingValue === 'string') {
                        rating = parseFloat(ratingValue) || null;
                    }
                    else {
                        rating = Number(ratingValue);
                    }
                    rating = rating !== null && Number.isInteger(rating) ? Math.floor(rating) : rating;
                }
                const comment = review.text ||
                    review.localizedText ||
                    review.localizedReview ||
                    review.comment ||
                    review.review_text ||
                    review.reviewText ||
                    review.content ||
                    null;
                let date = null;
                const dateValue = review.createdAt ||
                    review.localizedDate ||
                    review.publishedAt ||
                    review.reviewDate ||
                    review.date ||
                    review.published_at ||
                    null;
                if (dateValue) {
                    try {
                        date = new Date(dateValue);
                        if (isNaN(date.getTime())) {
                            date = null;
                        }
                    }
                    catch (e) {
                        date = null;
                    }
                }
                const reviewId = review.review_id ||
                    review.id ||
                    review.reviewId ||
                    `${reviewerName || 'unknown'}_${date ? date.toISOString().split('T')[0] : Date.now()}`;
                const reviewerAvatar = review.reviewerAvatar ||
                    review.avatar ||
                    review.reviewer_avatar ||
                    (reviewerObj && typeof reviewerObj === 'object' ? reviewerObj.avatar || reviewerObj.avatarUrl : null) ||
                    null;
                if (!reviewId) {
                    console.warn(`[Ingestion] Skipping review - no ID found:`, review);
                    return Promise.resolve(null);
                }
                console.log(`[Ingestion] Processing review: id=${reviewId}, author=${reviewerName}, rating=${rating}, hasComment=${!!comment}, date=${date}`);
                return this.prisma.review.upsert({
                    where: { reviewId },
                    create: {
                        listingId: listing.id,
                        snapshotId: snapshot.id,
                        reviewId,
                        reviewerName,
                        reviewerAvatar,
                        rating,
                        comment,
                        date,
                    },
                    update: {
                        snapshotId: snapshot.id,
                        rating,
                        comment,
                    },
                });
            }));
        }
        else {
            console.log(`[Ingestion] No reviews found in data. Available keys:`, Object.keys(listingData));
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