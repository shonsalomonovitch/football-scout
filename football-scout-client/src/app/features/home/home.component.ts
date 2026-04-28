import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, interval, forkJoin } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';
import { LeagueService } from '../../core/services/league.service';
import { LivescoreService } from '../../core/services/livescore.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PlayerService } from '../../core/services/player.service';
import { League } from '../../core/models/league.model';
import { Livescore } from '../../core/models/livescore.model';
import { FavoritePlayer } from '../../core/models/favorite.model';
import { ComparisonHistory } from '../../core/models/analytics.model';
import { GoalSceneComponent } from '../../shared/components/goal-scene/goal-scene.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, GoalSceneComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(14px)' }),
          stagger(60, [
            animate('320ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  authService        = inject(AuthService);
  private leagueSvc  = inject(LeagueService);
  private liveSvc    = inject(LivescoreService);
  private favSvc     = inject(FavoriteService);
  private analyticsSvc = inject(AnalyticsService);
  private playerSvc  = inject(PlayerService);

  featuredLeagues    = signal<League[]>([]);
  liveMatches        = signal<Livescore[]>([]);
  favoritePlayers    = signal<FavoritePlayer[]>([]);
  comparisonHistory  = signal<ComparisonHistory[]>([]);
  comparisonPhotos   = signal<{ p1: string | null; p2: string | null }>({ p1: null, p2: null });

  compareSlots = computed(() => {
    const history = this.comparisonHistory();
    if (!history.length) return null;
    const latest = history[0];
    const photos  = this.comparisonPhotos();
    return {
      p1Name:  latest.player1Name,
      p1Photo: photos.p1,
      p2Name:  latest.player2Name,
      p2Photo: photos.p2,
    };
  });

  hasProspectStats = computed(() =>
    this.favoritePlayers().some(p => !!p.position || p.goals != null || p.rating != null)
  );

  private pollSub?: Subscription;

  readonly quickLinks = [
    { label: 'Leagues',   icon: 'trophy',   route: '/leagues',   desc: 'Browse all competitions' },
    { label: 'Teams',     icon: 'shield',   route: '/teams',     desc: 'Explore club squads' },
    { label: 'Players',   icon: 'person',   route: '/players',   desc: 'Search & scout players' },
    { label: 'Fixtures',  icon: 'calendar', route: '/fixtures',  desc: 'Results & upcoming' },
    { label: 'Transfers', icon: 'transfer', route: '/transfers', desc: 'Latest player movements' },
    { label: 'Games',     icon: 'games',    route: '/games',     desc: 'Football trivia & games' },
  ];

  leagueScope(league: League): string {
    if (!league.country) return 'GLOBAL';
    const n = league.name.toLowerCase();
    if (n.includes('champions') || n.includes('europa') || n.includes('conference') ||
        n.includes('nations league') || n.includes('uefa') || n.includes('euro ')) {
      return 'EUROPEAN';
    }
    return league.country.name.toUpperCase();
  }

  leagueScopeTag(league: League): 'global' | 'euro' | 'national' {
    const s = this.leagueScope(league);
    if (s === 'GLOBAL') return 'global';
    if (s === 'EUROPEAN') return 'euro';
    return 'national';
  }

  ngOnInit(): void {
    this.leagueSvc.getLeagues().subscribe({
      next: (data) => this.featuredLeagues.set(data ?? []),
      error: () => {},
    });

    this.pollSub = interval(12000).pipe(
      startWith(0),
      switchMap(() => this.liveSvc.getInPlay()),
    ).subscribe({
      next: (data) => this.liveMatches.set((data ?? []).slice(0, 4)),
      error: () => {},
    });

    if (this.authService.isAuthenticated()) {
      this.favSvc.getFavoritePlayers().subscribe({
        next: (data) => this.favoritePlayers.set(data ?? []),
        error: () => {},
      });
      this.analyticsSvc.getComparisonHistory().subscribe({
        next: (data) => {
          const list = data ?? [];
          this.comparisonHistory.set(list);
          if (list.length > 0) {
            const { player1Id, player2Id } = list[0];
            forkJoin([
              this.playerSvc.getPlayer(player1Id),
              this.playerSvc.getPlayer(player2Id),
            ]).subscribe({
              next: ([p1, p2]) => this.comparisonPhotos.set({ p1: p1.photo ?? null, p2: p2.photo ?? null }),
              error: () => {},
            });
          }
        },
        error: () => {},
      });
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
