import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top 10 teams in the world by points (PL + La Liga current season)' })
  topTeams() {
    return this.teamsService.topTeams();
  }

  @Get()
  @ApiOperation({ summary: 'Get teams by season ID' })
  @ApiQuery({ name: 'seasonId', required: true, type: Number, description: 'Sportmonks season ID' })
  findBySeason(@Query('seasonId', ParseIntPipe) seasonId: number) {
    return this.teamsService.findBySeason(seasonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team details by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/squad')
  @ApiOperation({ summary: 'Get current squad for a team' })
  getSquad(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.getSquad(id);
  }

  @Get(':id/starting11')
  @ApiOperation({ summary: 'Get starting 11 from the most recent fixture for a team' })
  getStartingEleven(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.getStartingEleven(id);
  }

  @Get(':id/squad/detailed')
  @ApiOperation({ summary: 'Get current squad with position names, height and weight' })
  getSquadDetailed(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.getSquadDetailed(id);
  }
}
