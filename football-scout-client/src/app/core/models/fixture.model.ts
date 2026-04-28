export interface FixtureEvent {
  id: number;
  type: 'goal' | 'own_goal' | 'yellowcard' | 'redcard' | 'yellowred_card' | 'substitution' | 'goal_disallowed' | string;
  teamId: number;
  minute: number;
  extraMinute?: number | null;
  player: { id: number; name: string; photo?: string } | null;
  relatedPlayer: { id: number; name: string } | null;
  result?: string | null;
  info?: string | null;
}

export interface FixtureStat {
  typeId?: number;
  type: string;
  home: number | null;
  away: number | null;
}

export interface FixturePlayerOfMatch {
  playerId: number;
  name: string;
  photo?: string;
  rating?: number;
}

export interface Fixture {
  id: number;
  name: string;
  startingAt: string;
  startingAtTimestamp: number;
  leagueId: number;
  seasonId: number;
  resultInfo: string | null;
  state: { id: number; name: string; short_name: string } | null;
  venue: { id: number; name: string; city: string } | null;
  league?: { name: string; round?: string } | null;
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null } | null;
    away: { id: number; name: string; logo: string; winner: boolean | null } | null;
  };
  scores: FixtureScore[];
  events?: FixtureEvent[];
  statistics?: FixtureStat[];
  playerOfMatch?: FixturePlayerOfMatch | null;
  minute?: number;
}

export interface FixtureScore {
  typeId: number;
  participantId: number;
  goals: number;
  participant: string;
  description: string;
}

export interface FixtureFilters {
  date?: string;
  from?: string;
  to?: string;
  team?: number;
}

export interface LineupPlayer {
  playerId: number;
  name: string;
  photo: string;
  jerseyNumber: number;
  positionId: number;
  formationField: string;
  formationPosition: number;
}

export interface FixtureLineup {
  teamId: number;
  teamName: string;
  teamLogo: string;
  starting: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface Starting11 {
  fixtureId: number;
  fixtureName: string;
  fixtureDate: string;
  opponent: { id: number; name: string; logo: string };
  starting: LineupPlayer[];
}
