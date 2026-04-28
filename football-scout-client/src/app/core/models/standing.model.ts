export interface StandingEntry {
  position: number;
  points: number;
  result: string;
  team: { id: number; name: string; logo: string };
  details: StandingDetail[];
}

export interface StandingDetail {
  name: string;
  developerName: string;
  value: number;
}
