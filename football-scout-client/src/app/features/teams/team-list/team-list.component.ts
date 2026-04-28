import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TeamService } from '../../../core/services/team.service';
import { LeagueService } from '../../../core/services/league.service';
import { Team, TopTeam } from '../../../core/models/team.model';
import { League } from '../../../core/models/league.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { BouncingDotsComponent } from '../../../shared/components/bouncing-dots/bouncing-dots.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, PageHeaderComponent, BouncingDotsComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.css',
})
export class TeamListComponent implements OnInit, OnDestroy {
  private teamService = inject(TeamService);
  private leagueService = inject(LeagueService);
  private route = inject(ActivatedRoute);

  allTeams = signal<Team[]>([]);
  topTeams = signal<TopTeam[]>([]);
  topLoading = signal(false);
  loading = signal(false);
  error = signal('');
  searchTerm = signal('');
  seasonId = signal<number | null>(null);

  leagueSearchTerm = '';
  leagueResults: League[] = [];
  leagueSearching = false;
  selectedLeague: League | null = null;
  dropdownOpen = false;

  private leagueSearch$ = new Subject<string>();
  private searchSub?: Subscription;

  filteredTeams = computed(() => {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.allTeams();
    return this.allTeams().filter(t => t.name.toLowerCase().includes(q));
  });

  private leagueId: number | null = null;

  ngOnInit(): void {
    const sid = this.route.snapshot.queryParamMap.get('seasonId');
    const lid = this.route.snapshot.queryParamMap.get('leagueId');
    if (lid) this.leagueId = Number(lid);
    if (sid) {
      this.seasonId.set(Number(sid));
      this.loadTeams(Number(sid));
    }
    this.searchSub = this.leagueSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.doLeagueSearch(term);
    });
    this.loadTopTeams();
  }

  loadTopTeams(): void {
    this.topLoading.set(true);
    this.teamService.getTopTeams().subscribe({
      next: (data) => { this.topTeams.set(data ?? []); this.topLoading.set(false); },
      error: () => this.topLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  toggleDropdown(): void { this.dropdownOpen = !this.dropdownOpen; }
  closeDropdown(): void { this.dropdownOpen = false; }

  onLeagueSearch(val: string): void {
    this.leagueSearchTerm = val;
    this.leagueSearch$.next(val);
  }

  clearSearch(event: Event): void {
    event.stopPropagation();
    this.leagueSearchTerm = '';
    this.leagueResults = [];
  }

  doLeagueSearch(term: string): void {
    if (!term.trim()) { this.leagueResults = []; return; }
    this.leagueSearching = true;
    this.leagueService.getLeagues({ search: term }).subscribe({
      next: (data) => { this.leagueResults = data ?? []; this.leagueSearching = false; },
      error: () => { this.leagueSearching = false; },
    });
  }

  selectLeague(league: League): void {
    this.selectedLeague = league;
    this.leagueSearchTerm = '';
    this.leagueResults = [];
    this.leagueId = league.id;
    this.dropdownOpen = false;
    const sid = league.currentSeason?.id;
    if (sid) {
      this.seasonId.set(sid);
      this.loadTeams(sid);
    }
  }

  clearLeague(): void {
    this.selectedLeague = null;
    this.leagueSearchTerm = '';
    this.leagueResults = [];
    this.leagueId = null;
    this.seasonId.set(null);
    this.allTeams.set([]);
    this.error.set('');
    this.dropdownOpen = false;
  }

  loadTeams(seasonId: number): void {
    this.loading.set(true);
    this.error.set('');
    const filters = this.leagueId ? { seasonId, leagueId: this.leagueId } : { seasonId };
    this.teamService.getTeams(filters).subscribe({
      next: (data) => {
        this.allTeams.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load teams');
        this.loading.set(false);
      },
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
