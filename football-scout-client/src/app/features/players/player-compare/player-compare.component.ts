import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PlayerService } from '../../../core/services/player.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { Player } from '../../../core/models/player.model';
import { PlayerComparison, ComparisonHistory } from '../../../core/models/analytics.model';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RadarChartComponent, extractRadarData, RadarDataset } from '../../../shared/components/radar-chart/radar-chart.component';

interface SearchState {
  term: string;
  results: Player[];
  loading: boolean;
  selected: Player | null;
}

@Component({
  selector: 'app-player-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, ErrorStateComponent, PageHeaderComponent, RadarChartComponent],
  templateUrl: './player-compare.component.html',
  styleUrl: './player-compare.component.css',
})
export class PlayerCompareComponent implements OnInit {
  private playerService = inject(PlayerService);
  private analyticsService = inject(AnalyticsService);
  authService = inject(AuthService);

  p1: SearchState = { term: '', results: [], loading: false, selected: null };
  p2: SearchState = { term: '', results: [], loading: false, selected: null };

  private search1$ = new Subject<string>();
  private search2$ = new Subject<string>();

  comparison = signal<PlayerComparison | null>(null);
  comparing = signal(false);
  compareError = signal('');
  history = signal<ComparisonHistory[]>([]);

  compareRadarData = computed<{ labels: string[]; datasets: RadarDataset[] } | null>(() => {
    const c = this.comparison();
    if (!c) return null;
    const d1 = c.player1.statistics?.[0]?.details;
    const d2 = c.player2.statistics?.[0]?.details;
    if (!d1?.length && !d2?.length) return null;

    // Build unified label set
    const r1 = d1?.length ? extractRadarData(d1) : { labels: [], values: [] };
    const r2 = d2?.length ? extractRadarData(d2) : { labels: [], values: [] };

    // Use union of labels, align values
    const allLabels = [...new Set([...r1.labels, ...r2.labels])];
    if (allLabels.length < 3) return null;

    const align = (r: { labels: string[]; values: number[] }, labels: string[]) =>
      labels.map(l => { const idx = r.labels.indexOf(l); return idx >= 0 ? r.values[idx] : 0; });

    return {
      labels: allLabels,
      datasets: [
        { label: c.player1.displayName || c.player1.name, values: align(r1, allLabels), color: '#22c55e' },
        { label: c.player2.displayName || c.player2.name, values: align(r2, allLabels), color: '#60a5fa' },
      ],
    };
  });

  ngOnInit(): void {
    this.search1$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => this.doSearch(this.p1, term));
    this.search2$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => this.doSearch(this.p2, term));
    if (this.authService.isAuthenticated()) {
      this.loadHistory();
    }
  }

  doSearch(state: SearchState, term: string): void {
    if (!term.trim()) { state.results = []; return; }
    state.loading = true;
    this.playerService.searchPlayers({ name: term }).subscribe({
      next: (res) => { state.results = res.data ?? []; state.loading = false; },
      error: () => { state.loading = false; },
    });
  }

  onSearch1(val: string): void { this.p1.term = val; this.search1$.next(val); }
  onSearch2(val: string): void { this.p2.term = val; this.search2$.next(val); }

  selectPlayer(state: SearchState, player: Player): void {
    state.selected = player;
    state.term = player.displayName || player.name;
    state.results = [];
  }

  clearPlayer(state: SearchState): void {
    state.selected = null;
    state.term = '';
    state.results = [];
    this.comparison.set(null);
  }

  canCompare(): boolean {
    return !!this.p1.selected && !!this.p2.selected;
  }

  compare(): void {
    if (!this.canCompare()) return;
    this.comparing.set(true);
    this.compareError.set('');
    this.analyticsService.comparePlayers(
      this.p1.selected!.id,
      this.p2.selected!.id,
      2025,
    ).subscribe({
      next: (data) => { this.comparison.set(data); this.comparing.set(false); },
      error: (err) => { this.compareError.set(err?.message || 'Comparison failed'); this.comparing.set(false); },
    });
  }

  replayHistory(h: ComparisonHistory): void {
    this.comparison.set(null);
    this.compareError.set('');
    this.comparing.set(true);
    forkJoin([
      this.playerService.getPlayer(h.player1Id),
      this.playerService.getPlayer(h.player2Id),
    ]).subscribe({
      next: ([p1, p2]) => {
        this.selectPlayer(this.p1, p1);
        this.selectPlayer(this.p2, p2);
        this.analyticsService.comparePlayers(p1.id, p2.id, h.season).subscribe({
          next: (data) => { this.comparison.set(data); this.comparing.set(false); },
          error: (err) => { this.compareError.set(err?.message || 'Comparison failed'); this.comparing.set(false); },
        });
      },
      error: () => { this.compareError.set('Failed to load players'); this.comparing.set(false); },
    });
  }

  loadHistory(): void {
    this.analyticsService.getComparisonHistory().subscribe({
      next: (data) => {
        const seen = new Set<string>();
        const unique = (data ?? []).filter(h => {
          const key = [Math.min(h.player1Id, h.player2Id), Math.max(h.player1Id, h.player2Id)].join('-');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        this.history.set(unique);
      },
    });
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

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  buildStatRows(c: PlayerComparison): { name: string; val1: string; val2: string; pct1: number; pct2: number; winner: 'p1' | 'p2' | 'tie' }[] {
    // Gather stats from each player's most recent season
    const s1 = c.player1.statistics?.[0];
    const s2 = c.player2.statistics?.[0];
    if (!s1?.details?.length && !s2?.details?.length) return [];

    // Build lookup maps by type_id
    const map1 = new Map(s1?.details?.map(d => [d.type_id, d]) ?? []);
    const map2 = new Map(s2?.details?.map(d => [d.type_id, d]) ?? []);

    // Combine all type_ids
    const typeIds = new Set([...map1.keys(), ...map2.keys()]);
    const rows: { name: string; val1: string; val2: string; pct1: number; pct2: number; winner: 'p1' | 'p2' | 'tie' }[] = [];

    for (const tid of typeIds) {
      const d1 = map1.get(tid);
      const d2 = map2.get(tid);
      const name = d1?.type?.name ?? d2?.type?.name;
      if (!name) continue;
      const n1 = d1?.value?.total ?? null;
      const n2 = d2?.value?.total ?? null;
      if (n1 === null && n2 === null) continue;

      const v1 = n1 ?? 0;
      const v2 = n2 ?? 0;
      const max = Math.max(v1, v2, 1);
      const winner: 'p1' | 'p2' | 'tie' = v1 > v2 ? 'p1' : v2 > v1 ? 'p2' : 'tie';

      rows.push({
        name,
        val1: n1 !== null ? String(n1) : '–',
        val2: n2 !== null ? String(n2) : '–',
        pct1: Math.round((v1 / max) * 100),
        pct2: Math.round((v2 / max) * 100),
        winner,
      });
    }
    return rows.slice(0, 20);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
