import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow multiple origins for CORS (local dev + Vercel production)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://airbnb-tracker-beta.vercel.app',
    'https://airbnb-tracker-git-master-james-mccarthys-projects-1b023043.vercel.app',
    // Allow any Vercel preview deployment
    /^https:\/\/airbnb-tracker.*\.vercel\.app$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed origin
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
