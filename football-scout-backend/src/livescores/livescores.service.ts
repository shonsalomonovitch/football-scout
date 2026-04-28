import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

interface RawLivescore {
  id: number;
  name: string;
  starting_at: string;
  starting_at_timestamp: number;
  league_id: number;
  season_id: number;
  result_info: string | null;
  length: number;
  state?: { id: number; name: string; short_name: string };
  venue?: { id: number; name: string; city: string };
  periods?: Array<{
    id: number;
    started: number;
    ended: number | null;
    sort_order: number;
    type_id: number;
    ticking: boolean;
    minutes: number;
    seconds: number;
    description: string;
  }>;
  participants?: Array<{
    id: number;
    name: string;
    image_path: string;
    meta: { location: string; winner: boolean | null; position: number };
  }>;
  scores?: Array<{
    id: number;
    type_id: number;
    participant_id: number;
    score: { goals: number; participant: string };
    description: string;
  }>;
  events?: Array<{
    id: number;
    type_id: number;
    participant_id: number;
    player_id: number | null;
    minute: number;
    extra_minute: number | null;
    injured: boolean;
    on_bench: boolean;
    result: string | null;
    info: string | null;
  }>;
}

@Injectable()
export class LivescoresService {
  private readonly include = 'participants;scores;state;venue;periods;events';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async getAll() {
    // Includes fixtures 15 min before kickoff and up to 15 min after final whistle
    const raw = await this.apiFootball.get<RawLivescore[]>('livescores', {
      include: this.include,
    });
    return (raw ?? []).map((item) => this.normalize(item));
  }

  async getInplay() {
    const raw = await this.apiFootball.get<RawLivescore[]>('livescores/inplay', {
      include: this.include,
    });
    return (raw ?? []).map((item) => this.normalize(item));
  }

  async getLatestUpdated() {
    // Fixtures updated in the last 10 seconds
    const raw = await this.apiFootball.get<RawLivescore[]>('livescores/latest', {
      include: this.include,
    });
    return (raw ?? []).map((item) => this.normalize(item));
  }

  private normalize(item: RawLivescore) {
    const home =
      item.participants?.find((p) => p.meta.location === 'home') ?? null;
    const away =
      item.participants?.find((p) => p.meta.location === 'away') ?? null;

    const homeGoals =
      item.scores
        ?.filter(
          (s) => s.participant_id === home?.id && s.description === 'CURRENT',
        )
        .reduce((acc, s) => acc + s.score.goals, 0) ?? null;
    const awayGoals =
      item.scores
        ?.filter(
          (s) => s.participant_id === away?.id && s.description === 'CURRENT',
        )
        .reduce((acc, s) => acc + s.score.goals, 0) ?? null;

    const activePeriod = item.periods?.find((p) => p.ticking);

    return {
      id: item.id,
      name: item.name,
      startingAt: item.starting_at,
      leagueId: item.league_id,
      seasonId: item.season_id,
      minute: activePeriod?.minutes ?? null,
      state: item.state ?? null,
      venue: item.venue ?? null,
      teams: {
        home: home
          ? {
              id: home.id,
              name: home.name,
              logo: home.image_path,
              winner: home.meta.winner,
            }
          : null,
        away: away
          ? {
              id: away.id,
              name: away.name,
              logo: away.image_path,
              winner: away.meta.winner,
            }
          : null,
      },
      score: { home: homeGoals, away: awayGoals },
      events: (item.events ?? []).map((e) => ({
        id: e.id,
        typeId: e.type_id,
        participantId: e.participant_id,
        playerId: e.player_id,
        minute: e.minute,
        extraMinute: e.extra_minute,
        info: e.info,
      })),
    };
  }
}
