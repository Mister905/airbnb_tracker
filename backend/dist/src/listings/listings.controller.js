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
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const listings_service_1 = require("./listings.service");
const tracked_url_dto_1 = require("./dto/tracked-url.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ListingsController = class ListingsController {
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    createTrackedUrl(req, createDto) {
        return this.listingsService.createTrackedUrl(req.user.userId, createDto);
    }
    findAllTrackedUrls(req) {
        return this.listingsService.findAllTrackedUrls(req.user.userId);
    }
    findOneTrackedUrl(id, req) {
        return this.listingsService.findOneTrackedUrl(id, req.user.userId);
    }
    updateTrackedUrl(id, req, updateDto) {
        return this.listingsService.updateTrackedUrl(id, req.user.userId, updateDto);
    }
    removeTrackedUrl(id, req) {
        return this.listingsService.removeTrackedUrl(id, req.user.userId);
    }
    findAllListings(req, page, limit) {
        return this.listingsService.findAllListings(req.user.userId, page || 1, limit || 50);
    }
    findOneListing(id, req) {
        return this.listingsService.findOneListing(id, req.user.userId);
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, common_1.Post)('tracked-urls'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tracked_url_dto_1.CreateTrackedUrlDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "createTrackedUrl", null);
__decorate([
    (0, common_1.Get)('tracked-urls'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findAllTrackedUrls", null);
__decorate([
    (0, common_1.Get)('tracked-urls/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findOneTrackedUrl", null);
__decorate([
    (0, common_1.Patch)('tracked-urls/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tracked_url_dto_1.UpdateTrackedUrlDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "updateTrackedUrl", null);
__decorate([
    (0, common_1.Delete)('tracked-urls/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "removeTrackedUrl", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findAllListings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findOneListing", null);
exports.ListingsController = ListingsController = __decorate([
    (0, common_1.Controller)('api/listings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], ListingsController);
//# sourceMappingURL=listings.controller.js.map