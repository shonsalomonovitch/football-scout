import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FixtureService } from '../../../core/services/fixture.service';
import { Fixture, FixtureStat, FixtureScore, FixtureEvent, FixtureLineup, LineupPlayer } from '../../../core/models/fixture.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
interface PitchRow { players: LineupPlayer[]; top: number; }
interface DisplayStat { typeId: number; type: string; label: string; color: string; home: number; away: number; }
interface TlItem { kind: 'event' | 'break'; e?: FixtureEvent; label?: string; }

@Component({
  selector: 'app-fixture-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './fixture-detail.component.html',
  styleUrl: './fixture-detail.component.css',
})
export class FixtureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fixtureService = inject(FixtureService);

  fixtureId = signal(0);
  fixture = signal<Fixture | null>(null);
  loading = signal(false);
  error = signal('');

  activeTab = signal<'summary' | 'lineups'>('summary');
  timelineFilter = signal<'top' | 'all'>('top');
  selectedLineupTeam = signal<'home' | 'away'>('home');
  lineups = signal<FixtureLineup[]>([]);
  lineupsLoading = signal(false);
  private lineupsLoaded = false;

  private isTopEvent(type: string): boolean {
    return ['goal', 'own_goal', 'redcard', 'yellowred_card', 'goal_disallowed'].includes(type);
  }

  timelineItems = computed((): TlItem[] => {
    const f = this.fixture();
    if (!f) return [];
    const events = (f.events ?? [])
      .filter(e => this.timelineFilter() === 'all' || this.isTopEvent(e.type))
      .slice()
      .sort((a, b) => b.minute - a.minute || (b.extraMinute ?? 0) - (a.extraMinute ?? 0));
    if (!events.length) return [];
    const htHome = f.scores?.find(s => s.participant === 'home' && s.description === 'HT')?.goals;
    const htAway = f.scores?.find(s => s.participant === 'away' && s.description === 'HT')?.goals;
    const htLabel = htHome != null && htAway != null ? `Halftime  ${htHome} – ${htAway}` : 'Half Time';
    const items: TlItem[] = [];
    let htDone = false;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!htDone && e.minute <= 45 && !e.extraMinute && i > 0) {
        items.push({ kind: 'break', label: htLabel });
        htDone = true;
      }
      items.push({ kind: 'event', e });
    }
    return items;
  });

  private readonly STAT_CONFIG: { typeId: number; label: string; color?: string }[] = [
    { typeId: 42, label: 'Total Shots' },
    { typeId: 41, label: 'Shots Off Target' },
    { typeId: 43, label: 'Attacks' },
    { typeId: 57, label: 'Saves' },
    { typeId: 56, label: 'Fouls' },
    { typeId: 84, label: 'Yellow Cards', color: 'gold' },
  ];

  possession = computed(() => {
    const stats = this.fixture()?.statistics ?? [];
    const s = stats.find(x => x.typeId === 45 || x.type?.toLowerCase().includes('possession'));
    return s ? { home: s.home ?? 0, away: s.away ?? 0 } : null;
  });

  displayStats = computed((): DisplayStat[] => {
    const stats = this.fixture()?.statistics ?? [];
    const result: DisplayStat[] = [];
    for (const cfg of this.STAT_CONFIG) {
      const s = stats.find(x => x.typeId === cfg.typeId);
      if (s) {
        result.push({
          typeId: cfg.typeId,
          type: s.type,
          label: cfg.label,
          color: cfg.color ?? '',
          home: s.home ?? 0,
          away: s.away ?? 0,
        });
      }
    }
    return result;
  });

  // kept for score breakdown fallback only
  performanceStats = computed((): FixtureStat[] => []);

  possessionArc = computed(() => {
    const p = this.possession();
    const pct = p ? p.home : 0;
    const r = 80;
    const circ = 2 * Math.PI * r;
    return { dash: (pct / 100) * circ, total: circ };
  });

  // Home team (bottom half): GK at 92%, ATT at 55%
  homePitchRows = computed((): PitchRow[] => {
    const home = this.lineups().find(l => l.teamId === this.fixture()?.teams.home?.id);
    return this.buildRows(home?.starting ?? [], (i, max) => Math.round(92 - (i / Math.max(max, 1)) * 37));
  });

  // Away team (top half): GK at 8%, ATT at 45%
  awayPitchRows = computed((): PitchRow[] => {
    const away = this.lineups().find(l => l.teamId === this.fixture()?.teams.away?.id);
    return this.buildRows(away?.starting ?? [], (i, max) => Math.round(8 + (i / Math.max(max, 1)) * 37));
  });

  homeLineup = computed(() => this.lineups().find(l => l.teamId === this.fixture()?.teams.home?.id));
  awayLineup = computed(() => this.lineups().find(l => l.teamId === this.fixture()?.teams.away?.id));

  selectedLineup = computed(() =>
    this.selectedLineupTeam() === 'home' ? this.homeLineup() : this.awayLineup()
  );

  // Single-team pitch: GK at bottom (~88%), ATT at top (~15%)
  selectedPitchRows = computed((): PitchRow[] =>
    this.buildRows(
      this.selectedLineup()?.starting ?? [],
      (i, max) => Math.round(88 - (i / Math.max(max, 1)) * 73)
    )
  );

  private buildRows(players: LineupPlayer[], topFn: (i: number, max: number) => number): PitchRow[] {
    if (!players.length) return [];
    const rowMap = new Map<number, LineupPlayer[]>();
    for (const p of players) {
      const row = Number(p.formationField?.split(':')[0] ?? 0);
      if (!rowMap.has(row)) rowMap.set(row, []);
      rowMap.get(row)!.push(p);
    }
    for (const [, cols] of rowMap) {
      cols.sort((a, b) => Number(a.formationField?.split(':')[1] ?? 0) - Number(b.formationField?.split(':')[1] ?? 0));
    }
    const sortedRows = [...rowMap.entries()].sort((a, b) => a[0] - b[0]);
    const max = sortedRows.length - 1;
    return sortedRows.map(([, rowPlayers], i) => ({ players: rowPlayers, top: topFn(i, max) }));
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.fixtureId.set(id);
    this.loadFixture(id);
  }

  loadFixture(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.fixtureService.getFixture(id).subscribe({
      next: (data) => { this.fixture.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(err?.message || 'Failed to load fixture'); this.loading.set(false); },
    });
  }

  statBarWidth(val: number | null, other: number | null): number {
    const total = (val ?? 0) + (other ?? 0);
    if (!total) return 50;
    return Math.round(((val ?? 0) / total) * 100);
  }

  setTab(tab: 'summary' | 'lineups'): void {
    this.activeTab.set(tab);
    if (tab === 'lineups' && !this.lineupsLoaded) {
      this.lineupsLoaded = true;
      this.lineupsLoading.set(true);
      this.fixtureService.getLineups(this.fixtureId()).subscribe({
        next: (data) => { this.lineups.set(data ?? []); this.lineupsLoading.set(false); },
        error: () => { this.lineupsLoading.set(false); },
      });
    }
  }

  homeGoals(f: Fixture): number | null {
    const s = f.scores?.find(sc => sc.participant === 'home' && sc.description === 'CURRENT');
    return s !== undefined ? s.goals : null;
  }

  awayGoals(f: Fixture): number | null {
    const s = f.scores?.find(sc => sc.participant === 'away' && sc.description === 'CURRENT');
    return s !== undefined ? s.goals : null;
  }

  compareFn = (a: FixtureEvent, b: FixtureEvent) => b.minute - a.minute;

  eventIcon(type: string): string {
    switch (type) {
      case 'goal':            return 'goal';
      case 'own_goal':        return 'og';
      case 'yellowcard':      return '🟨';
      case 'redcard':         return '🟥';
      case 'yellowred_card':  return 'y2';
      case 'substitution':    return 'sub';
      case 'goal_disallowed': return 'VAR';
      default:                return '';
    }
  }

  eventIconClass(type: string): string {
    switch (type) {
      case 'goal':            return 'ei ei--goal';
      case 'own_goal':        return 'ei ei--og';
      case 'yellowcard':      return 'ei ei--card';
      case 'redcard':         return 'ei ei--card';
      case 'yellowred_card':  return 'ei ei--y2';
      case 'substitution':    return 'ei ei--sub';
      case 'goal_disallowed': return 'ei ei--var';
      default:                return 'ei ei--default';
    }
  }

  minuteLabel(e: FixtureEvent): string {
    return e.extraMinute ? `${e.minute}+${e.extraMinute}'` : `${e.minute}'`;
  }

  scoresByType(f: Fixture): Map<string, FixtureScore[]> {
    const map = new Map<string, FixtureScore[]>();
    for (const s of f.scores ?? []) {
      const key = s.description;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }

  isLiveFixture(f: Fixture): boolean {
    const s = f.state?.short_name ?? '';
    return ['1H', '2H', 'HT', 'ET', 'PEN', 'LIVE'].includes(s);
  }

  statusBadgeClass(shortName: string | undefined): string {
    if (!shortName) return 'badge-gray';
    if (shortName === 'FT') return 'badge-gray';
    if (shortName === 'HT') return 'badge-yellow';
    if (['LIVE', '1H', '2H', 'ET', 'P'].includes(shortName)) return 'badge-live';
    return 'badge-gray';
  }

  formatDate(dateStr: string, timestamp?: number): string {
    const d = timestamp ? new Date(timestamp * 1000) : new Date(dateStr.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'Asia/Jerusalem',
    });
  }

  playerInitials(p: LineupPlayer): string {
    return p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  pitchShortName(name: string): string {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1];
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
