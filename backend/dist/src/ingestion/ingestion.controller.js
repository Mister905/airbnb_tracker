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
exports.IngestionController = void 0;
const common_1 = require("@nestjs/common");
const ingestion_service_1 = require("./ingestion.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ingest_dto_1 = require("./dto/ingest.dto");
let IngestionController = class IngestionController {
    constructor(ingestionService) {
        this.ingestionService = ingestionService;
    }
    async ingest(req, dto) {
        return this.ingestionService.ingestData(dto.trackedUrlId, req.user.userId, dto.data, dto.scrapeRunId);
    }
};
exports.IngestionController = IngestionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ingest_dto_1.IngestDto]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "ingest", null);
exports.IngestionController = IngestionController = __decorate([
    (0, common_1.Controller)('api/ingest'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], IngestionController);
//# sourceMappingURL=ingestion.controller.js.map