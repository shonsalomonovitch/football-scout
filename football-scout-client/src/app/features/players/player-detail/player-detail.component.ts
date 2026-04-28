import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlayerService } from '../../../core/services/player.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { NoteService } from '../../../core/services/note.service';
import { AuthService } from '../../../core/services/auth.service';
import { TransferService } from '../../../core/services/transfer.service';
import { SeasonService } from '../../../core/services/season.service';
import { Player, PlayerSeasonStat } from '../../../core/models/player.model';
import { Note } from '../../../core/models/note.model';
import { Transfer } from '../../../core/models/transfer.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { FavoriteBtnComponent } from '../../../shared/components/favorite-btn/favorite-btn.component';
import { PlayerStatsPanelComponent } from '../../../shared/components/player-stats-panel/player-stats-panel.component';
import { RadarChartComponent, RadarDataset, extractRadarData } from '../../../shared/components/radar-chart/radar-chart.component';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, FavoriteBtnComponent, PlayerStatsPanelComponent, RadarChartComponent],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.css',
})
export class PlayerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private playerService = inject(PlayerService);
  private favoriteService = inject(FavoriteService);
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private transferService = inject(TransferService);
  private seasonService = inject(SeasonService);
  authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  playerId = signal(0);
  player = signal<Player | null>(null);
  loading = signal(false);
  error = signal('');
  activeTab = signal<'statistics' | 'notes' | 'transfers'>('statistics');
  seasonNames = signal<Map<number, string>>(new Map());

  isFavorite = signal(false);
  notes = signal<Note[]>([]);
  notesLoading = signal(false);
  editingNoteId = signal<number | null>(null);
  transfers = signal<Transfer[]>([]);
  similarPlayers = signal<Player[]>([]);
  similarLoading = signal(false);
  similarError = signal(false);
  exportingPdf = signal(false);

  // ── Transfer timeline & summary ──
  transferTimeline = computed(() => {
    const sorted = [...this.transfers()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const withMeta = sorted.map((t, i) => {
      const next = sorted[i + 1];
      const from = new Date(t.date);
      const to = next ? new Date(next.date) : new Date();
      return {
        ...t,
        duration: this.calcDuration(from, to),
        isLoan: this.isLoanTransfer(t),
        isCurrent: i === sorted.length - 1,
      };
    });
    return withMeta.reverse(); // newest first
  });

  careerSummary = computed(() => {
    const ts = this.transfers();
    if (!ts.length) return null;
    const sorted = [...ts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const clubIds = new Set(ts.map(t => t.toTeam?.id).filter(Boolean));
    const fees = ts.filter(t => t.amount).map(t => t.amount!);
    const totalFees = fees.reduce((s, f) => s + f, 0);
    const biggestFee = fees.length ? Math.max(...fees) : 0;
    const biggestMove = ts.find(t => t.amount === biggestFee && biggestFee > 0);
    const lastTransfer = sorted[sorted.length - 1];
    const isCurrentlyOnLoan = this.isLoanTransfer(lastTransfer);
    return {
      clubCount: clubIds.size,
      totalFees,
      biggestFee,
      biggestMoveTeam: biggestMove?.toTeam?.name ?? null,
      firstYear: new Date(sorted[0].date).getFullYear(),
      isCurrentlyOnLoan,
      loanFrom: isCurrentlyOnLoan ? lastTransfer.fromTeam?.name : null,
    };
  });

  noteForm = this.fb.group({ content: ['', [Validators.required, Validators.minLength(3)]] });
  editForm = this.fb.group({ content: ['', [Validators.required, Validators.minLength(3)]] });

  playerNotes = computed(() => this.notes().filter(n => n.apiPlayerId === this.playerId()));

  // Deduplicate seasons:
  // 1. by season_id (keep entry with most details)
  // 2. then by resolved season name (same year across competitions → keep richest)
  deduplicatedStats = computed(() => {
    const names = this.seasonNames(); // reactive — recomputes when names load

    // Step 1: deduplicate by season_id
    const byId = new Map<number, PlayerSeasonStat>();
    for (const s of this.player()?.statistics ?? []) {
      const ex = byId.get(s.season_id);
      if (!ex || (s.details?.length ?? 0) > (ex.details?.length ?? 0)) {
        byId.set(s.season_id, s);
      }
    }

    // Step 2: deduplicate by season name (once names are loaded)
    const byName = new Map<string, PlayerSeasonStat>();
    for (const s of byId.values()) {
      const label = names.get(s.season_id) ?? `__id_${s.season_id}`;
      const ex = byName.get(label);
      if (!ex || (s.details?.length ?? 0) > (ex.details?.length ?? 0)) {
        byName.set(label, s);
      }
    }

    return [...byName.values()].sort((a, b) => b.season_id - a.season_id);
  });

  // Deduplicate details within a season by type_id
  uniqueDetails(details: PlayerSeasonStat['details']): NonNullable<PlayerSeasonStat['details']> {
    if (!details?.length) return [];
    const seen = new Map<number, typeof details[0]>();
    for (const d of details) {
      if (!seen.has(d.type_id)) seen.set(d.type_id, d);
    }
    return [...seen.values()];
  }

  selectedSeasonId = signal<number | null>(null);

  selectedSeason = computed(() => {
    const stats = this.deduplicatedStats();
    if (!stats.length) return null;
    const id = this.selectedSeasonId();
    return stats.find(s => s.season_id === id) ?? stats[0];
  });

  // ── Analytics charts ──

  private readonly SPARKLINE_STAT_CFG = [
    { typeId: 52,  label: 'Goals',   valueKey: undefined as string | undefined, color: '#ef4444' },
    { typeId: 79,  label: 'Assists', valueKey: undefined as string | undefined, color: '#f59e0b' },
    { typeId: 118, label: 'Rating',  valueKey: 'average' as string | undefined, color: '#d97706' },
    { typeId: 78,  label: 'Tackles', valueKey: undefined as string | undefined, color: '#3b82f6' },
    { typeId: 80,  label: 'Passes',  valueKey: undefined as string | undefined, color: '#16a34a' },
  ];

  radarLabels = computed(() => {
    const first = this.deduplicatedStats()[0];
    if (!first?.details?.length) return [];
    return extractRadarData(first.details).labels;
  });

  radarDatasets = computed((): RadarDataset[] => {
    const first = this.deduplicatedStats()[0];
    if (!first?.details?.length) return [];
    const { labels, values } = extractRadarData(first.details);
    if (labels.length < 3) return [];
    const avgValues = labels.map(() => 50);
    return [
      { label: this.player()?.displayName || this.player()?.name || 'Player', values, color: '#16a34a' },
      { label: 'League Avg', values: avgValues, color: '#6b7280' },
    ];
  });

  radarOverallScore = computed(() => {
    const vals = this.radarDatasets()[0]?.values;
    if (!vals?.length) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  });

  radarBars = computed(() => {
    const labels = this.radarLabels();
    const values = this.radarDatasets()[0]?.values ?? [];
    return labels.map((label, i) => ({
      label,
      value: values[i] ?? 0,
      tier: (values[i] ?? 0) >= 68 ? 'high' : (values[i] ?? 0) >= 38 ? 'mid' : 'low',
    }));
  });

  sparklineData = computed(() => {
    const seasons = [...this.deduplicatedStats()].reverse().slice(0, 6);
    if (seasons.length < 2) return [];
    return this.SPARKLINE_STAT_CFG
      .map(cfg => {
        const values = seasons.map(s => {
          const detail = s.details?.find(d => d.type_id === cfg.typeId);
          if (!detail) return null;
          const raw = cfg.valueKey ? (detail.value as Record<string, unknown>)[cfg.valueKey] : detail.value.total;
          return typeof raw === 'number' && !isNaN(raw) ? raw : null;
        });
        const valid = values.filter((v): v is number => v !== null);
        if (valid.length < 2) return null;
        const latest = valid[valid.length - 1];
        const prev   = valid[valid.length - 2];
        const delta  = Math.round((latest - prev) * 10) / 10;
        const rel    = Math.abs(delta) / (Math.abs(prev) || 1);
        const trend: 'up' | 'down' | 'flat' = rel < 0.02 ? 'flat' : delta > 0 ? 'up' : 'down';
        return { label: cfg.label, color: cfg.color, values, latest, prev, delta, trend, peak: Math.max(...valid) };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  });

  getSparklinePoints(values: (number | null)[], width = 120, height = 32): string {
    const valid = values.filter((v): v is number => v !== null);
    if (valid.length < 2) return '';
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const n = values.length;
    return values
      .map((v, i) => {
        if (v === null) return null;
        const x = (i / (n - 1)) * width;
        const y = height - 4 - ((v - min) / range) * (height - 8);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');
  }

  getSparklineAreaPoints(values: (number | null)[], width = 120, height = 32): string {
    const valid = values.filter((v): v is number => v !== null);
    if (valid.length < 2) return '';
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const n = values.length;
    const pts: string[] = [];
    let firstX = 0, lastX = 0, started = false;
    values.forEach((v, i) => {
      if (v === null) return;
      const x = (i / (n - 1)) * width;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      if (!started) { firstX = x; started = true; }
      lastX = x;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    pts.push(`${lastX.toFixed(1)},${height}`);
    pts.push(`${firstX.toFixed(1)},${height}`);
    return pts.join(' ');
  }

  lastSparklinePoint(values: (number | null)[], width = 120, height = 32): { x: number; y: number } | null {
    const valid = values.filter((v): v is number => v !== null);
    if (!valid.length) return null;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const n = values.length;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== null) {
        const x = (i / (n - 1)) * width;
        const y = height - 4 - ((values[i]! - min) / range) * (height - 8);
        return { x, y };
      }
    }
    return null;
  }

ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.playerId.set(id);
    this.loadPlayer(id);
    this.loadTransfers(id);
    this.loadSimilarPlayers(id);
    if (this.authService.isAuthenticated()) {
      this.loadFavoriteStatus(id);
      this.loadNotes();
    }
  }

  loadPlayer(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.playerService.getPlayer(id).subscribe({
      next: (data) => {
        this.player.set(data);
        this.loading.set(false);
        this.loadSeasonNames(data.statistics?.map(s => s.season_id) ?? []);
      },
      error: (err) => { this.error.set(err?.message || 'Failed to load player'); this.loading.set(false); },
    });
  }

  loadSeasonNames(seasonIds: number[]): void {
    const unique = [...new Set(seasonIds)];
    unique.forEach(sid => {
      this.seasonService.getSeason(sid).subscribe({
        next: (season) => {
          this.seasonNames.update(m => {
            const next = new Map(m);
            next.set(sid, season.name);
            return next;
          });
        },
        error: () => {},
      });
    });
  }

  getSeasonLabel(seasonId: number): string {
    return this.seasonNames().get(seasonId) ?? `Season ${seasonId}`;
  }

  loadTransfers(id: number): void {
    this.transferService.getPlayerTransfers(id).subscribe({
      next: (data) => this.transfers.set(data ?? []),
      error: () => {},
    });
  }

  loadFavoriteStatus(playerId: number): void {
    this.favoriteService.getFavoritePlayers().subscribe({
      next: (favs) => this.isFavorite.set(favs.some(f => f.apiPlayerId === playerId)),
    });
  }

  loadNotes(): void {
    this.notesLoading.set(true);
    this.noteService.getNotes().subscribe({
      next: (data) => { this.notes.set(data ?? []); this.notesLoading.set(false); },
      error: () => this.notesLoading.set(false),
    });
  }

  loadSimilarPlayers(id: number): void {
    this.similarLoading.set(true);
    this.similarError.set(false);
    this.playerService.getSimilarPlayers(id).subscribe({
      next: (data) => { this.similarPlayers.set(data ?? []); this.similarLoading.set(false); },
      error: () => { this.similarLoading.set(false); this.similarError.set(true); },
    });
  }

  async exportPdf(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.player()) return;
    this.exportingPdf.set(true);
    const { jsPDF } = await import('jspdf');
    const p = this.player()!;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    let y = 0;

    // Header band
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, W, 40, 'F');

    // Player name
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(p.displayName || p.name, 14, 20);

    // Position / nationality / age
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(139, 157, 195);
    const meta: string[] = [];
    if (p.position?.name) meta.push(p.position.name);
    if (p.nationality?.name) meta.push(p.nationality.name);
    const age = this.calcAge(p.dateOfBirth);
    if (age) meta.push(`Age ${age}`);
    if (p.height) meta.push(`${p.height} cm`);
    doc.text(meta.join('  ·  '), 14, 30);

    // Scout Report label top right
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOUT REPORT', W - 14, 15, { align: 'right' });
    doc.setTextColor(139, 157, 195);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), W - 14, 22, { align: 'right' });

    y = 50;

    // Stats section
    const stats = p.statistics?.[0]?.details?.filter(d => d.type?.name && d.value.total !== null) ?? [];
    if (stats.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(226, 232, 240);
      doc.text('SEASON STATISTICS', 14, y);
      y += 2;
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(14, y, 80, y);
      y += 6;

      // Draw stats in 3-column grid
      const cols = 3;
      const colW = (W - 28) / cols;
      let col = 0;
      for (const s of stats.slice(0, 18)) {
        const x = 14 + col * colW;
        doc.setFillColor(30, 37, 53);
        doc.roundedRect(x, y, colW - 3, 14, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 232, 240);
        doc.text(String(s.value.total ?? '–'), x + (colW - 3) / 2, y + 6.5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(139, 157, 195);
        doc.text(s.type!.name.toUpperCase(), x + (colW - 3) / 2, y + 11.5, { align: 'center' });
        col++;
        if (col >= cols) { col = 0; y += 17; }
      }
      if (col > 0) y += 17;
      y += 4;
    }

    // Notes section
    const notes = this.playerNotes();
    if (notes.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(226, 232, 240);
      doc.text('SCOUTING NOTES', 14, y);
      y += 2;
      doc.setDrawColor(34, 197, 94);
      doc.line(14, y, 80, y);
      y += 7;

      for (const note of notes) {
        // Date
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94);
        doc.text(this.formatDate(note.createdAt), 14, y);
        y += 4;

        // Note content wrapped
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 210, 230);
        const lines = doc.splitTextToSize(note.content, W - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 5;

        // Divider
        doc.setDrawColor(30, 45, 64);
        doc.line(14, y, W - 14, y);
        y += 5;

        if (y > 270) { doc.addPage(); y = 20; }
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(60, 80, 100);
    doc.text('Generated by Football Scout · Confidential', W / 2, 290, { align: 'center' });

    doc.save(`scout-report-${(p.displayName || p.name).replace(/\s+/g, '-').toLowerCase()}.pdf`);
    this.exportingPdf.set(false);
  }

  toggleFavorite(): void {
    if (!this.player()) return;
    const p = this.player()!;
    if (this.isFavorite()) {
      this.favoriteService.removeFavoritePlayer(this.playerId()).subscribe({
        next: () => this.isFavorite.set(false),
        error: () => {},
      });
    } else {
      const details = this.selectedSeason()?.details ?? [];
      const goals  = details.find(d => d.type_id === 52)?.value?.total  as number | undefined;
      const rating = details.find(d => d.type_id === 118)?.value?.average as number | undefined;
      this.favoriteService.addFavoritePlayer({
        apiPlayerId: this.playerId(),
        playerName:  p.name,
        displayName: p.displayName,
        photo:       p.photo,
        position:    p.position?.name ?? undefined,
        goals:       typeof goals  === 'number' ? Math.round(goals)  : undefined,
        rating:      typeof rating === 'number' ? Math.round(rating * 10) / 10 : undefined,
      }).subscribe({
        next: () => this.isFavorite.set(true),
        error: () => {},
      });
    }
  }

  submitNote(): void {
    if (this.noteForm.invalid || !this.player()) return;
    const p = this.player()!;
    this.noteService.createNote({
      apiPlayerId: this.playerId(),
      playerName: p.name,
      content: this.noteForm.value.content!,
    }).subscribe({
      next: (note) => {
        this.notes.update(ns => [...ns, note]);
        this.noteForm.reset();
      },
    });
  }

  startEdit(note: Note): void {
    this.editingNoteId.set(note.id);
    this.editForm.setValue({ content: note.content });
  }

  saveEdit(note: Note): void {
    if (this.editForm.invalid) return;
    this.noteService.updateNote(note.id, { content: this.editForm.value.content! }).subscribe({
      next: (updated) => {
        this.notes.update(ns => ns.map(n => n.id === updated.id ? updated : n));
        this.editingNoteId.set(null);
      },
    });
  }

  cancelEdit(): void {
    this.editingNoteId.set(null);
  }

  deleteNote(id: number): void {
    this.noteService.deleteNote(id).subscribe({
      next: () => this.notes.update(ns => ns.filter(n => n.id !== id)),
    });
  }

  isLoanTransfer(t: Transfer): boolean {
    return (t.type ?? '').toLowerCase().includes('loan');
  }

  calcDuration(from: Date, to: Date): string {
    const months = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 1) return '';
    if (months < 12) return `${months}mo`;
    const years = months / 12;
    const y = Math.floor(years);
    const m = months % 12;
    return m > 0 ? `${y}yr ${m}mo` : `${y}yr`;
  }

  setTab(tab: 'statistics' | 'notes' | 'transfers'): void {
    this.activeTab.set(tab);
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

  formatAmount(amount?: number): string {
    if (!amount) return 'Undisclosed';
    if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
    return `€${amount}`;
  }

  statVal(val: number | string | null | undefined): string {
    if (val === null || val === undefined) return '–';
    return String(val);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
