import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [SeasonsController],
  providers: [SeasonsService],
})
export class SeasonsModule {}
