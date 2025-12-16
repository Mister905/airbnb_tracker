"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://airbnb-tracker-beta.vercel.app',
        'https://airbnb-tracker-git-master-james-mccarthys-projects-1b023043.vercel.app',
        /^https:\/\/airbnb-tracker.*\.vercel\.app$/,
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const isAllowed = allowedOrigins.some(allowed => {
                if (typeof allowed === 'string') {
                    return origin === allowed;
                }
                else if (allowed instanceof RegExp) {
                    return allowed.test(origin);
                }
                return false;
            });
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map