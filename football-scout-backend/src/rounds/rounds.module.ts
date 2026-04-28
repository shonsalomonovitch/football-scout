import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [RoundsController],
  providers: [RoundsService],
})
export class RoundsModule {}
