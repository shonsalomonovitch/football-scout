import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [VenuesController],
  providers: [VenuesService],
})
export class VenuesModule {}
