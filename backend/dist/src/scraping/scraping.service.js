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
exports.ScrapingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const apify_client_1 = require("apify-client");
const ingestion_service_1 = require("../ingestion/ingestion.service");
let ScrapingService = class ScrapingService {
    constructor(prisma, configService, ingestionService) {
        this.prisma = prisma;
        this.configService = configService;
        this.ingestionService = ingestionService;
        const apifyToken = this.configService.get('APIFY_TOKEN');
        if (apifyToken) {
            this.apifyClient = new apify_client_1.ApifyClient({ token: apifyToken });
        }
    }
    async scheduledScrape() {
        console.log('Running scheduled scrape at midnight UTC');
        const enabledUrls = await this.prisma.trackedUrl.findMany({
            where: { enabled: true },
        });
        for (const url of enabledUrls) {
            try {
                await this.scrapeUrl(url.id, url.userId);
            }
            catch (error) {
                console.error(`Error scraping URL ${url.id}:`, error);
            }
        }
    }
    async manualScrape(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id: trackedUrlId, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        return this.scrapeUrl(trackedUrlId, userId);
    }
    async scrapeUrl(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findUnique({
            where: { id: trackedUrlId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        const scrapeRun = await this.prisma.scrapeRun.create({
            data: {
                trackedUrlId,
                status: 'pending',
            },
        });
        try {
            if (!this.apifyClient) {
                throw new Error('Apify client not configured');
            }
            const actorId = this.configService.get('APIFY_ACTOR_ID') || 'airbnb-scraper';
            const run = await this.apifyClient.actor(actorId).call({
                startUrls: [{ url: url.url }],
            });
            await this.prisma.scrapeRun.update({
                where: { id: scrapeRun.id },
                data: {
                    apifyRunId: run.id,
                    status: 'running',
                },
            });
            const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
            if (finishedRun.status === 'SUCCEEDED') {
                const dataset = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
                await this.prisma.scrapeRun.update({
                    where: { id: scrapeRun.id },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                    },
                });
                await this.ingestionService.ingestData(trackedUrlId, userId, dataset.items, scrapeRun.id);
            }
            else {
                throw new Error(`Apify run failed: ${finishedRun.status}`);
            }
        }
        catch (error) {
            await this.prisma.scrapeRun.update({
                where: { id: scrapeRun.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    completedAt: new Date(),
                },
            });
            throw error;
        }
        return scrapeRun;
    }
    async getScrapeStatus(trackedUrlId, userId) {
        const url = await this.prisma.trackedUrl.findFirst({
            where: { id: trackedUrlId, userId },
        });
        if (!url) {
            throw new common_1.NotFoundException(`Tracked URL with ID ${trackedUrlId} not found`);
        }
        const runs = await this.prisma.scrapeRun.findMany({
            where: { trackedUrlId },
            orderBy: { startedAt: 'desc' },
            take: 10,
        });
        return runs;
    }
};
exports.ScrapingService = ScrapingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScrapingService.prototype, "scheduledScrape", null);
exports.ScrapingService = ScrapingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        ingestion_service_1.IngestionService])
], ScrapingService);
//# sourceMappingURL=scraping.service.js.map