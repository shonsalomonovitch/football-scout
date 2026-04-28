export interface LivescoreEvent {
  id: number;
  typeId: number;
  participantId: number;
  playerId?: number;
  minute: number;
  extraMinute?: number | null;
  info?: string;
}

export interface Livescore {
  id: number;
  name: string;
  startingAt: string;
  startingAtTimestamp?: number;
  leagueId: number;
  leagueName?: string;
  seasonId: number;
  seasonName?: string;
  minute?: number;
  state: { id: number; name: string; short_name: string };
  venue?: { id: number; name: string; city: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  score: { home: number; away: number };
  events?: LivescoreEvent[];
}
