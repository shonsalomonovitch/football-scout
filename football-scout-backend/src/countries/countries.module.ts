import { Module } from '@nestjs/common';
import { ApiFootballModule } from '../api-football/api-football.module';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [ApiFootballModule],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
