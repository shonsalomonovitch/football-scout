import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rounds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search rounds by name' })
  @ApiQuery({ name: 'name', required: true })
  search(@Query('name') name: string) {
    return this.roundsService.search(name);
  }

  @Get('seasons/:seasonId')
  @ApiOperation({ summary: 'Get all rounds for a season' })
  findBySeason(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.roundsService.findBySeason(seasonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get round by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.findOne(id);
  }
}
