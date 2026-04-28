import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawRound {
  id: number;
  sport_id: number;
  league_id: number;
  season_id: number;
  stage_id: number;
  name: string;
  finished: boolean;
  is_current: boolean;
  starting_at: string;
  ending_at: string;
  games_in_current_week: boolean;
}

@Injectable()
export class RoundsService {
  constructor(private readonly apiFootball: ApiFootballService) {}

  async findOne(id: number) {
    return this.apiFootball.get<RawRound>(`rounds/${id}`, {
      include: 'sport;league;season;stage',
    });
  }

  async findBySeason(seasonId: number) {
    return this.apiFootball.get<RawRound[]>(`rounds/seasons/${seasonId}`);
  }

  async search(name: string) {
    return this.apiFootball.get<RawRound[]>(
      `rounds/search/${encodeURIComponent(name)}`,
    );
  }
}
