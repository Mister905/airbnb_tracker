import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngestDto } from './dto/ingest.dto';

@Controller('api/ingest')
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  async ingest(@Request() req, @Body() dto: IngestDto) {
    return this.ingestionService.ingestData(
      dto.trackedUrlId,
      req.user.userId,
      dto.data,
      dto.scrapeRunId,
    );
  }
}
