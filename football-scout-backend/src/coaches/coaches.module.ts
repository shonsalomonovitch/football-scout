import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [CoachesController],
  providers: [CoachesService],
})
export class CoachesModule {}
