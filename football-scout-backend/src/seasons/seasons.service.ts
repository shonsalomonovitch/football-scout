import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawSeason {
  id: number;
  sport_id: number;
  league_id: number;
  name: string;
  finished: boolean;
  pending: boolean;
  is_current: boolean;
  starting_at: string;
  ending_at: string;
  standings_recalculated_at: string | null;
  games_in_current_week: boolean;
  league?: {
    id: number;
    name: string;
    image_path: string;
  };
}

@Injectable()
export class SeasonsService {
  constructor(private readonly apiFootball: ApiFootballService) {}

  async findAll() {
    return this.apiFootball.get<RawSeason[]>('seasons', { include: 'league' });
  }

  async findOne(id: number) {
    return this.apiFootball.get<RawSeason>(`seasons/${id}`, {
      include: 'league;stages',
    });
  }

  async findByTeam(teamId: number) {
    return this.apiFootball.get<RawSeason[]>(`seasons/teams/${teamId}`, {
      include: 'league',
    });
  }

  async search(name: string) {
    return this.apiFootball.get<RawSeason[]>(
      `seasons/search/${encodeURIComponent(name)}`,
      { include: 'league' },
    );
  }
}
