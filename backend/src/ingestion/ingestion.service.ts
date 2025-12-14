import { Injectable } from '@nestjs/common';
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
  photos?: Array<{ url: string; caption?: string }>;
  reviews?: Array<{
    id: string;
    reviewerName?: string;
    reviewerAvatar?: string;
    rating?: number;
    comment?: string;
    date?: string;
  }>;
}

@Injectable()
export class IngestionService {
  constructor(private prisma: PrismaService) {}

  async ingestData(
    trackedUrlId: string,
    userId: string,
    data: ApifyListingData[],
    scrapeRunId: string,
  ) {
    if (!data || data.length === 0) {
      return;
    }

    const listingData = data[0]; // Assuming single listing per URL

    // Find or create listing
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
    } else {
      // Update listing if needed
      listing = await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          title: listingData.title,
          description: listingData.description,
          location: listingData.location,
        },
      });
    }

    // Get latest snapshot version
    const latestSnapshot = await this.prisma.listingSnapshot.findFirst({
      where: { listingId: listing.id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestSnapshot?.version || 0) + 1;

    // Create new snapshot
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

    // Link the scrape run to the snapshot
    if (scrapeRunId) {
      await this.prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: { snapshotId: snapshot.id },
      });
    }

    // Ingest photos
    if (listingData.photos && listingData.photos.length > 0) {
      await Promise.all(
        listingData.photos.map((photo, index) =>
          this.prisma.photo.create({
            data: {
              listingId: listing.id,
              snapshotId: snapshot.id,
              url: photo.url,
              caption: photo.caption,
              order: index,
            },
          }),
        ),
      );
    }

    // Ingest reviews
    if (listingData.reviews && listingData.reviews.length > 0) {
      await Promise.all(
        listingData.reviews.map((review) =>
          this.prisma.review.upsert({
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
          }),
        ),
      );
    }

    return snapshot;
  }
}
