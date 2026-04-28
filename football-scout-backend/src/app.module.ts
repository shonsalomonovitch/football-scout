import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApiFootballModule } from './api-football/api-football.module';
import { LeaguesModule } from './leagues/leagues.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { StandingsModule } from './standings/standings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotesModule } from './notes/notes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LivescoresModule } from './livescores/livescores.module';
import { SeasonsModule } from './seasons/seasons.module';
import { CountriesModule } from './countries/countries.module';
import { CoachesModule } from './coaches/coaches.module';
import { VenuesModule } from './venues/venues.module';
import { TransfersModule } from './transfers/transfers.module';
import { TopscorersModule } from './topscorers/topscorers.module';
import { RoundsModule } from './rounds/rounds.module';
import { GamesModule } from './games/games.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApiFootballModule,
    LeaguesModule,
    TeamsModule,
    PlayersModule,
    FixturesModule,
    StandingsModule,
    FavoritesModule,
    NotesModule,
    AnalyticsModule,
    LivescoresModule,
    SeasonsModule,
    CountriesModule,
    CoachesModule,
    VenuesModule,
    TransfersModule,
    TopscorersModule,
    RoundsModule,
    GamesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
