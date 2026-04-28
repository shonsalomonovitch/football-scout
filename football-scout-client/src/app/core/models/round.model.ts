export interface Round {
  id: number;
  name: string;
  finished: boolean;
  is_current: boolean;
  starting_at?: string;
  ending_at?: string;
  season_id: number;
  stage_id?: number;
}
