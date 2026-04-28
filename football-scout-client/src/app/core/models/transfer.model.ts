export interface Transfer {
  id: number;
  date: string;
  amount?: number;
  completed: boolean;
  player: { id: number; name: string; photo?: string };
  fromTeam?: { id: number; name: string; logo?: string };
  toTeam?: { id: number; name: string; logo?: string };
  type?: string;
}

export interface TransferFilters {
  from?: string;
  to?: string;
}
