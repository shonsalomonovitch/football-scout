export interface Coach {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  display_name?: string;
  image_path?: string;
  date_of_birth?: string;
  nationality?: { id: number; name: string; image_path?: string };
  teams?: CoachTeam[];
}

export interface CoachTeam {
  id: number;
  name: string;
  meta?: {
    active: boolean;
    starts_at?: string;
    ends_at?: string | null;
  };
}
