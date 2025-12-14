import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackedUrlDto, UpdateTrackedUrlDto } from './dto/tracked-url.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async createTrackedUrl(userId: string, dto: CreateTrackedUrlDto) {
    return this.prisma.trackedUrl.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAllTrackedUrls(userId: string) {
    return this.prisma.trackedUrl.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            snapshots: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTrackedUrl(id: string, userId: string) {
    const url = await this.prisma.trackedUrl.findFirst({
      where: { id, userId },
      include: {
        listing: {
          include: {
            snapshots: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${id} not found`);
    }

    return url;
  }

  async updateTrackedUrl(id: string, userId: string, dto: UpdateTrackedUrlDto) {
    const url = await this.prisma.trackedUrl.findFirst({
      where: { id, userId },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${id} not found`);
    }

    return this.prisma.trackedUrl.update({
      where: { id },
      data: dto,
    });
  }

  async removeTrackedUrl(id: string, userId: string) {
    const url = await this.prisma.trackedUrl.findFirst({
      where: { id, userId },
    });

    if (!url) {
      throw new NotFoundException(`Tracked URL with ID ${id} not found`);
    }

    return this.prisma.trackedUrl.delete({
      where: { id },
    });
  }

  async findAllListings(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: {
          trackedUrl: {
            userId,
          },
        },
        include: {
          trackedUrl: true,
          snapshots: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              snapshots: true,
              reviews: true,
              photos: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.listing.count({
        where: {
          trackedUrl: {
            userId,
          },
        },
      }),
    ]);

    return {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneListing(id: string, userId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        trackedUrl: {
          userId,
        },
      },
      include: {
        trackedUrl: true,
        snapshots: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            snapshots: true,
            reviews: true,
            photos: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }
}
