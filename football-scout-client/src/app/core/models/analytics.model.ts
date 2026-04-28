import { Player } from './player.model';

export interface PlayerComparison {
  season: number;
  player1: Player;
  player2: Player;
  summary: {
    player1: { name: string; statistics: unknown[] };
    player2: { name: string; statistics: unknown[] };
  };
}

export interface ComparisonHistory {
  id: number;
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  season: number;
  createdAt: string;
}
