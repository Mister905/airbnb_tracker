import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { ScrapingModule } from './scraping/scraping.module';
import { IngestionModule } from './ingestion/ingestion.module';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file manually before ConfigModule to ensure DATABASE_URL is available
// process.cwd() returns the directory where the command is run from (project root when running from backend/)
const rootEnvPath = path.resolve(process.cwd(), '..', '.env');
const localEnvPath = path.resolve(process.cwd(), '.env');
const backendEnvPath = path.resolve(__dirname, '..', '..', '.env');

// Try to load .env from root directory first (where it actually is)
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath });
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        rootEnvPath,
        backendEnvPath,
        localEnvPath,
        '.env',
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ListingsModule,
    SnapshotsModule,
    ScrapingModule,
    IngestionModule,
  ],
})
export class AppModule {}
