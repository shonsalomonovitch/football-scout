import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
