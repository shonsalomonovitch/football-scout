import { Component, OnInit, OnDestroy, inject, signal, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PlayerService } from '../../../core/services/player.service';
import { Player, PlayerLeague, PlayerTeam } from '../../../core/models/player.model';
import { BouncingDotsComponent } from '../../../shared/components/bouncing-dots/bouncing-dots.component';

export type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';
export type SortOption = 'name_asc' | 'name_desc' | 'goals' | 'assists';

export interface PlayerFilters {
  search:   string;
  position: PositionFilter;
  sort:     SortOption;
  leagueId: number | null;
  teamId:   number | null;
}

const DEFAULT_FILTERS: PlayerFilters = {
  search:   '',
  position: 'ALL',
  sort:     'name_asc',
  leagueId: null,
  teamId:   null,
};

const POSITIONS: PositionFilter[] = ['ALL', 'GK', 'DEF', 'MID', 'ATT'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc',  label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'goals',     label: 'Most Goals' },
  { value: 'assists',   label: 'Most Assists' },
];

@Component({
  selector: 'app-player-filter-toolbar',
  standalone: true,
  imports: [CommonModule, BouncingDotsComponent],
  templateUrl: './player-filter-toolbar.component.html',
  styleUrl: './player-filter-toolbar.component.css',
})
export class PlayerFilterToolbarComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);

  // Outputs
  readonly filtersChange  = output<PlayerFilters>();
  readonly playerSelected = output<Player>();
  readonly searchSubmit   = output<string>();

  // Filter state
  filters = signal<PlayerFilters>({ ...DEFAULT_FILTERS });

  // Autocomplete
  suggestions    = signal<Player[]>([]);
  suggestLoading = signal(false);
  dropdownOpen   = signal(false);

  // League / team dropdowns
  leagues      = signal<PlayerLeague[]>([]);
  teams        = signal<PlayerTeam[]>([]);
  leagueLoading = signal(false);
  teamLoading   = signal(false);

  readonly positions   = POSITIONS;
  readonly sortOptions = SORT_OPTIONS;

  readonly isDirty = computed(() => {
    const f = this.filters();
    return f.search   !== DEFAULT_FILTERS.search
        || f.position !== DEFAULT_FILTERS.position
        || f.sort     !== DEFAULT_FILTERS.sort
        || f.leagueId !== DEFAULT_FILTERS.leagueId
        || f.teamId   !== DEFAULT_FILTERS.teamId;
  });

  private search$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.search$
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(term => this.fetchSuggestions(term));

    this.loadLeagues();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Leagues / Teams ──────────────────────────────────────────────
  private loadLeagues(): void {
    this.leagueLoading.set(true);
    this.playerService.getPlayerLeagues().subscribe({
      next: data => { this.leagues.set(data); this.leagueLoading.set(false); },
      error: ()  => this.leagueLoading.set(false),
    });
  }

  onLeagueChange(value: string): void {
    const leagueId = value ? Number(value) : null;
    this.filters.update(f => ({ ...f, leagueId, teamId: null }));
    this.teams.set([]);
    if (leagueId) {
      this.teamLoading.set(true);
      this.playerService.getPlayerTeams(leagueId).subscribe({
        next: data => { this.teams.set(data); this.teamLoading.set(false); },
        error: ()  => this.teamLoading.set(false),
      });
    }
    this.emit();
  }

  onTeamChange(value: string): void {
    const teamId = value ? Number(value) : null;
    this.filters.update(f => ({ ...f, teamId }));
    this.emit();
  }

  // ── Search ──────────────────────────────────────────────────────
  onSearchInput(value: string): void {
    this.filters.update(f => ({ ...f, search: value }));
    if (value.trim().length >= 2) {
      this.dropdownOpen.set(true);
      this.search$.next(value.trim());
    } else {
      this.dropdownOpen.set(false);
      this.suggestions.set([]);
    }
    this.emit();
  }

  onSearchEnter(): void {
    const term = this.filters().search.trim();
    if (!term) return;
    this.closeDropdown();
    this.searchSubmit.emit(term);
  }

  clearSearch(): void {
    this.filters.update(f => ({ ...f, search: '' }));
    this.suggestions.set([]);
    this.dropdownOpen.set(false);
    this.emit();
    this.searchSubmit.emit('');
  }

  selectSuggestion(player: Player): void {
    this.closeDropdown();
    this.playerSelected.emit(player);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  private fetchSuggestions(term: string): void {
    this.suggestLoading.set(true);
    this.playerService.searchPlayers({ name: term, limit: 8 }).subscribe({
      next: res => {
        this.suggestions.set(res.data.slice(0, 8));
        this.suggestLoading.set(false);
      },
      error: () => this.suggestLoading.set(false),
    });
  }

  // ── Filters ─────────────────────────────────────────────────────
  setPosition(pos: PositionFilter): void {
    this.filters.update(f => ({ ...f, position: pos }));
    this.emit();
  }

  onSortChange(value: string): void {
    this.filters.update(f => ({ ...f, sort: value as SortOption }));
    this.emit();
  }

  reset(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.suggestions.set([]);
    this.teams.set([]);
    this.dropdownOpen.set(false);
    this.emit();
    this.searchSubmit.emit('');
  }

  private emit(): void {
    this.filtersChange.emit({ ...this.filters() });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  calcAge(dob: string): number | null {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
