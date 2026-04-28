import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FixturesService } from './fixtures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('fixtures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Get()
  @ApiOperation({ summary: 'Get fixtures by date, date range, or live if no params given' })
  @ApiQuery({ name: 'date', required: false, description: 'Exact date YYYY-MM-DD' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date YYYY-MM-DD (use with to)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date YYYY-MM-DD (use with from)' })
  @ApiQuery({ name: 'team', required: false, type: Number, description: 'Team ID (use with from/to)' })
  findAll(
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('team') team?: number,
  ) {
    return this.fixturesService.findAll({ date, from, to, team });
  }

  @Get('head-to-head/:team1/:team2')
  @ApiOperation({ summary: 'Get head-to-head history between two teams' })
  headToHead(
    @Param('team1', ParseIntPipe) team1: number,
    @Param('team2', ParseIntPipe) team2: number,
  ) {
    return this.fixturesService.headToHead(team1, team2);
  }

  @Get(':id/lineups')
  @ApiOperation({ summary: 'Get starting 11 and bench for both teams in a fixture' })
  getLineups(@Param('id', ParseIntPipe) id: number) {
    return this.fixturesService.getLineups(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fixture details by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fixturesService.findOne(id);
  }
}
