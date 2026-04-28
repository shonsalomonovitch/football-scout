import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

interface RawTeam {
  id: number;
  name: string;
  short_code: string;
  founded: number;
  image_path: string;
  country?: { id: number; name: string };
  venue?: {
    id: number;
    name: string;
    city: string;
    capacity: number;
    image_path: string;
  };
  players?: Array<{
    id: number;
    player_id: number;
    position_id: number;
    jersey_number: number;
    player: {
      id: number;
      name: string;
      common_name: string;
      display_name: string;
      image_path: string;
      date_of_birth: string;
      nationality?: { id: number; name: string; image_path: string };
    };
  }>;
}

interface RawSquadEntry {
  id: number;
  team_id: number;
  player_id: number;
  position_id: number;
  jersey_number: number | null;
  player?: {
    id: number;
    name: string;
    common_name: string;
    display_name: string;
    image_path: string;
    date_of_birth: string;
    height: number | null;
    weight: number | null;
  };
  position?: {
    id: number;
    name: string;
  };
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class TeamsService {
  private topTeamsCache: { data: unknown[]; expiresAt: number } | null = null;

  constructor(private readonly apiFootball: ApiFootballService) {}

  async topTeams(): Promise<unknown[]> {
    if (this.topTeamsCache && this.topTeamsCache.expiresAt > Date.now()) {
      return this.topTeamsCache.data;
    }
    // Top N teams per league — total 28
    const LEAGUES = [
      { id: 8, limit: 6 },    // Premier League
      { id: 564, limit: 6 },  // La Liga
      { id: 82, limit: 5 },   // Bundesliga
      { id: 384, limit: 6 },  // Serie A
      { id: 301, limit: 5 },  // Ligue 1
    ];

    interface RawStandingEntry {
      participant_id: number;
      position: number;
      points: number;
      result: string;
      league_id?: number;
      participant?: { id: number; name: string; image_path: string };
    }

    // Fetch current season + standings for each league in parallel
    const results = await Promise.all(
      LEAGUES.map(async ({ id: leagueId, limit }) => {
        const league = await this.apiFootball
          .get<{ seasons?: Array<{ id: number; is_current: boolean }> }>(`leagues/${leagueId}`, { include: 'seasons' })
          .catch(() => null);
        const seasonId = (league?.seasons ?? []).find((s) => s.is_current)?.id;
        if (!seasonId) return [];

        const standings = await this.apiFootball
          .get<RawStandingEntry[]>(`standings/seasons/${seasonId}`, { include: 'participant' })
          .catch(() => [] as RawStandingEntry[]);

        return (standings ?? [])
          .sort((a, b) => a.position - b.position)
          .slice(0, limit)
          .map((s) => ({
            id: s.participant_id,
            name: s.participant?.name ?? null,
            logo: s.participant?.image_path ?? null,
            points: s.points,
            leaguePosition: s.position,
          }));
      }),
    );

    const result = results.flat();
    this.topTeamsCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  }

  async findBySeason(seasonId: number) {
    const raw = await this.apiFootball.get<RawTeam[]>(`teams/seasons/${seasonId}`, {
      include: 'venue;country',
    });
    return (raw ?? []).map(this.normalize);
  }

  async findOne(id: number) {
    const raw = await this.apiFootball.get<RawTeam>(`teams/${id}`, {
      include: 'venue;country',
    });
    if (!raw) throw new NotFoundException('Team not found');
    return this.normalize(raw);
  }

  async getSquad(teamId: number) {
    const raw = await this.apiFootball.get<RawTeam>(`teams/${teamId}`, {
      include: 'players.player.nationality',
    });
    if (!raw) throw new NotFoundException('Team not found');

    return {
      teamId,
      players: (raw.players ?? []).map((p) => ({
        id: p.player?.id,
        name: p.player?.name,
        commonName: p.player?.common_name,
        displayName: p.player?.display_name ?? null,
        nationality: p.player?.nationality
          ? { id: p.player.nationality.id, name: p.player.nationality.name, flag: p.player.nationality.image_path }
          : null,
        jerseyNumber: p.jersey_number,
        positionId: p.position_id,
        photo: p.player?.image_path,
        dateOfBirth: p.player?.date_of_birth,
      })),
    };
  }

  async getStartingEleven(teamId: number) {
    // Get the most recent fixture for this team (last 30 days)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const fixtures = await this.apiFootball.get<
      Array<{ id: number; name: string; starting_at: string }>
    >(`fixtures/between/${thirtyDaysAgo}/${today}/${teamId}`, {
      include: 'lineups.player;participants',
    });

    if (!fixtures?.length) throw new NotFoundException('No recent fixtures found for this team');

    // Pick the most recent fixture that has lineups
    const fixturesWithLineups = (
      fixtures as unknown as Array<{
        id: number;
        name: string;
        starting_at: string;
        participants?: Array<{ id: number; name: string; image_path: string; meta: { location: string } }>;
        lineups?: Array<{
          team_id: number;
          player_id: number;
          type_id: number;
          position_id: number;
          formation_field: string | null;
          formation_position: number | null;
          jersey_number: number | null;
          player_name: string;
          player?: { id: number; display_name: string; image_path: string; height: number | null; weight: number | null; date_of_birth: string };
        }>;
      }>
    )
      .sort((a, b) => new Date(b.starting_at).getTime() - new Date(a.starting_at).getTime())
      .find((f) => f.lineups?.some((l) => l.team_id === teamId && l.type_id === 11));

    if (!fixturesWithLineups) throw new NotFoundException('No lineup data found for recent fixtures');

    const starting = (fixturesWithLineups.lineups ?? [])
      .filter((l) => l.team_id === teamId && l.type_id === 11)
      .map((l) => ({
        playerId: l.player_id,
        name: l.player?.display_name ?? l.player_name,
        photo: l.player?.image_path ?? null,
        jerseyNumber: l.jersey_number,
        positionId: l.position_id,
        formationField: l.formation_field,
        formationPosition: l.formation_position,
      }));

    const opponent = fixturesWithLineups.participants?.find((p) => p.id !== teamId);

    return {
      fixtureId: fixturesWithLineups.id,
      fixtureName: fixturesWithLineups.name,
      fixtureDate: fixturesWithLineups.starting_at,
      opponent: opponent
        ? { id: opponent.id, name: opponent.name, logo: opponent.image_path }
        : null,
      starting,
    };
  }

  async getSquadDetailed(teamId: number) {
    const raw = await this.apiFootball.get<RawSquadEntry[]>(
      `squads/teams/${teamId}`,
      { include: 'player;position' },
    );
    if (!raw) throw new NotFoundException('Team not found');

    return (raw ?? []).map((entry) => ({
      id: entry.player?.id ?? entry.player_id,
      name: entry.player?.name ?? null,
      commonName: entry.player?.common_name ?? null,
      displayName: entry.player?.display_name ?? null,
      jerseyNumber: entry.jersey_number,
      position: entry.position?.name ?? null,
      positionId: entry.position_id,
      photo: entry.player?.image_path ?? null,
      dateOfBirth: entry.player?.date_of_birth ?? null,
      height: entry.player?.height ?? null,
      weight: entry.player?.weight ?? null,
    }));
  }

  private normalize(item: RawTeam) {
    return {
      id: item.id,
      name: item.name,
      shortCode: item.short_code,
      founded: item.founded,
      logo: item.image_path,
      country: item.country ?? null,
      venue: item.venue
        ? {
            id: item.venue.id,
            name: item.venue.name,
            city: item.venue.city,
            capacity: item.venue.capacity,
            image: item.venue.image_path,
          }
        : null,
    };
  }
}
