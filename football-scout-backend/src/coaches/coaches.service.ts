import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawCoach {
  id: number;
  player_id: number | null;
  sport_id: number;
  country_id: number;
  nationality_id: number;
  city_id: number | null;
  gender: string;
  firstname: string;
  lastname: string;
  name: string;
  display_name: string;
  image_path: string;
  height: number | null;
  weight: number | null;
  date_of_birth: string | null;
  nationality?: { id: number; name: string; image_path: string };
  country?: { id: number; name: string; image_path: string };
  teams?: Array<{
    id: number;
    name: string;
    image_path: string;
    meta: { starts_at: string | null; ends_at: string | null; active: boolean };
  }>;
}

@Injectable()
export class CoachesService {
  private readonly include = 'nationality;country;teams';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async findAll() {
    return this.apiFootball.get<RawCoach[]>('coaches', { include: this.include });
  }

  async findOne(id: number) {
    return this.apiFootball.get<RawCoach>(`coaches/${id}`, { include: this.include });
  }

  async findByTeam(teamId: number) {
    return this.apiFootball.get<RawCoach[]>('coaches', {
      include: this.include,
      filters: `teamIds:${teamId}`,
    });
  }

  async search(name: string) {
    return this.apiFootball.get<RawCoach[]>(
      `coaches/search/${encodeURIComponent(name)}`,
      { include: this.include },
    );
  }

  async getLatestUpdated() {
    return this.apiFootball.get<RawCoach[]>('coaches/latest', {
      include: this.include,
    });
  }
}
