export interface Topscorer {
  id: number;
  position: number;
  total: number;
  player: {
    id: number;
    name: string;
    common_name?: string;
    display_name?: string;
    image_path?: string;
  };
  participant?: { id: number; name: string; image_path?: string };
  type?: { id: number; name: string; developer_name?: string };
}
