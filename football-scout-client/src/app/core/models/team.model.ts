export interface Team {
  id: number;
  name: string;
  shortCode: string;
  founded: number;
  logo: string;
  country: { id: number; name: string } | null;
  venue: {
    id: number;
    name: string;
    city: string;
    capacity: number;
    image: string;
  } | null;
}

export interface SquadPlayer {
  id: number;
  name: string;
  commonName: string;
  displayName?: string;
  jerseyNumber: number | null;
  position?: string;
  positionId: number | null;
  photo: string;
  dateOfBirth: string;
  height?: number | null;
  weight?: number | null;
  nationality?: { id: number; name: string; flag: string } | null;
}

export interface TeamSquad {
  teamId: number;
  players: SquadPlayer[];
}

export interface TeamFilters {
  seasonId: number;
  leagueId?: number;
}

export interface TopTeam {
  id: number;
  name: string;
  logo: string;
  points: number | null;
  position: number | null;
}
