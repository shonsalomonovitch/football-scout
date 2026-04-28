import { Module } from '@nestjs/common';
import { StandingsController } from './standings.controller';
import { StandingsService } from './standings.service';
import { ApiFootballModule } from '../api-football/api-football.module';

@Module({
  imports: [ApiFootballModule],
  controllers: [StandingsController],
  providers: [StandingsService],
})
export class StandingsModule {}
