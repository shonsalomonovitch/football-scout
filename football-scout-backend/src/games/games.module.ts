import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ApiFootballModule } from '../api-football/api-football.module';

@Module({
  imports: [ApiFootballModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
