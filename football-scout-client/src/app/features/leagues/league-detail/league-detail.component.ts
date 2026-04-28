import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LeagueService } from '../../../core/services/league.service';
import { StandingService } from '../../../core/services/standing.service';
import { TopscoreService } from '../../../core/services/topscore.service';
import { League } from '../../../core/models/league.model';
import { StandingEntry, StandingDetail } from '../../../core/models/standing.model';
import { Topscorer } from '../../../core/models/topscore.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type ScorerType = 'goals' | 'assists' | 'yellowcards' | 'redcards';

@Component({
  selector: 'app-league-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, PageHeaderComponent],
  templateUrl: './league-detail.component.html',
  styleUrl: './league-detail.component.css',
})
export class LeagueDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private leagueService = inject(LeagueService);
  private standingService = inject(StandingService);
  private topscoreService = inject(TopscoreService);

  leagueId = signal(0);
  league = signal<League | null>(null);
  standings = signal<StandingEntry[]>([]);
  topscorers = signal<Topscorer[]>([]);
  loading = signal(false);
  standingsLoading = signal(false);
  scorerLoading = signal(false);
  scorerLoaded = false;
  error = signal('');
  activeTab = signal<'table' | 'topscorers'>('table');
  scorerFilter = signal<ScorerType>('goals');

  private seasonId = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.leagueId.set(id);
    this.loadLeague(id);
  }

  loadLeague(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.leagueService.getLeague(id).subscribe({
      next: (league) => {
        this.league.set(league);
        this.seasonId = league.currentSeason?.id ?? 0;
        this.loading.set(false);
        if (this.seasonId) {
          this.loadStandings();
        }
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load league data');
        this.loading.set(false);
      },
    });
  }

  loadStandings(): void {
    this.standingsLoading.set(true);
    this.standingService.getStandings(this.seasonId).pipe(catchError(() => of([]))).subscribe({
      next: (data) => { this.standings.set(data ?? []); this.standingsLoading.set(false); },
    });
  }

  loadTopscorers(type: ScorerType): void {
    if (!this.seasonId) return;
    this.scorerFilter.set(type);
    this.scorerLoading.set(true);
    this.topscoreService.getSeasonTopscorers(this.seasonId, type).subscribe({
      next: (data) => { this.topscorers.set(data ?? []); this.scorerLoading.set(false); },
      error: () => { this.topscorers.set([]); this.scorerLoading.set(false); },
    });
  }

  getDetail(entry: StandingEntry, developerName: string): number {
    return entry.details.find((d: StandingDetail) => d.developerName === developerName)?.value ?? 0;
  }

  played(entry: StandingEntry): number {
    return this.getDetail(entry, 'OVERALL_MATCHES');
  }

  goalsDiff(entry: StandingEntry): number {
    return this.getDetail(entry, 'OVERALL_GOAL_DIFFERENCE');
  }

  homeRecord(entry: StandingEntry): string {
    const w = this.getDetail(entry, 'HOME_WINS');
    const d = this.getDetail(entry, 'HOME_DRAWS');
    const l = this.getDetail(entry, 'HOME_LOST');
    return `${w}-${d}-${l}`;
  }

  awayRecord(entry: StandingEntry): string {
    const w = this.getDetail(entry, 'AWAY_WINS');
    const d = this.getDetail(entry, 'AWAY_DRAWS');
    const l = this.getDetail(entry, 'AWAY_LOST');
    return `${w}-${d}-${l}`;
  }

  setTab(tab: 'table' | 'topscorers'): void {
    this.activeTab.set(tab);
    if (tab === 'topscorers' && !this.scorerLoaded) {
      this.scorerLoaded = true;
      this.loadTopscorers('goals');
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
