import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

interface RawPlayer {
  id: number;
  name: string;
  common_name: string;
  display_name: string;
  firstname: string;
  lastname: string;
  height: number | null;
  weight: number | null;
  date_of_birth: string;
  image_path: string;
  gender: string;
  nationality?: {
    id: number;
    name: string;
    image_path: string;
  };
  position?: {
    id: number;
    name: string;
  };
  statistics?: Array<{
    season_id: number;
    team_id: number;
    details?: Array<{
      type_id: number;
      value: { total: number | null; average: number | null };
      type?: { id: number; name: string; developer_name: string };
    }>;
  }>;
}

interface RawTeam {
  id: number;
  name: string;
  image_path: string;
}

interface RawSquadEntry {
  player_id: number;
  position_id: number;
  player?: RawPlayer;
}

const POSITION_MAP: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
  ATT: 'Attacker',
};

const TOP_LEAGUE_IDS = [8, 564, 82, 384, 301, 2];

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class PlayersService {
  private topPlayersCache: { data: unknown[]; expiresAt: number } | null = null;
  private allPlayersCache: { data: RawPlayer[]; expiresAt: number } | null = null;

  constructor(private readonly apiFootball: ApiFootballService) {}

  private async getAllPlayersPool(includeStats = false): Promise<RawPlayer[]> {
    if (
      !includeStats &&
      this.allPlayersCache &&
      this.allPlayersCache.expiresAt > Date.now()
    ) {
      return this.allPlayersCache.data;
    }

    const statsInclude = includeStats ? ';player.statistics.details.type' : '';

    const leagues = await Promise.all(
      TOP_LEAGUE_IDS.map((lid) =>
        this.apiFootball
          .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${lid}`, {
            include: 'seasons',
          })
          .catch(() => null),
      ),
    );

    const seasonIds = leagues
      .map((l) => (l?.seasons ?? []).find((s) => s.is_current)?.id)
      .filter(Boolean) as number[];

    const teamGroups = await Promise.all(
      seasonIds.map((sid) =>
        this.apiFootball
          .get<RawTeam[]>(`teams/seasons/${sid}`)
          .catch(() => [] as RawTeam[]),
      ),
    );

    const allTeamIds = [...new Set(teamGroups.flat().map((t) => t.id))].slice(0, 60);

    const squads = await Promise.all(
      allTeamIds.map((tid) =>
        this.apiFootball
          .get<RawSquadEntry[]>(`squads/teams/${tid}`, {
            include: `player.nationality;player.position${statsInclude}`,
          })
          .catch(() => [] as RawSquadEntry[]),
      ),
    );

    const seen = new Set<number>();
    const players: RawPlayer[] = [];
    for (const entry of squads.flat()) {
      if (entry.player && !seen.has(entry.player.id)) {
        seen.add(entry.player.id);
        players.push(entry.player);
      }
    }

    if (!includeStats) {
      this.allPlayersCache = { data: players, expiresAt: Date.now() + CACHE_TTL_MS };
    }

    return players;
  }

  async topPlayers() {
    if (this.topPlayersCache && this.topPlayersCache.expiresAt > Date.now()) {
      return this.topPlayersCache.data;
    }

    // Get current season for top 5 European leagues + UCL
    const LEAGUE_IDS = [2, 8, 564, 82, 384, 301];
    const leagues = await Promise.all(
      LEAGUE_IDS.map((lid) =>
        this.apiFootball
          .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${lid}`, { include: 'seasons' })
          .catch(() => null),
      ),
    );

    const seasonIds = leagues
      .map((l) => (l?.seasons ?? []).find((s) => s.is_current)?.id)
      .filter(Boolean) as number[];
    if (!seasonIds.length) return [];

    // Fetch all topscorers for each season in parallel
    const scorerGroups = await Promise.all(
      seasonIds.map((seasonId) =>
        this.apiFootball
          .getAll(`topscorers/seasons/${seasonId}`, { include: 'player.nationality;player.position;type;participant' })
          .catch(() => []),
      ),
    );

    interface ScorerEntry {
      player_id: number;
      total: number;
      type?: { developer_name: string };
      participant?: { id: number; name: string; image_path: string };
      player?: {
        id: number;
        name: string;
        display_name: string;
        image_path: string;
        date_of_birth: string;
        nationality?: { id: number; name: string; image_path: string };
        position?: { id: number; name: string };
      };
    }

    const allScorers = scorerGroups.flat() as ScorerEntry[];
    const goalScorers = allScorers.filter((s) => s.type?.developer_name === 'GOAL_TOPSCORER');

    // Deduplicate by player_id — keep highest total (player may appear in multiple leagues)
    const byPlayerId = new Map<number, ScorerEntry>();
    for (const s of goalScorers) {
      const existing = byPlayerId.get(s.player_id);
      if (!existing || s.total > existing.total) {
        byPlayerId.set(s.player_id, s);
      }
    }

    const result = [...byPlayerId.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 21)
      .map((s) => ({
        id: s.player?.id ?? s.player_id,
        displayName: s.player?.display_name ?? s.player?.name ?? null,
        name: s.player?.name ?? null,
        photo: s.player?.image_path ?? null,
        position: s.player?.position ?? null,
        nationality: s.player?.nationality ?? null,
        dateOfBirth: s.player?.date_of_birth ?? null,
        goals: s.total,
        team: s.participant
          ? { id: s.participant.id, name: s.participant.name, logo: s.participant.image_path }
          : null,
      }));

    this.topPlayersCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  }

  async search(query: {
    name?: string;
    position?: string;
    teamId?: number;
    leagueId?: number;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }) {
    const { name, position, teamId, leagueId, sort, order, page = 1, limit = 20 } = query;
    const effectiveLimit = Math.min(limit ?? 20, 50);
    const positionName = position && position !== 'ALL' ? (POSITION_MAP[position] ?? null) : null;
    const needsStats = sort === 'goals' || sort === 'assists';
    // For squad endpoints, statistics live under the player relation
    const squadStatsInclude = needsStats ? ';player.statistics.details.type' : '';
    // For direct player endpoints, statistics are on the root object
    const playerStatsInclude = needsStats ? ';statistics.details.type' : '';

    let players: RawPlayer[] = [];

    if (teamId) {
      const squad = await this.apiFootball
        .get<RawSquadEntry[]>(`squads/teams/${teamId}`, {
          include: `player.nationality;player.position${squadStatsInclude}`,
        })
        .catch(() => [] as RawSquadEntry[]);
      players = (squad ?? []).map((e) => e.player).filter(Boolean) as RawPlayer[];
    } else if (leagueId) {
      const league = await this.apiFootball
        .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${leagueId}`, {
          include: 'seasons',
        })
        .catch(() => null);
      const currentSeason = (league?.seasons ?? []).find((s) => s.is_current);
      if (currentSeason) {
        const teams = await this.apiFootball
          .get<RawTeam[]>(`teams/seasons/${currentSeason.id}`)
          .catch(() => [] as RawTeam[]);
        const teamList = (teams ?? []).slice(0, 25);
        const squads = await Promise.all(
          teamList.map((t) =>
            this.apiFootball
              .get<RawSquadEntry[]>(`squads/teams/${t.id}`, {
                include: `player.nationality;player.position${squadStatsInclude}`,
              })
              .catch(() => [] as RawSquadEntry[]),
          ),
        );
        players = squads.flat().map((e) => e.player).filter(Boolean) as RawPlayer[];
      }
    } else if (name) {
      const raw = await this.apiFootball
        .get<RawPlayer[]>(`players/search/${encodeURIComponent(name)}`, {
          include: `nationality;position${playerStatsInclude}`,
          per_page: 50,
        })
        .catch(() => [] as RawPlayer[]);
      players = raw ?? [];
    } else {
      players = await this.getAllPlayersPool(needsStats);
    }

    // Additional name filter when name is combined with teamId/leagueId
    if (name && (teamId || leagueId)) {
      const lower = name.toLowerCase();
      players = players.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.display_name?.toLowerCase().includes(lower) ||
          p.common_name?.toLowerCase().includes(lower),
      );
    }

    if (positionName) {
      players = players.filter((p) => p.position?.name === positionName);
    }

    players = this.sortPlayers(players, sort, order);

    const total = players.length;
    const offset = (page - 1) * effectiveLimit;
    const data = players.slice(offset, offset + effectiveLimit).map(this.normalize);

    return { data, meta: { page, limit: effectiveLimit, total } };
  }

  async getLeagues() {
    const results = await Promise.all(
      TOP_LEAGUE_IDS.map((id) =>
        this.apiFootball
          .get<{ id: number; name: string; image_path: string }>(`leagues/${id}`)
          .catch(() => null),
      ),
    );
    return results
      .filter(Boolean)
      .map((l) => ({ id: l!.id, name: l!.name, logo: l!.image_path }));
  }

  async getTeams(leagueId?: number) {
    if (!leagueId) return [];
    const league = await this.apiFootball
      .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${leagueId}`, {
        include: 'seasons',
      })
      .catch(() => null);
    const currentSeason = (league?.seasons ?? []).find((s) => s.is_current);
    if (!currentSeason) return [];
    const teams = await this.apiFootball
      .get<RawTeam[]>(`teams/seasons/${currentSeason.id}`)
      .catch(() => [] as RawTeam[]);
    return (teams ?? []).map((t) => ({ id: t.id, name: t.name, logo: t.image_path }));
  }

  private sortPlayers(players: RawPlayer[], sort?: string, order?: string): RawPlayer[] {
    if (sort === 'goals' || sort === 'assists') {
      const devName = sort === 'goals' ? 'GOALS' : 'ASSISTS';
      return [...players].sort((a, b) => {
        const aVal = this.getStatTotal(a, devName);
        const bVal = this.getStatTotal(b, devName);
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return bVal - aVal;
      });
    }
    const dir = sort === 'name_desc' || order === 'desc' ? -1 : 1;
    return [...players].sort((a, b) => {
      const aName = (a.display_name ?? a.name ?? '').toLowerCase();
      const bName = (b.display_name ?? b.name ?? '').toLowerCase();
      return aName.localeCompare(bName) * dir;
    });
  }

  private getStatTotal(player: RawPlayer, developerName: string): number | null {
    const sorted = [...(player.statistics ?? [])].sort((a, b) => b.season_id - a.season_id);
    const recent = sorted[0];
    if (!recent) return null;
    for (const detail of recent.details ?? []) {
      if (detail.type?.developer_name === developerName) {
        return detail.value.total ?? null;
      }
    }
    return null;
  }

  async findOne(id: number) {
    const raw = await this.apiFootball.get<RawPlayer>(`players/${id}`, {
      include: 'nationality;position;statistics.details.type',
    });
    if (!raw) throw new NotFoundException('Player not found');
    return this.normalize(raw);
  }

  async findSimilar(id: number) {
    const target = await this.apiFootball.get<RawPlayer>(`players/${id}`, {
      include: 'position;statistics.details.type',
    });
    if (!target) throw new NotFoundException('Player not found');

    const positionId = target.position?.id;
    if (!positionId) return [];

    const recentStat = (target.statistics ?? []).sort((a, b) => b.season_id - a.season_id)[0];
    if (!recentStat) return [];

    const { team_id: targetTeamId } = recentStat;

    // Get current seasons for top 5 European leagues
    const LEAGUE_IDS = [8, 564, 82, 384, 301];
    const leagues = await Promise.all(
      LEAGUE_IDS.map((lid) =>
        this.apiFootball
          .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${lid}`, { include: 'seasons' })
          .catch(() => null),
      ),
    );
    const seasonIds = leagues.map((l) => (l?.seasons ?? []).find((s) => s.is_current)?.id).filter(Boolean) as number[];

    // Take 4 teams from each league for a diverse cross-league pool (up to 20 teams)
    const teamGroups = await Promise.all(
      seasonIds.map((sid) =>
        this.apiFootball.get<Array<{ id: number }>>(`teams/seasons/${sid}`).catch(() => []),
      ),
    );
    const otherTeamIds = teamGroups
      .flatMap((group) =>
        (group ?? []).map((t) => t.id).filter((tid) => tid !== targetTeamId).slice(0, 4),
      )
      .slice(0, 20);

    // Fetch squads with player stats for all teams in parallel
    const squads = await Promise.all(
      otherTeamIds.map((tid) =>
        this.apiFootball
          .get<RawSquadEntry[]>(`squads/teams/${tid}`, {
            include: 'player.nationality;player.position;player.statistics.details.type',
          })
          .catch(() => [] as RawSquadEntry[]),
      ),
    );

    // Key stats with weights — higher = more important for similarity scoring
    const STAT_WEIGHTS: Record<string, number> = {
      GOALS: 5,
      ASSISTS: 5,
      KEY_PASSES: 4,
      SHOTS_ON_TARGET: 4,
      SHOTS_TOTAL: 3,
      SUCCESSFUL_DRIBBLES: 3,
      BIG_CHANCES_CREATED: 4,
      TACKLES: 3,
      INTERCEPTIONS: 3,
      CLEARANCES: 2,
      DUELS_WON: 2,
      AERIALS_WON: 2,
      ACCURATE_PASSES: 2,
      TOTAL_CROSSES: 2,
    };

    // Build per-90 normalized weighted stats for a player
    const getWeightedStats = (player: RawPlayer): Record<string, number> => {
      const raw: Record<string, number> = {};
      for (const season of player.statistics ?? []) {
        for (const detail of season.details ?? []) {
          const key = detail.type?.developer_name ?? String(detail.type_id);
          raw[key] = (raw[key] ?? 0) + (detail.value.total ?? 0);
        }
      }
      const minutes = raw['MINUTES_PLAYED'] || 90;
      const per90 = 90 / minutes;
      const result: Record<string, number> = {};
      for (const [key, weight] of Object.entries(STAT_WEIGHTS)) {
        result[key] = (raw[key] ?? 0) * per90 * weight;
      }
      return result;
    };

    const targetStats = getWeightedStats(target);

    const pool = squads
      .flat()
      .filter((entry) => entry.position_id === positionId && entry.player_id !== id && entry.player);

    return pool
      .map((entry) => {
        const p = entry.player!;
        const cStats = getWeightedStats(p);
        const diff = Object.keys(STAT_WEIGHTS).reduce((sum, key) => {
          return sum + Math.abs((targetStats[key] ?? 0) - (cStats[key] ?? 0));
        }, 0);
        return { diff, player: p };
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 4)
      .map(({ player: p }) => ({
        id: p.id,
        displayName: p.display_name,
        name: p.name,
        photo: p.image_path,
        position: p.position ?? null,
        nationality: p.nationality ?? null,
        dateOfBirth: p.date_of_birth,
      }));
  }

  normalize(item: RawPlayer) {
    return {
      id: item.id,
      name: item.name,
      commonName: item.common_name,
      displayName: item.display_name,
      firstname: item.firstname,
      lastname: item.lastname,
      height: item.height,
      weight: item.weight,
      dateOfBirth: item.date_of_birth,
      photo: item.image_path,
      nationality: item.nationality ?? null,
      position: item.position ?? null,
      statistics: item.statistics ?? [],
    };
  }
}
