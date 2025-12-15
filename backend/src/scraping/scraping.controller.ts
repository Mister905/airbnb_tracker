import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManualScrapeDto } from './dto/manual-scrape.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('manual-scrape')
  async manualScrape(@Request() req, @Body() dto: ManualScrapeDto) {
    return this.scrapingService.manualScrape(dto.trackedUrlId, req.user.userId);
  }

  @Get('scrape-status/:trackedUrlId')
  getScrapeStatus(@Param('trackedUrlId') trackedUrlId: string, @Request() req) {
    return this.scrapingService.getScrapeStatus(trackedUrlId, req.user.userId);
  }
}
