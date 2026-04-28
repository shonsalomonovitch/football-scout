import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { TeamService } from '../../../core/services/team.service';
import { FixtureService } from '../../../core/services/fixture.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService } from '../../../core/services/auth.service';
import { TransferService } from '../../../core/services/transfer.service';
import { Team, SquadPlayer } from '../../../core/models/team.model';
import { Fixture, LineupPlayer, Starting11 } from '../../../core/models/fixture.model';
import { Transfer } from '../../../core/models/transfer.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { FavoriteBtnComponent } from '../../../shared/components/favorite-btn/favorite-btn.component';

const POSITION_MAP: Record<number, string> = {
  24: 'Goalkeeper',
  25: 'Defender',
  26: 'Midfielder',
  27: 'Attacker',
};
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

interface PitchRow { players: LineupPlayer[]; top: number; }

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, FavoriteBtnComponent],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.css',
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private fixtureService = inject(FixtureService);
  private favoriteService = inject(FavoriteService);
  private transferService = inject(TransferService);
  authService = inject(AuthService);

  teamId = signal(0);
  team = signal<Team | null>(null);
  squad = signal<SquadPlayer[]>([]);
  starting11 = signal<Starting11 | null>(null);
  lineupPlayers = signal<LineupPlayer[]>([]);
  lineupLoading = signal(false);
  lineupLoaded = false;
  transfers = signal<Transfer[]>([]);
  lastFixtures = signal<Fixture[]>([]);
  nextFixtures = signal<Fixture[]>([]);
  loading = signal(false);
  error = signal('');
  activeTab = signal<'squad' | 'results' | 'upcoming' | 'transfers' | 'lineup'>('squad');
  isFavorite = signal(false);

  squadByPosition = computed(() => {
    const positions: Record<string, SquadPlayer[]> = {};
    for (const p of this.squad()) {
      const pos = p.positionId ? (POSITION_MAP[p.positionId] ?? 'Other') : 'Other';
      if (!positions[pos]) positions[pos] = [];
      positions[pos].push(p);
    }
    return Object.entries(positions)
      .sort(([a], [b]) => (POSITION_ORDER.indexOf(a) ?? 99) - (POSITION_ORDER.indexOf(b) ?? 99));
  });

  // Group starting 11 into rows by formationField row number
  // formationField = "row:col", row 1 = GK (bottom), higher rows = attack (top)
  pitchRows = computed((): PitchRow[] => {
    const players = this.lineupPlayers();
    if (!players.length) return [];

    const rowMap = new Map<number, LineupPlayer[]>();
    for (const p of players) {
      const row = Number(p.formationField?.split(':')[0] ?? 0);
      if (!rowMap.has(row)) rowMap.set(row, []);
      rowMap.get(row)!.push(p);
    }

    // Sort each row's players by column
    for (const [, cols] of rowMap) {
      cols.sort((a, b) => Number(a.formationField?.split(':')[1] ?? 0) - Number(b.formationField?.split(':')[1] ?? 0));
    }

    const sortedRows = [...rowMap.entries()].sort((a, b) => a[0] - b[0]);
    const total = sortedRows.length;

    // Map row index to vertical position: row 0 (GK) = 90% (inside goal), last row (ATT) = 14%
    return sortedRows.map(([, players], i) => ({
      players,
      top: Math.round(90 - (i / Math.max(total - 1, 1)) * 76),
    }));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.teamId.set(id);
    this.loadData(id);
    if (this.authService.isAuthenticated()) {
      this.loadFavoriteStatus(id);
    }
  }

  private dateParam(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadData(id: number): void {
    this.loading.set(true);
    this.error.set('');

    const today = new Date();
    const past = new Date(today); past.setDate(today.getDate() - 30);
    const future = new Date(today); future.setDate(today.getDate() + 30);

    forkJoin({
      team: this.teamService.getTeam(id),
      squad: this.teamService.getSquad(id),
      last: this.fixtureService.getFixtures({ from: this.dateParam(past), to: this.dateParam(today), team: id }),
      next: this.fixtureService.getFixtures({ from: this.dateParam(today), to: this.dateParam(future), team: id }),
      transfers: this.transferService.getTeamTransfers(id),
    }).subscribe({
      next: ({ team, squad, last, next, transfers }) => {
        this.team.set(team);
        this.squad.set(squad?.players ?? []);
        this.lastFixtures.set(last ?? []);
        this.nextFixtures.set(next ?? []);
        this.transfers.set(transfers ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load team data');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: 'squad' | 'results' | 'upcoming' | 'transfers' | 'lineup'): void {
    this.activeTab.set(tab);
    if (tab === 'lineup' && !this.lineupLoaded) {
      this.lineupLoaded = true;
      this.lineupLoading.set(true);
      this.teamService.getStarting11(this.teamId()).subscribe({
        next: (data) => {
          this.starting11.set(data);
          this.lineupPlayers.set(data?.starting ?? []);
          this.lineupLoading.set(false);
        },
        error: () => { this.lineupLoading.set(false); },
      });
    }
  }

  loadFavoriteStatus(teamId: number): void {
    this.favoriteService.getFavoriteTeams().subscribe({
      next: (favs) => this.isFavorite.set(favs.some(f => f.apiTeamId === teamId)),
    });
  }

  toggleFavorite(): void {
    if (!this.team()) return;
    if (this.isFavorite()) {
      this.favoriteService.removeFavoriteTeam(this.teamId()).subscribe({
        next: () => this.isFavorite.set(false),
      });
    } else {
      this.favoriteService.addFavoriteTeam({
        apiTeamId: this.teamId(),
        teamName: this.team()!.name,
      }).subscribe({
        next: () => this.isFavorite.set(true),
      });
    }
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

  opponent(f: Fixture): { name: string; logo: string; venue: 'H' | 'A' } {
    const isHome = f.teams.home?.id === this.teamId();
    return isHome
      ? { name: f.teams.away?.name ?? '', logo: f.teams.away?.logo ?? '', venue: 'H' }
      : { name: f.teams.home?.name ?? '', logo: f.teams.home?.logo ?? '', venue: 'A' };
  }

  formatDate(f: Fixture): string {
    const d = f.startingAtTimestamp
      ? new Date(f.startingAtTimestamp * 1000)
      : new Date(f.startingAt.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jerusalem' });
  }

  formatPlainDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  scoreDisplay(f: Fixture): string {
    const home = f.scores?.find(s => s.participant === 'home' && s.description === 'CURRENT');
    const away = f.scores?.find(s => s.participant === 'away' && s.description === 'CURRENT');
    if (home !== undefined && away !== undefined) return `${home.goals} – ${away.goals}`;
    return f.state?.short_name ?? '–';
  }

  formatAmount(amount?: number): string {
    if (!amount) return 'Undisclosed';
    if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
    return `€${amount}`;
  }

  playerInitials(p: LineupPlayer): string {
    return p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  squadInitials(p: { name: string; commonName?: string }): string {
    const name = p.commonName || p.name;
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  pitchShortName(name: string): string {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1];
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
