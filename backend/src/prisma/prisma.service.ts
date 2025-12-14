import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    // Try multiple ways to get DATABASE_URL
    const databaseUrl = 
      configService.get<string>('DATABASE_URL') || 
      process.env.DATABASE_URL ||
      configService.get('DATABASE_URL');
    
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not defined. Please check your .env file in the project root.'
      );
    }
    
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
