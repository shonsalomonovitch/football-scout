import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StandingsService } from './standings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('standings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get standings by season ID' })
  @ApiQuery({ name: 'seasonId', required: true, type: Number })
  getStandings(@Query('seasonId', ParseIntPipe) seasonId: number) {
    return this.standingsService.getStandings(seasonId);
  }

  @Get('live/leagues/:leagueId')
  @ApiOperation({ summary: 'Get live standings for an ongoing league' })
  getLiveByLeague(@Param('leagueId', ParseIntPipe) leagueId: number) {
    return this.standingsService.getLiveByLeague(leagueId);
  }

  @Get('rounds/:roundId')
  @ApiOperation({ summary: 'Get standings for a specific round' })
  getByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.standingsService.getByRound(roundId);
  }
}
