import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/ingest')
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  async ingest(
    @Request() req,
    @Body() body: {
      trackedUrlId: string;
      data: any[];
      scrapeRunId: string;
    },
  ) {
    return this.ingestionService.ingestData(
      body.trackedUrlId,
      req.user.userId,
      body.data,
      body.scrapeRunId,
    );
  }
}
