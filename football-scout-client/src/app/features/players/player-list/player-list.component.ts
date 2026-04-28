import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { PlayerService } from '../../../core/services/player.service';
import { Player, PlayerSearchFilters, PlayerSearchMeta, TopPlayer } from '../../../core/models/player.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  PlayerFilterToolbarComponent,
  PlayerFilters,
} from '../player-filter-toolbar/player-filter-toolbar.component';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    PlayerFilterToolbarComponent,
  ],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.css',
})
export class PlayerListComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  players    = signal<Player[]>([]);
  topPlayers = signal<TopPlayer[]>([]);
  topLoading = signal(false);
  loading    = signal(false);
  error      = signal('');
  page       = signal(1);
  searched   = signal(false);
  meta       = signal<PlayerSearchMeta>({ page: 1, limit: 20, total: 0 });

  protected activeSearch = '';
  readonly Math = Math;

  private activeFilters: PlayerFilters = {
    search: '', position: 'ALL', sort: 'name_asc', leagueId: null, teamId: null,
  };

  // switchMap cancels any in-flight request when a new one comes in
  private search$ = new Subject<{ filters: PlayerSearchFilters; page: number }>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.search$
      .pipe(
        debounceTime(250),
        switchMap(({ filters, page }) =>
          this.playerService.searchPlayers({ ...filters, page })
        )
      )
      .subscribe({
        next: res => {
          this.players.set(res.data ?? []);
          this.meta.set(res.meta ?? { page: 1, limit: 20, total: 0 });
          this.loading.set(false);
        },
        error: err => {
          this.error.set(err?.message || 'Failed to load players');
          this.loading.set(false);
        },
      });

    this.loadTopPlayers();

    const name = this.route.snapshot.queryParamMap.get('name');
    if (name) {
      this.activeSearch = name;
      this.activeFilters = { ...this.activeFilters, search: name };
      this.dispatch(1);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadTopPlayers(): void {
    this.topLoading.set(true);
    this.playerService.getTopPlayers().subscribe({
      next: data => { this.topPlayers.set(data ?? []); this.topLoading.set(false); },
      error: ()  => this.topLoading.set(false),
    });
  }

  // ── Toolbar event handlers ───────────────────────────────────────
  onFiltersChange(filters: PlayerFilters): void {
    this.activeFilters = filters;
    this.activeSearch  = filters.search;

    const hasActiveFilter =
      !!filters.search || filters.position !== 'ALL' ||
      !!filters.leagueId || !!filters.teamId;

    if (!hasActiveFilter) {
      if (this.searched()) {
        this.players.set([]);
        this.searched.set(false);
        this.error.set('');
      }
      return;
    }

    this.dispatch(1);
  }

  onSearchSubmit(term: string): void {
    const f = this.activeFilters;
    if (!term && !f.leagueId && !f.teamId && f.position === 'ALL') {
      this.players.set([]);
      this.searched.set(false);
      this.error.set('');
      return;
    }
    this.dispatch(1);
  }

  onPlayerSelected(player: Player): void {
    this.router.navigate(['/players', player.id]);
  }

  // ── Data ─────────────────────────────────────────────────────────
  private dispatch(page: number): void {
    this.page.set(page);
    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);

    const f = this.activeFilters;
    this.search$.next({
      filters: {
        name:     f.search   || undefined,
        position: f.position !== 'ALL' ? f.position : undefined,
        leagueId: f.leagueId ?? undefined,
        teamId:   f.teamId   ?? undefined,
        sort:     f.sort,
        limit:    20,
      },
      page,
    });
  }

  prevPage(): void {
    if (this.page() > 1) this.dispatch(this.page() - 1);
  }

  nextPage(): void {
    if (this.hasNextPage()) this.dispatch(this.page() + 1);
  }

  hasNextPage(): boolean {
    const m = this.meta();
    return m.total > 0
      ? this.page() * m.limit < m.total
      : this.players().length >= m.limit;
  }

  calcAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
