import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateTrackedUrlDto, UpdateTrackedUrlDto } from './dto/tracked-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post('tracked-urls')
  createTrackedUrl(@Request() req, @Body() createDto: CreateTrackedUrlDto) {
    return this.listingsService.createTrackedUrl(req.user.userId, createDto);
  }

  @Get('tracked-urls')
  findAllTrackedUrls(@Request() req) {
    return this.listingsService.findAllTrackedUrls(req.user.userId);
  }

  @Get('tracked-urls/:id')
  findOneTrackedUrl(@Param('id') id: string, @Request() req) {
    return this.listingsService.findOneTrackedUrl(id, req.user.userId);
  }

  @Patch('tracked-urls/:id')
  updateTrackedUrl(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateTrackedUrlDto,
  ) {
    return this.listingsService.updateTrackedUrl(id, req.user.userId, updateDto);
  }

  @Delete('tracked-urls/:id')
  removeTrackedUrl(@Param('id') id: string, @Request() req) {
    return this.listingsService.removeTrackedUrl(id, req.user.userId);
  }

  @Get()
  findAllListings(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listingsService.findAllListings(
      req.user.userId,
      page || 1,
      limit || 50,
    );
  }

  @Get(':id')
  findOneListing(@Param('id') id: string, @Request() req) {
    return this.listingsService.findOneListing(id, req.user.userId);
  }
}
