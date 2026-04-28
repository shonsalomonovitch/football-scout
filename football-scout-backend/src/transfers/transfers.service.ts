import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface RawTransfer {
  id: number;
  sport_id: number;
  player_id: number;
  type_id: number;
  from_team_id: number | null;
  to_team_id: number | null;
  position_id: number | null;
  detailed_position_id: number | null;
  date: string;
  career_ended: boolean;
  completed: boolean;
  amount: number | null;
  player?: { id: number; name: string; image_path: string };
  fromteam?: { id: number; name: string; image_path: string };
  toteam?: { id: number; name: string; image_path: string };
  type?: { id: number; name: string; developer_name: string };
}

@Injectable()
export class TransfersService {
  private readonly include = 'player;fromTeam;toTeam;type';

  constructor(private readonly apiFootball: ApiFootballService) {}

  async findLatest() {
    const raw = await this.apiFootball.get<RawTransfer[]>('transfers/latest', { include: this.include });
    return (raw ?? []).map(this.normalize);
  }

  async findOne(id: number) {
    const raw = await this.apiFootball.get<RawTransfer>(`transfers/${id}`, { include: this.include });
    return raw ? this.normalize(raw) : null;
  }

  async findByTeam(teamId: number) {
    const raw = await this.apiFootball.get<RawTransfer[]>(`transfers/teams/${teamId}`, { include: this.include });
    return (raw ?? []).map(this.normalize);
  }

  async findByPlayer(playerId: number) {
    const raw = await this.apiFootball.get<RawTransfer[]>(`transfers/players/${playerId}`, { include: this.include });
    return (raw ?? []).map(this.normalize);
  }

  async findByDateRange(startDate: string, endDate: string) {
    const raw = await this.apiFootball.get<RawTransfer[]>(
      `transfers/between/${startDate}/${endDate}`,
      { include: this.include },
    );
    return (raw ?? []).map(this.normalize);
  }

  private normalize(transfer: RawTransfer) {
    const normalizeTeam = (team?: { id: number; name: string; image_path: string }) =>
      team ? { id: team.id, name: team.name, logo: team.image_path } : null;

    return {
      id: transfer.id,
      date: transfer.date,
      amount: transfer.amount,
      completed: transfer.completed,
      type: transfer.type?.name ?? null,
      player: transfer.player
        ? { id: transfer.player.id, name: transfer.player.name, photo: transfer.player.image_path }
        : null,
      fromTeam: normalizeTeam(transfer.fromteam),
      toTeam: normalizeTeam(transfer.toteam),
    };
  }
}
