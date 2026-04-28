import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawSeason {
  id: number;
  name: string;
  finished: boolean;
  is_current?: boolean;
  starting_at: string;
  ending_at: string;
}

export interface RawLeague {
  id: number;
  name: string;
  active: boolean;
  type: string;
  sub_type: string;
  image_path: string;
  country?: {
    id: number;
    name: string;
    image_path: string;
  };
  currentSeason?: RawSeason & { teams_count?: number };
  seasons?: RawSeason[];
}

@Injectable()
export class LeaguesService {
  constructor(private readonly apiFootball: ApiFootballService) {}

  async findAll(query: { search?: string; country?: string; current?: boolean }) {
    const include = 'country;currentSeason;seasons';

    let leagues: RawLeague[];
    if (query.search) {
      leagues = await this.apiFootball.get<RawLeague[]>(
        `leagues/search/${encodeURIComponent(query.search)}`,
        { include },
      ) ?? [];
    } else {
      leagues = await this.apiFootball.get<RawLeague[]>('leagues', { include }) ?? [];
    }

    const withCounts = await Promise.all(leagues.map((l) => this.attachTeamsCount(l)));
    return withCounts.map(this.normalize);
  }

  async findOne(id: number) {
    const raw = await this.apiFootball.get<RawLeague>(`leagues/${id}`, {
      include: 'country;currentSeason;seasons',
    });
    const withCount = await this.attachTeamsCount(raw);
    return this.normalize(withCount);
  }

  private async attachTeamsCount(league: RawLeague): Promise<RawLeague> {
    const seasons = league.seasons ?? [];
    const currentSeason =
      league.currentSeason ?? seasons.find((s) => s.is_current) ?? null;
    if (!currentSeason) return league;

    const teams = await this.apiFootball
      .get<Array<{ id: number }>>(`teams/seasons/${currentSeason.id}`)
      .catch(() => null);

    return {
      ...league,
      currentSeason: { ...currentSeason, teams_count: teams?.length ?? 0 },
    };
  }

  private normalize(item: RawLeague) {
    const seasons = item.seasons ?? [];
    const currentSeason =
      item.currentSeason ??
      seasons.find((s) => s.is_current) ??
      null;

    return {
      id: item.id,
      name: item.name,
      active: item.active,
      type: item.type,
      subType: item.sub_type,
      logo: item.image_path,
      country: item.country
        ? {
            id: item.country.id,
            name: item.country.name,
            flag: item.country.image_path,
          }
        : null,
      currentSeason: currentSeason
        ? {
            id: currentSeason.id,
            name: currentSeason.name,
            finished: currentSeason.finished,
            starting_at: currentSeason.starting_at,
            ending_at: currentSeason.ending_at,
            teamsCount: (currentSeason as RawSeason & { teams_count?: number }).teams_count ?? 0,
          }
        : null,
      seasons,
    };
  }
}
