import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ApiFootballModule } from '../api-football/api-football.module';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [ApiFootballModule, PlayersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
