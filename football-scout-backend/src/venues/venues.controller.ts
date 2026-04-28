import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('venues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search venues by name' })
  @ApiQuery({ name: 'name', required: true })
  search(@Query('name') name: string) {
    return this.venuesService.search(name);
  }

  @Get('seasons/:seasonId')
  @ApiOperation({ summary: 'Get all venues for a season' })
  findBySeason(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.venuesService.findBySeason(seasonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.venuesService.findOne(id);
  }
}
