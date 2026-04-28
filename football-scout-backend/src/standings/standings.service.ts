import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

interface RawStanding {
  id: number;
  participant_id: number;
  league_id: number;
  season_id: number;
  position: number;
  result: string;
  points: number;
  participant?: {
    id: number;
    name: string;
    image_path: string;
  };
  details?: Array<{
    id: number;
    type_id: number;
    value: number;
    type?: {
      id: number;
      name: string;
      developer_name: string;
    };
  }>;
}

@Injectable()
export class StandingsService {
  private readonly include = 'participant;details.type';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async getStandings(seasonId: number) {
    const raw = await this.apiFootball.get<RawStanding[]>(
      `standings/seasons/${seasonId}`,
      { include: this.include },
    );
    return (raw ?? []).map((entry) => this.normalize(entry));
  }

  async getByRound(roundId: number) {
    const raw = await this.apiFootball.get<RawStanding[]>(
      `standings/rounds/${roundId}`,
      { include: this.include },
    );
    return (raw ?? []).map((entry) => this.normalize(entry));
  }

  async getLiveByLeague(leagueId: number) {
    const raw = await this.apiFootball.get<RawStanding[]>(
      `standings/live/leagues/${leagueId}`,
      { include: this.include },
    );
    return (raw ?? []).map((entry) => this.normalize(entry));
  }

  private normalize(entry: RawStanding) {
    return {
      position: entry.position,
      points: entry.points,
      result: entry.result,
      team: entry.participant
        ? {
            id: entry.participant.id,
            name: entry.participant.name,
            logo: entry.participant.image_path,
          }
        : null,
      details: (entry.details ?? []).map((d) => ({
        name: d.type?.name ?? `type_${d.type_id}`,
        developerName: d.type?.developer_name ?? null,
        value: d.value,
      })),
    };
  }
}
