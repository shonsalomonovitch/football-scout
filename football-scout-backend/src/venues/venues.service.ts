import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawVenue {
  id: number;
  country_id: number;
  city_id: number | null;
  name: string;
  address: string | null;
  zipcode: string | null;
  latitude: string | null;
  longitude: string | null;
  capacity: number | null;
  image_path: string;
  city?: { id: number; name: string };
  country?: { id: number; name: string; image_path: string };
}

@Injectable()
export class VenuesService {
  private readonly include = 'country;city';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async findOne(id: number) {
    return this.apiFootball.get<RawVenue>(`venues/${id}`, { include: this.include });
  }

  async findBySeason(seasonId: number) {
    return this.apiFootball.get<RawVenue[]>(`venues/seasons/${seasonId}`, {
      include: this.include,
    });
  }

  async search(name: string) {
    return this.apiFootball.get<RawVenue[]>(
      `venues/search/${encodeURIComponent(name)}`,
      { include: this.include },
    );
  }
}
