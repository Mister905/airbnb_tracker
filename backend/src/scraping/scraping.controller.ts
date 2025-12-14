import { Controller, Post, Get, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('manual-scrape')
  async manualScrape(@Request() req, @Body() body: { trackedUrlId: string }) {
    return this.scrapingService.manualScrape(body.trackedUrlId, req.user.userId);
  }

  @Get('scrape-status/:trackedUrlId')
  getScrapeStatus(@Param('trackedUrlId') trackedUrlId: string, @Request() req) {
    return this.scrapingService.getScrapeStatus(trackedUrlId, req.user.userId);
  }
}
