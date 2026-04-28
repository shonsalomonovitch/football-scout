export interface Season {
  id: number;
  league_id: number;
  name: string;
  finished: boolean;
  is_current?: boolean;
  starting_at?: string;
  ending_at?: string;
  league?: { id: number; name: string; image_path?: string };
  stages?: Stage[];
}

export interface Stage {
  id: number;
  name: string;
  type?: string;
  finished?: boolean;
}
