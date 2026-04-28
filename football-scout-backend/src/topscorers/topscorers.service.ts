import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawTopscorer {
  id: number;
  season_id: number;
  player_id: number;
  type_id: number;
  position: number;
  total: number;
  participant_id: number;
  player?: {
    id: number;
    name: string;
    common_name: string;
    display_name?: string;
    image_path: string;
    date_of_birth: string;
  };
  participant?: {
    id: number;
    name: string;
    image_path: string;
  };
  type?: {
    id: number;
    name: string;
    developer_name: string;
  };
}

// Maps user-friendly type names to Sportmonks developer_name values
const TYPE_MAP: Record<string, string> = {
  goals: 'GOAL_TOPSCORER',
  assists: 'ASSIST_TOPSCORER',
  redcards: 'REDCARDS',
  yellowcards: 'YELLOWCARDS',
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: RawTopscorer[];
  expiresAt: number;
}

@Injectable()
export class TopscorersService {
  private readonly include = 'player;participant;type';
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly apiFootball: ApiFootballService) {}

  async findBySeason(seasonId: number, type?: string) {
    const raw = await this.fetchAll(`topscorers/seasons/${seasonId}`);
    return this.filterAndSort(raw, type);
  }

  async findByStage(stageId: number, type?: string) {
    const raw = await this.fetchAll(`topscorers/stages/${stageId}`);
    return this.filterAndSort(raw, type);
  }

  private async fetchAll(endpoint: string): Promise<RawTopscorer[]> {
    const cached = this.cache.get(endpoint);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const raw = (await this.apiFootball.getAll(endpoint, {
      include: this.include,
    })) as unknown as RawTopscorer[];

    this.cache.set(endpoint, {
      data: raw,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return raw;
  }

  private filterAndSort(data: RawTopscorer[], type?: string): RawTopscorer[] {
    let result = data;
    if (type) {
      const developerName = TYPE_MAP[type.toLowerCase()];
      if (developerName) {
        result = data.filter(
          (entry) => entry.type?.developer_name === developerName,
        );
      }
    }
    return result.sort((a, b) => b.total - a.total);
  }
}
