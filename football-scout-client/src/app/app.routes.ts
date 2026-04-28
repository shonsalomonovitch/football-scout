import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Auth routes (no shell)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  // App shell
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'livescores',
        loadComponent: () =>
          import('./features/livescores/livescores.component').then((m) => m.LivescoresComponent),
      },
      {
        path: 'leagues',
        loadComponent: () =>
          import('./features/leagues/league-list/league-list.component').then(
            (m) => m.LeagueListComponent
          ),
      },
      {
        path: 'leagues/:id',
        loadComponent: () =>
          import('./features/leagues/league-detail/league-detail.component').then(
            (m) => m.LeagueDetailComponent
          ),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/team-list/team-list.component').then(
            (m) => m.TeamListComponent
          ),
      },
      {
        path: 'teams/:id',
        loadComponent: () =>
          import('./features/teams/team-detail/team-detail.component').then(
            (m) => m.TeamDetailComponent
          ),
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./features/players/player-list/player-list.component').then(
            (m) => m.PlayerListComponent
          ),
      },
      {
        path: 'players/compare',
        loadComponent: () =>
          import('./features/players/player-compare/player-compare.component').then(
            (m) => m.PlayerCompareComponent
          ),
      },
      {
        path: 'players/:id',
        loadComponent: () =>
          import('./features/players/player-detail/player-detail.component').then(
            (m) => m.PlayerDetailComponent
          ),
      },
      {
        path: 'fixtures',
        loadComponent: () =>
          import('./features/fixtures/fixture-list/fixture-list.component').then(
            (m) => m.FixtureListComponent
          ),
      },
      {
        path: 'fixtures/:id',
        loadComponent: () =>
          import('./features/fixtures/fixture-detail/fixture-detail.component').then(
            (m) => m.FixtureDetailComponent
          ),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./features/transfers/transfers.component').then((m) => m.TransfersComponent),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./features/games/games-hub/games-hub.component').then(
            (m) => m.GamesHubComponent
          ),
      },
      {
        path: 'games/who-are-ya',
        loadComponent: () =>
          import('./features/games/who-are-ya/who-are-ya.component').then(
            (m) => m.WhoAreYaComponent
          ),
      },
      {
        path: 'games/bingo',
        loadComponent: () =>
          import('./features/games/bingo/bingo.component').then((m) => m.BingoComponent),
      },
      {
        path: 'games/box2box',
        loadComponent: () =>
          import('./features/games/box2box/box2box.component').then((m) => m.Box2BoxComponent),
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(
            (m) => m.FavoritesComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
