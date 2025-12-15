import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);

  constructor(private prisma: PrismaService) {}

  async findAllSnapshots(
    listingId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Verify listing belongs to user
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        trackedUrl: {
          userId,
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    const skip = (page - 1) * limit;
    const where: {
      listingId: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      listingId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [snapshots, total] = await Promise.all([
      this.prisma.listingSnapshot.findMany({
        where: {
          ...where,
          listing: {
            trackedUrl: {
              userId,
            },
          },
        },
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
        take: Math.min(limit, 300), // Max 300
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listingSnapshot.count({
        where: {
          ...where,
          listing: {
            trackedUrl: {
              userId,
            },
          },
        },
      }),
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

  async findOneSnapshot(id: string, userId: string) {
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
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    return snapshot;
  }

  async compareSnapshots(fromId: string, toId: string, userId: string) {
    const [fromSnapshot, toSnapshot] = await Promise.all([
      this.findOneSnapshot(fromId, userId),
      this.findOneSnapshot(toId, userId),
    ]);

    if (fromSnapshot.listingId !== toSnapshot.listingId) {
      throw new BadRequestException('Snapshots must be from the same listing');
    }

        this.logger.debug(`Comparing snapshots: from=${fromId}, to=${toId}`);

    // Calculate differences
    const descriptionDiff = this.compareText(
      fromSnapshot.description || '',
      toSnapshot.description || '',
    );

    const amenitiesDiff = this.compareAmenities(
      (fromSnapshot.amenities as any) || [],
      (toSnapshot.amenities as any) || [],
    );

    const photosDiff = this.comparePhotos(
      fromSnapshot.photos || [],
      toSnapshot.photos || [],
    );

    // Group reviews by month
    const reviewsByMonth = this.groupReviewsByMonth(
      fromSnapshot.reviews || [],
      toSnapshot.reviews || [],
    );

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

  private compareText(from: string, to: string) {
    return {
      from,
      to,
      changed: from !== to,
    };
  }

  private compareAmenities(from: any[], to: any[]) {
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

  private comparePhotos(from: any[], to: any[]) {
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

  private groupReviewsByMonth(from: any[], to: any[]) {
    const fromByMonth = new Map<string, any[]>();
    const toByMonth = new Map<string, any[]>();
    const fromWithoutDate: any[] = [];
    const toWithoutDate: any[] = [];

        this.logger.debug(`Grouping reviews: from=${from?.length || 0}, to=${to?.length || 0}`);

    from.forEach((review) => {
      if (review.date) {
        try {
          const month = new Date(review.date).toISOString().slice(0, 7);
          if (!fromByMonth.has(month)) {
            fromByMonth.set(month, []);
          }
          fromByMonth.get(month)!.push(review);
        } catch (e) {
          this.logger.warn(`Invalid date for review: ${review.date}`, e instanceof Error ? e.stack : String(e));
          fromWithoutDate.push(review);
        }
      } else {
        // Include reviews without dates in a special "Unknown" month
        fromWithoutDate.push(review);
      }
    });

    to.forEach((review) => {
      if (review.date) {
        try {
          const month = new Date(review.date).toISOString().slice(0, 7);
          if (!toByMonth.has(month)) {
            toByMonth.set(month, []);
          }
          toByMonth.get(month)!.push(review);
        } catch (e) {
          this.logger.warn(`Invalid date for review: ${review.date}`, e instanceof Error ? e.stack : String(e));
          toWithoutDate.push(review);
        }
      } else {
        // Include reviews without dates in a special "Unknown" month
        toWithoutDate.push(review);
      }
    });

    const allMonths = new Set([...fromByMonth.keys(), ...toByMonth.keys()]);
    
    // Add "Unknown" month if there are reviews without dates
    if (fromWithoutDate.length > 0 || toWithoutDate.length > 0) {
      allMonths.add('Unknown');
    }

    const result = Array.from(allMonths)
      .sort()
      .reverse()
      .map((month) => {
        if (month === 'Unknown') {
          return {
            month: 'Unknown Date',
            from: fromWithoutDate,
            to: toWithoutDate,
          };
        }
        return {
          month: new Date(`${month}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          from: fromByMonth.get(month) || [],
          to: toByMonth.get(month) || [],
        };
      });

        this.logger.debug(`Grouped reviews into ${result.length} month groups`);
    return result;
  }
}
