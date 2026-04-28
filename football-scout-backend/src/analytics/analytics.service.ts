import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';

type NormalizedPlayer = ReturnType<PlayersService['normalize']>;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playersService: PlayersService,
  ) {}

  async comparePlayers(player1Id: number, player2Id: number, season: number, userId: number) {
    const [player1, player2] = await Promise.all([
      this.playersService.findOne(player1Id),
      this.playersService.findOne(player2Id),
    ]);

    await this.prisma.comparisonHistory.create({
      data: {
        userId,
        player1Id,
        player1Name: player1.displayName ?? player1.name,
        player2Id,
        player2Name: player2.displayName ?? player2.name,
        season,
      },
    });

    return {
      season,
      player1,
      player2,
      summary: this.buildSummary(player1, player2),
    };
  }

  async getHistory(userId: number) {
    return this.prisma.comparisonHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private buildSummary(p1: NormalizedPlayer, p2: NormalizedPlayer) {
    return {
      player1: { name: p1.name, statistics: p1.statistics },
      player2: { name: p2.name, statistics: p2.statistics },
    };
  }
}
