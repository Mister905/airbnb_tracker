"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const listings_module_1 = require("./listings/listings.module");
const snapshots_module_1 = require("./snapshots/snapshots.module");
const scraping_module_1 = require("./scraping/scraping.module");
const ingestion_module_1 = require("./ingestion/ingestion.module");
const path = require("path");
const fs = require("fs");
const rootEnvPath = path.resolve(process.cwd(), '..', '.env');
const localEnvPath = path.resolve(process.cwd(), '.env');
const backendEnvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
}
else if (fs.existsSync(backendEnvPath)) {
    require('dotenv').config({ path: backendEnvPath });
}
else if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    rootEnvPath,
                    backendEnvPath,
                    localEnvPath,
                    '.env',
                ],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            listings_module_1.ListingsModule,
            snapshots_module_1.SnapshotsModule,
            scraping_module_1.ScrapingModule,
            ingestion_module_1.IngestionModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map