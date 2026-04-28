import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: number;
}

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('compare')
  @ApiOperation({ summary: 'Compare two players side-by-side for a given season' })
  @ApiQuery({ name: 'player1Id', type: Number })
  @ApiQuery({ name: 'player2Id', type: Number })
  @ApiQuery({ name: 'season', type: Number, description: 'e.g. 2023' })
  compare(
    @Query('player1Id', ParseIntPipe) player1Id: number,
    @Query('player2Id', ParseIntPipe) player2Id: number,
    @Query('season', ParseIntPipe) season: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.analyticsService.comparePlayers(player1Id, player2Id, season, user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get the current user comparison history' })
  history(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getHistory(user.id);
  }
}
