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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingController = void 0;
const common_1 = require("@nestjs/common");
const scraping_service_1 = require("./scraping.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const manual_scrape_dto_1 = require("./dto/manual-scrape.dto");
let ScrapingController = class ScrapingController {
    constructor(scrapingService) {
        this.scrapingService = scrapingService;
    }
    async manualScrape(req, dto) {
        return this.scrapingService.manualScrape(dto.trackedUrlId, req.user.userId);
    }
    getScrapeStatus(trackedUrlId, req) {
        return this.scrapingService.getScrapeStatus(trackedUrlId, req.user.userId);
    }
};
exports.ScrapingController = ScrapingController;
__decorate([
    (0, common_1.Post)('manual-scrape'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, manual_scrape_dto_1.ManualScrapeDto]),
    __metadata("design:returntype", Promise)
], ScrapingController.prototype, "manualScrape", null);
__decorate([
    (0, common_1.Get)('scrape-status/:trackedUrlId'),
    __param(0, (0, common_1.Param)('trackedUrlId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ScrapingController.prototype, "getScrapeStatus", null);
exports.ScrapingController = ScrapingController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scraping_service_1.ScrapingService])
], ScrapingController);
//# sourceMappingURL=scraping.controller.js.map