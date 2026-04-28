import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { LivescoresController } from './livescores.controller';
import { LivescoresService } from './livescores.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [LivescoresController],
  providers: [LivescoresService],
})
export class LivescoresModule {}
