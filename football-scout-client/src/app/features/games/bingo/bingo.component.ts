import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService, BingoDaily, BingoCategory, BingoPlayer } from '../../../core/services/game.service';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './bingo.component.html',
  styleUrl: './bingo.component.css',
})
export class BingoComponent implements OnInit {
  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);

  mode = signal<'daily' | 'random'>('daily');
  loading = signal(true);
  error = signal('');
  daily = signal<BingoDaily | null>(null);
  currentPlayerIndex = signal(0);
  markedCells = signal<Map<number, BingoPlayer>>(new Map());
  gameState = signal<'playing' | 'won' | 'out'>('playing');
  lastResult = signal<'correct' | 'wrong' | null>(null);
  validating = signal(false);
  wildcardUsed = signal(false);
  wildcardNoMatch = signal(false);
  skippedCount = signal(0);
  successCount = signal(0);
  failedCount = signal(0);

  busy = computed(() => this.validating() || !!this.lastResult() || this.wildcardNoMatch());

  currentPlayer = computed(() => {
    const d = this.daily();
    if (!d) return null;
    const idx = this.currentPlayerIndex();
    return idx < d.players.length ? d.players[idx] : null;
  });

  remaining = computed(() => {
    const d = this.daily();
    if (!d) return 0;
    return Math.max(0, d.players.length - this.currentPlayerIndex() - 1);
  });

  gridRows = computed(() => {
    const cats = this.daily()?.categories ?? [];
    const rows: BingoCategory[][] = [];
    for (let i = 0; i < 4; i++) rows.push(cats.slice(i * 4, i * 4 + 4));
    return rows;
  });

  firstName(player: BingoPlayer): string {
    const parts = player.displayName.trim().split(' ');
    return parts.length > 1 ? parts.slice(0, -1).join(' ') : player.displayName;
  }
  lastName(player: BingoPlayer): string {
    const parts = player.displayName.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  ngOnInit(): void {
    const m = this.route.snapshot.queryParamMap.get('mode');
    if (m === 'random') { this.mode.set('random'); this.loadRandom(); } else { this.loadDaily(); }
  }

  loadDaily(): void {
    this.loading.set(true);
    this.error.set('');
    this.gameService.getBingoDaily().subscribe({
      next: (data) => { this.daily.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load today\'s Bingo card.'); this.loading.set(false); },
    });
  }

  loadRandom(): void {
    this.loading.set(true);
    this.error.set('');
    this.daily.set(null);
    this.currentPlayerIndex.set(0);
    this.markedCells.set(new Map());
    this.gameState.set('playing');
    this.lastResult.set(null);
    this.validating.set(false);
    this.wildcardUsed.set(false);
    this.wildcardNoMatch.set(false);
    this.skippedCount.set(0);
    this.successCount.set(0);
    this.failedCount.set(0);
    this.gameService.getBingoRandom().subscribe({
      next: (data) => { this.daily.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load puzzle.'); this.loading.set(false); },
    });
  }

  selectCategory(cat: BingoCategory): void {
    const player = this.currentPlayer();
    if (!player || this.gameState() !== 'playing' || this.busy()) return;
    if (this.markedCells().has(cat.id)) return;

    this.validating.set(true);
    this.gameService.validateBingoCell(player.id, cat.id, this.daily()!.puzzleId).subscribe({
      next: (res) => {
        this.validating.set(false);
        if (res.valid) {
          this.markedCells.update(m => { const nm = new Map(m); nm.set(cat.id, player); return nm; });
          this.lastResult.set('correct');
          this.successCount.update(n => n + 1);
          this.checkWin();
        } else {
          this.lastResult.set('wrong');
          this.failedCount.update(n => n + 1);
        }
        setTimeout(() => { this.lastResult.set(null); this.advancePlayer(); }, 900);
      },
      error: () => { this.validating.set(false); },
    });
  }

  skipPlayer(): void {
    if (this.gameState() !== 'playing' || this.busy()) return;
    this.skippedCount.update(n => n + 1);
    this.advancePlayer();
  }

  useWildcard(): void {
    if (this.wildcardUsed() || this.gameState() !== 'playing' || this.busy()) return;
    const player = this.currentPlayer();
    const cats = this.daily()?.categories ?? [];
    if (!player) return;

    const emptyCats = cats.filter(cat => !this.markedCells().has(cat.id));
    if (emptyCats.length === 0) {
      this.wildcardUsed.set(true);
      return;
    }

    this.validating.set(true);
    this.gameService.wildcardBingo(player.id, this.daily()!.puzzleId).subscribe({
      next: (res) => {
        this.validating.set(false);
        this.wildcardUsed.set(true);
        const matchedIds = new Set(res.categoryIds);
        const matches = emptyCats.filter(cat => matchedIds.has(cat.id));
        if (matches.length > 0) {
          this.markedCells.update(m => {
            const nm = new Map(m);
            matches.forEach(cat => nm.set(cat.id, player));
            return nm;
          });
          this.successCount.update(n => n + matches.length);
          this.lastResult.set('correct');
          this.checkWin();
          setTimeout(() => { this.lastResult.set(null); this.advancePlayer(); }, 900);
        } else {
          this.wildcardNoMatch.set(true);
          setTimeout(() => { this.wildcardNoMatch.set(false); this.advancePlayer(); }, 1200);
        }
      },
      error: () => { this.validating.set(false); this.wildcardUsed.set(true); },
    });
  }

  advancePlayer(): void {
    const d = this.daily();
    if (!d) return;
    const next = this.currentPlayerIndex() + 1;
    this.currentPlayerIndex.set(next);
    if (next >= d.players.length && this.gameState() === 'playing') {
      this.gameState.set('out');
    }
  }

  checkWin(): void {
    const cats = this.daily()?.categories ?? [];
    const marked = this.markedCells();
    const grid: boolean[][] = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => marked.has(cats[r * 4 + c]?.id))
    );
    for (let r = 0; r < 4; r++) if (grid[r].every(Boolean)) { this.win(); return; }
    for (let c = 0; c < 4; c++) if (grid.every(row => row[c])) { this.win(); return; }
    if ([0,1,2,3].every(i => grid[i][i])) { this.win(); return; }
    if ([0,1,2,3].every(i => grid[i][3-i])) { this.win(); return; }
  }

  win(): void { this.gameState.set('won'); this.currentPlayerIndex.set(9999); }

  isCellMarked(cat: BingoCategory): boolean { return this.markedCells().has(cat.id); }
  getCellPlayer(cat: BingoCategory): BingoPlayer | undefined { return this.markedCells().get(cat.id); }

  onImgError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
}
