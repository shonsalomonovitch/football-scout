export interface League {
  id: number;
  name: string;
  active: boolean;
  type: string;
  subType: string;
  logo: string;
  country: { id: number; name: string; flag: string } | null;
  currentSeason: {
    id: number;
    name: string;
    finished: boolean;
    starting_at: string;
    ending_at: string;
    teamsCount?: number;
  } | null;
  seasons: Array<{
    id: number;
    name: string;
    finished: boolean;
    starting_at: string;
    ending_at: string;
  }>;
}

export interface LeagueFilters {
  search?: string;
  country?: string;
}
