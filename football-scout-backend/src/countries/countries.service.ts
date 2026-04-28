import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawCountry {
  id: number;
  continent_id: number;
  name: string;
  official_name: string | null;
  fifa_name: string | null;
  iso2: string | null;
  iso3: string | null;
  latitude: string | null;
  longitude: string | null;
  borders: string | null;
  image_path: string;
}

// Countries live under /v3/core, not /v3/football
const CORE_BASE = 'https://api.sportmonks.com/v3/core';

@Injectable()
export class CountriesService {
  constructor(private readonly apiFootball: ApiFootballService) {}

  async findAll() {
    return this.apiFootball.get<RawCountry[]>('countries', {}, CORE_BASE);
  }

  async findOne(id: number) {
    return this.apiFootball.get<RawCountry>(`countries/${id}`, {}, CORE_BASE);
  }

  async search(name: string) {
    return this.apiFootball.get<RawCountry[]>(
      `countries/search/${encodeURIComponent(name)}`,
      {},
      CORE_BASE,
    );
  }
}
