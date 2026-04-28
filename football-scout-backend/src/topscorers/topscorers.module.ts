import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { TopscorersController } from './topscorers.controller';
import { TopscorersService } from './topscorers.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [TopscorersController],
  providers: [TopscorersService],
})
export class TopscorersModule {}
