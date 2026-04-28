import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('players')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top 20 players in the world by goals (UCL, PL, La Liga current season)' })
  topPlayers() {
    return this.playersService.topPlayers();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search players with filters' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'position', required: false, description: 'GK | DEF | MID | FWD | ATT | ALL' })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'leagueId', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'name_asc | name_desc | goals | assists' })
  @ApiQuery({ name: 'order', required: false, description: 'asc | desc' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 20, max 50' })
  search(
    @Query('name') name?: string,
    @Query('position') position?: string,
    @Query('teamId') teamId?: string,
    @Query('leagueId') leagueId?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playersService.search({
      name,
      position,
      teamId: teamId ? parseInt(teamId, 10) : undefined,
      leagueId: leagueId ? parseInt(leagueId, 10) : undefined,
      sort,
      order,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('leagues')
  @ApiOperation({ summary: 'Get list of top leagues (for dropdown)' })
  getLeagues() {
    return this.playersService.getLeagues();
  }

  @Get('teams')
  @ApiOperation({ summary: 'Get teams, optionally filtered by league' })
  @ApiQuery({ name: 'leagueId', required: false, type: Number })
  getTeams(@Query('leagueId') leagueId?: string) {
    return this.playersService.getTeams(leagueId ? parseInt(leagueId, 10) : undefined);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get top 4 similar players by position and stats' })
  findSimilar(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findSimilar(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player details by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }
}
