export interface FavoritePlayer {
  id: number;
  apiPlayerId: number;
  playerName: string;
  displayName?: string;
  teamName?: string;
  photo?: string;
  position?: string;
  goals?: number;
  rating?: number;
  createdAt: string;
}

export interface FavoriteTeam {
  id: number;
  apiTeamId: number;
  teamName: string;
  leagueName?: string;
  logo?: string;
  createdAt: string;
}

export interface AddFavoritePlayerPayload {
  apiPlayerId: number;
  playerName: string;
  displayName?: string;
  teamName?: string;
  photo?: string;
  position?: string;
  goals?: number;
  rating?: number;
}

export interface AddFavoriteTeamPayload {
  apiTeamId: number;
  teamName: string;
  leagueName?: string;
}
