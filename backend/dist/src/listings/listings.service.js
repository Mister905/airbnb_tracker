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
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ListingsService = class ListingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTrackedUrl(userId, dto) {
        return this.prisma.trackedUrl.create({
            data: {
                ...dto,
                userId,
            },
        });
    }
    async findAllTrackedUrls(userId) {
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
    async findOneTrackedUrl(id, userId) {
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
            throw new common_1.NotFoundException(`Tracked URL with ID ${id} not found`);
        }
        return url;
    }
    async updateTrackedUrl(id, userId, dto) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${id} not found`);
        }
        return this.prisma.trackedUrl.update({
            where: { id },
            data: dto,
        });
    }
    async removeTrackedUrl(id, userId) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${id} not found`);
        }
        return this.prisma.trackedUrl.delete({
            where: { id },
        });
    }
    async findAllListings(userId, page = 1, limit = 50) {
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
    async findOneListing(id, userId) {
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
            throw new common_1.NotFoundException(`Listing with ID ${id} not found`);
        }
        return listing;
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map