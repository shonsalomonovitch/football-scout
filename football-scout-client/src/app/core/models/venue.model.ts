export interface Venue {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
  image_path?: string;
  city?: { id: number; name: string };
  country?: { id: number; name: string; image_path?: string };
}
