import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/snapshots')
@UseGuards(JwtAuthGuard)
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  findAllSnapshots(
    @Query('listing_id') listingId: string,
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    return this.snapshotsService.findAllSnapshots(
      listingId,
      req.user.userId,
      page || 1,
      limit || 50,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  findOneSnapshot(@Param('id') id: string, @Request() req) {
    return this.snapshotsService.findOneSnapshot(id, req.user.userId);
  }

  @Get('compare/:fromId/:toId')
  compareSnapshots(
    @Param('fromId') fromId: string,
    @Param('toId') toId: string,
    @Request() req,
  ) {
    return this.snapshotsService.compareSnapshots(fromId, toId, req.user.userId);
  }
}
