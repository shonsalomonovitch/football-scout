import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { ApiFootballModule } from '../api-football/api-football.module';

@Module({
  imports: [ApiFootballModule],
  controllers: [LeaguesController],
  providers: [LeaguesService],
})
export class LeaguesModule {}
