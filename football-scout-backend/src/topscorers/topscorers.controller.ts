import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TopscorersService } from './topscorers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('topscorers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('topscorers')
export class TopscorersController {
  constructor(private readonly topscorersService: TopscorersService) {}

  @Get('seasons/:seasonId/goals')
  @ApiOperation({ summary: 'Top goal scorers for a season' })
  getGoals(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.topscorersService.findBySeason(seasonId, 'goals');
  }

  @Get('seasons/:seasonId/assists')
  @ApiOperation({ summary: 'Top assist providers for a season' })
  getAssists(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.topscorersService.findBySeason(seasonId, 'assists');
  }

  @Get('seasons/:seasonId/redcards')
  @ApiOperation({ summary: 'Most red cards for a season' })
  getRedCards(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.topscorersService.findBySeason(seasonId, 'redcards');
  }

  @Get('seasons/:seasonId/yellowcards')
  @ApiOperation({ summary: 'Most yellow cards for a season' })
  getYellowCards(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.topscorersService.findBySeason(seasonId, 'yellowcards');
  }
}
