import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

interface RawParticipant {
  id: number;
  name: string;
  image_path: string;
  meta: {
    location: string;
    winner: boolean | null;
    position: number;
  };
}

interface RawScore {
  id: number;
  type_id: number;
  participant_id: number;
  score: { goals: number; participant: string };
  description: string;
}

interface RawLineupEntry {
  id: number;
  fixture_id: number;
  team_id: number;
  player_id: number;
  position_id: number;
  type_id: number; // 11 = starting, 12 = bench
  formation_field: string | null;
  formation_position: number | null;
  jersey_number: number | null;
  player_name: string;
  player?: {
    id: number;
    name: string;
    display_name: string;
    common_name: string;
    image_path: string;
    height: number | null;
    weight: number | null;
    date_of_birth: string;
  };
}

interface RawFixtureWithLineups {
  id: number;
  name: string;
  participants?: RawParticipant[];
  lineups?: RawLineupEntry[];
}

interface RawEvent {
  id: number;
  type_id: number;
  participant_id: number;
  player_id: number | null;
  related_player_id: number | null;
  player_name: string | null;
  related_player_name: string | null;
  minute: number;
  extra_minute: number | null;
  result: string | null;
  info: string | null;
  addition: string | null;
  injured: boolean | null;
  player?: { id: number; display_name: string; image_path: string };
}

interface RawPeriod {
  id: number;
  description: string;
  minutes: number;
  seconds: number;
  ticking: boolean;
}

interface RawStatistic {
  id: number;
  type_id: number;
  participant_id: number;
  data?: { value: number | string | null };
  value?: { total: number | null };
  location?: string;
  type?: { id: number; name: string; developer_name: string };
}

interface RawPlayerOfMatch {
  player_id: number;
  player?: { id: number; display_name: string; image_path: string };
  rating?: number | string | null;
}

interface RawFixture {
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
  participants?: RawParticipant[];
  scores?: RawScore[];
  events?: RawEvent[];
  periods?: RawPeriod[];
  statistics?: RawStatistic[];
  playerOfMatch?: RawPlayerOfMatch | null;
  league?: { id: number; name: string } | null;
  round?: { id: number; name: string } | null;
}

@Injectable()
export class FixturesService {
  private readonly include = 'participants;scores;state;venue';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async findAll(query: {
    date?: string;
    from?: string;
    to?: string;
    team?: number;
  }) {
    if (query.date) {
      const raw = await this.apiFootball.get<RawFixture[]>(
        `fixtures/date/${query.date}`,
        { include: this.include },
      );
      return (raw ?? []).map(this.normalize);
    }

    if (query.from && query.to) {
      const endpoint = query.team
        ? `fixtures/between/${query.from}/${query.to}/${query.team}`
        : `fixtures/between/${query.from}/${query.to}`;
      const raw = await this.apiFootball.get<RawFixture[]>(endpoint, {
        include: this.include,
      });
      return (raw ?? []).map(this.normalize);
    }

    const raw = await this.apiFootball.get<RawFixture[]>('livescores/inplay', {
      include: this.include,
    });
    return (raw ?? []).map(this.normalize);
  }

  async headToHead(team1Id: number, team2Id: number) {
    const raw = await this.apiFootball.get<RawFixture[]>(
      `fixtures/head-to-head/${team1Id}/${team2Id}`,
      { include: this.include },
    );
    return (raw ?? []).map(this.normalize);
  }

  async getLineups(fixtureId: number) {
    const raw = await this.apiFootball.get<RawFixtureWithLineups>(
      `fixtures/${fixtureId}`,
      { include: 'lineups.player;participants' },
    );
    if (!raw) throw new NotFoundException('Fixture not found');

    const lineups = raw.lineups ?? [];
    const participants = raw.participants ?? [];

    const normalizePlayer = (entry: RawLineupEntry) => ({
      playerId: entry.player_id,
      name: entry.player?.display_name ?? entry.player_name,
      photo: entry.player?.image_path ?? null,
      jerseyNumber: entry.jersey_number,
      positionId: entry.position_id,
      formationField: entry.formation_field,
      formationPosition: entry.formation_position,
    });

    const buildTeam = (teamId: number) => {
      const participant = participants.find((p) => p.id === teamId);
      const teamLineups = lineups.filter((l) => l.team_id === teamId);
      return {
        teamId,
        teamName: participant?.name ?? null,
        teamLogo: participant?.image_path ?? null,
        starting: teamLineups
          .filter((l) => l.type_id === 11)
          .map(normalizePlayer),
        bench: teamLineups.filter((l) => l.type_id === 12).map(normalizePlayer),
      };
    };

    const teamIds = [...new Set(lineups.map((l) => l.team_id))];
    return teamIds.map(buildTeam);
  }

  async findOne(id: number) {
    const raw = await this.apiFootball.get<RawFixture>(`fixtures/${id}`, {
      include: `${this.include};events.player;periods;statistics.type;league;round`,
    });
    if (!raw) throw new NotFoundException('Fixture not found');
    return this.normalizeWithEvents(raw);
  }

  private readonly EVENT_TYPES: Record<number, string> = {
    14: 'goal',
    15: 'own_goal',
    16: 'goal_disallowed',
    18: 'substitution',
    19: 'yellowcard',
    20: 'redcard',
    21: 'yellowred_card',
  };

  private normalizeWithEvents(item: RawFixture) {
    const base = this.normalize(item);

    const activePeriod = item.periods?.find((p) => p.ticking);
    const minute = activePeriod
      ? activePeriod.minutes + Math.floor(activePeriod.seconds / 60)
      : null;

    const events = (item.events ?? [])
      .sort((a, b) => a.minute - b.minute)
      .map((e) => {
        const player = e.player
          ? {
              id: e.player.id,
              name: e.player.display_name,
              photo: e.player.image_path,
            }
          : { id: e.player_id, name: e.player_name, photo: null };

        if (player.id === null && player.name === null) return null;

        return {
          id: e.id,
          type: this.EVENT_TYPES[e.type_id] ?? `type_${e.type_id}`,
          teamId: e.participant_id,
          minute: e.minute,
          extraMinute: e.extra_minute,
          player,
          relatedPlayer: e.related_player_id
            ? { id: e.related_player_id, name: e.related_player_name }
            : null,
          result: e.result,
          info: e.info,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // 41=Shots Off Target, 42=Shots Total, 43=Shots On Target, 45=Ball Possession %,
    // 56=Fouls, 57=Corners, 84=Yellowcards
    const STAT_TYPE_IDS = new Set([41, 42, 43, 45, 56, 57, 84]);
    const homeId = item.participants?.find(
      (p) => p.meta.location === 'home',
    )?.id;
    const awayId = item.participants?.find(
      (p) => p.meta.location === 'away',
    )?.id;

    const statsMap = new Map<
      number,
      { typeId: number; type: string; home: number | null; away: number | null }
    >();
    for (const s of item.statistics ?? []) {
      if (!STAT_TYPE_IDS.has(s.type_id)) continue;
      if (!statsMap.has(s.type_id)) {
        statsMap.set(s.type_id, {
          typeId: s.type_id,
          type: s.type?.name ?? `type_${s.type_id}`,
          home: null,
          away: null,
        });
      }
      const entry = statsMap.get(s.type_id)!;
      const raw = s.data?.value ?? s.value?.total ?? null;
      const val =
        raw !== null && raw !== undefined ? parseFloat(String(raw)) : null;
      if (s.participant_id === homeId) entry.home = val;
      else if (s.participant_id === awayId) entry.away = val;
    }
    const statistics = [...statsMap.values()];

    const pom = item.playerOfMatch ?? null;
    const playerOfMatch = pom
      ? {
          playerId: pom.player_id,
          name: pom.player?.display_name ?? null,
          photo: pom.player?.image_path ?? null,
          rating:
            pom.rating !== null && pom.rating !== undefined
              ? parseFloat(String(pom.rating))
              : null,
        }
      : null;

    const league = item.league
      ? { name: item.league.name, round: item.round?.name ?? null }
      : null;

    return { ...base, minute, events, statistics, playerOfMatch, league };
  }

  private normalize = (item: RawFixture) => {
    const home =
      item.participants?.find((p) => p.meta.location === 'home') ?? null;
    const away =
      item.participants?.find((p) => p.meta.location === 'away') ?? null;

    return {
      id: item.id,
      name: item.name,
      startingAt: item.starting_at,
      startingAtTimestamp: item.starting_at_timestamp,
      leagueId: item.league_id,
      seasonId: item.season_id,
      resultInfo: item.result_info,
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
      scores: (item.scores ?? []).map((s) => ({
        typeId: s.type_id,
        participantId: s.participant_id,
        goals: s.score.goals,
        participant: s.score.participant,
        description: s.description,
      })),
    };
  };
}
