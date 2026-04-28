export interface Player {
  id: number;
  name: string;
  commonName: string;
  displayName: string;
  firstname: string;
  lastname: string;
  height: number | null;
  weight: number | null;
  dateOfBirth: string;
  photo: string;
  nationality: { id: number; name: string; image_path: string } | null;
  position: { id: number; name: string } | null;
  statistics: PlayerSeasonStat[];
}

export interface PlayerSeasonStat {
  season_id: number;
  team_id: number;
  details?: PlayerStatDetail[];
}

export interface PlayerStatDetail {
  type_id: number;
  value: { total: number | null; average: number | null };
  type?: { id: number; name: string; developer_name: string };
}

export interface PlayerSearchFilters {
  name?:     string;
  position?: string;   // GK | DEF | MID | FWD | ATT | ALL
  teamId?:   number;
  leagueId?: number;
  sort?:     string;   // name_asc | name_desc | goals | assists
  order?:    string;   // asc | desc
  limit?:    number;
  page?:     number;
}

export interface PlayerSearchMeta {
  page:  number;
  limit: number;
  total: number;
}

export interface PlayerLeague {
  id:   number;
  name: string;
  logo: string;
}

export interface PlayerTeam {
  id:   number;
  name: string;
  logo: string;
}

export interface TopPlayer {
  id: number;
  name: string;
  displayName: string;
  photo: string;
  position: { id: number; name: string } | null;
  nationality: { id: number; name: string; image_path: string } | null;
  dateOfBirth: string;
  goals: number | null;
}
