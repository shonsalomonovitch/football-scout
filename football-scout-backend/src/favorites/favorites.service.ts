import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from '../api-football/api-football.service';
import { AddFavoritePlayerDto } from './dto/add-favorite-player.dto';
import { AddFavoriteTeamDto } from './dto/add-favorite-team.dto';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiFootball: ApiFootballService,
  ) {}

  // --- Players ---

  async getPlayers(userId: number) {
    const favorites = await this.prisma.favoritePlayer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const icons = await Promise.all(
      favorites.map((f) =>
        this.apiFootball
          .get<{ image_path: string }>(`players/${f.apiPlayerId}`)
          .then((p) => p?.image_path ?? null)
          .catch(() => null),
      ),
    );

    return favorites.map((f, i) => ({ ...f, photo: icons[i] }));
  }

  async addPlayer(userId: number, dto: AddFavoritePlayerDto) {
    const existing = await this.prisma.favoritePlayer.findUnique({
      where: { userId_apiPlayerId: { userId, apiPlayerId: dto.apiPlayerId } },
    });
    if (existing) throw new ConflictException('Player already in favorites');

    return this.prisma.favoritePlayer.create({
      data: {
        userId,
        apiPlayerId: dto.apiPlayerId,
        playerName: dto.playerName,
        displayName: dto.displayName,
        teamName: dto.teamName,
        photo: dto.photo,
        position: dto.position,
        goals: dto.goals,
        rating: dto.rating,
      },
    });
  }

  async removePlayer(userId: number, apiPlayerId: number) {
    const existing = await this.prisma.favoritePlayer.findUnique({
      where: { userId_apiPlayerId: { userId, apiPlayerId } },
    });
    if (!existing) throw new NotFoundException('Favorite player not found');

    await this.prisma.favoritePlayer.delete({
      where: { userId_apiPlayerId: { userId, apiPlayerId } },
    });
  }

  // --- Teams ---

  async getTeams(userId: number) {
    const favorites = await this.prisma.favoriteTeam.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const icons = await Promise.all(
      favorites.map((f) =>
        this.apiFootball
          .get<{ image_path: string }>(`teams/${f.apiTeamId}`)
          .then((t) => t?.image_path ?? null)
          .catch(() => null),
      ),
    );

    return favorites.map((f, i) => ({ ...f, logo: icons[i] }));
  }

  async addTeam(userId: number, dto: AddFavoriteTeamDto) {
    const existing = await this.prisma.favoriteTeam.findUnique({
      where: { userId_apiTeamId: { userId, apiTeamId: dto.apiTeamId } },
    });
    if (existing) throw new ConflictException('Team already in favorites');

    return this.prisma.favoriteTeam.create({
      data: {
        userId,
        apiTeamId: dto.apiTeamId,
        teamName: dto.teamName,
        leagueName: dto.leagueName,
        logo: dto.logo,
      },
    });
  }

  async removeTeam(userId: number, apiTeamId: number) {
    const existing = await this.prisma.favoriteTeam.findUnique({
      where: { userId_apiTeamId: { userId, apiTeamId } },
    });
    if (!existing) throw new NotFoundException('Favorite team not found');

    await this.prisma.favoriteTeam.delete({
      where: { userId_apiTeamId: { userId, apiTeamId } },
    });
  }
}
