import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, interval } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GameService, Box2BoxPuzzle, Box2BoxSearchResult } from '../../../core/services/game.service';
import { BouncingDotsComponent } from '../../../shared/components/bouncing-dots/bouncing-dots.component';

interface FilledCell { id: number; displayName: string; photo: string; }

@Component({
  selector: 'app-box2box',
  standalone: true,
  imports: [RouterLink, CommonModule, BouncingDotsComponent],
  templateUrl: './box2box.component.html',
  styleUrl: './box2box.component.css',
})
export class Box2BoxComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInputEl?: ElementRef<HTMLInputElement>;
  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private search$ = new Subject<string>();
  private timerSub?: Subscription;
  private searchSub?: Subscription;

  mode = signal<'daily' | 'random'>('daily');
  timedMode = signal(true);
  gameStarted = signal(false);
  loading = signal(true);
  error = signal('');
  puzzle = signal<Box2BoxPuzzle | null>(null);
  cells = signal<Map<string, FilledCell>>(new Map());
  activeCell = signal<{ row: number; col: number } | null>(null);
  searchTerm = signal('');
  suggestions = signal<Box2BoxSearchResult[]>([]);
  suggestLoading = signal(false);
  dropdownOpen = signal(false);
  validating = signal(false);
  invalidCell = signal<string | null>(null);
  gameState = signal<'playing' | 'won' | 'lost'>('playing');
  timeLeft = signal(180);

  timeDisplay = computed(() => {
    const t = this.timeLeft();
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  filledCount      = computed(() => this.cells().size);
  uniquePlayers    = computed(() => new Set([...this.cells().values()].map(c => c.id)).size);
  percentComplete  = computed(() => Math.round(this.cells().size / 9 * 100));
  isUrgent         = computed(() => this.timeLeft() <= 30);

  cellKey(row: number, col: number): string { return `${row}-${col}`; }
  getCell(row: number, col: number): FilledCell | undefined { return this.cells().get(this.cellKey(row, col)); }
  isActive(row: number, col: number): boolean {
    const a = this.activeCell();
    return !!a && a.row === row && a.col === col;
  }
  isInvalid(row: number, col: number): boolean { return this.invalidCell() === this.cellKey(row, col); }

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(debounceTime(250), distinctUntilChanged()).subscribe(q => this.doSearch(q));
    const m = this.route.snapshot.queryParamMap.get('mode');
    if (m === 'random') { this.mode.set('random'); this.loadRandom(); } else { this.loadDaily(); }
  }

  ngOnDestroy(): void { this.timerSub?.unsubscribe(); this.searchSub?.unsubscribe(); }

  loadDaily(): void {
    this.loading.set(true);
    this.error.set('');
    this.gameService.getBox2BoxDaily().subscribe({
      next: (data) => { this.puzzle.set(data); this.loading.set(false); this.gameStarted.set(false); },
      error: () => { this.error.set('Failed to load today\'s puzzle.'); this.loading.set(false); },
    });
  }

  loadRandom(): void {
    this.loading.set(true);
    this.error.set('');
    this.cells.set(new Map());
    this.gameState.set('playing');
    this.timeLeft.set(180);
    this.activeCell.set(null);
    this.timedMode.set(true);
    this.gameStarted.set(false);
    this.timerSub?.unsubscribe();
    this.gameService.getBox2BoxRandom().subscribe({
      next: (data) => { this.puzzle.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load puzzle.'); this.loading.set(false); },
    });
  }

  startGame(timed: boolean): void {
    this.timedMode.set(timed);
    this.gameStarted.set(true);
    if (timed) this.startTimer();
  }

  startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      const t = this.timeLeft() - 1;
      this.timeLeft.set(t);
      if (t <= 0 && this.gameState() === 'playing') {
        this.gameState.set('lost');
        this.timerSub?.unsubscribe();
      }
    });
  }

  clickCell(row: number, col: number): void {
    if (!this.gameStarted() || this.gameState() !== 'playing') return;
    if (this.getCell(row, col)) return;
    this.activeCell.set({ row, col });
    this.searchTerm.set('');
    this.suggestions.set([]);
    this.dropdownOpen.set(false);
    setTimeout(() => this.searchInputEl?.nativeElement.focus(), 50);
  }

  doneGame(): void {
    if (this.gameState() !== 'playing') return;
    this.timerSub?.unsubscribe();
    this.gameState.set(this.cells().size === 9 ? 'won' : 'lost');
    this.activeCell.set(null);
  }

  closeCell(): void {
    this.activeCell.set(null);
    this.searchTerm.set('');
    this.suggestions.set([]);
    this.dropdownOpen.set(false);
  }

  onSearchInput(val: string): void {
    this.searchTerm.set(val);
    if (val.trim().length >= 2) {
      this.dropdownOpen.set(true);
      this.search$.next(val.trim());
    } else {
      this.dropdownOpen.set(false);
      this.suggestions.set([]);
    }
  }

  doSearch(q: string): void {
    this.suggestLoading.set(true);
    this.gameService.searchBox2Box(q).subscribe({
      next: (data) => { this.suggestions.set(data ?? []); this.suggestLoading.set(false); },
      error: () => this.suggestLoading.set(false),
    });
  }

  selectPlayer(p: Box2BoxSearchResult): void {
    const cell = this.activeCell();
    if (!cell || !this.puzzle()) return;
    this.dropdownOpen.set(false);
    this.suggestions.set([]);
    this.searchTerm.set('');
    this.validating.set(true);
    this.invalidCell.set(null);
    this.gameService.validateBox2BoxCell(p.id, cell.row, cell.col, this.puzzle()!.puzzleId).subscribe({
      next: (res) => {
        if (res.valid) {
          const key = this.cellKey(cell.row, cell.col);
          this.cells.update(m => { const nm = new Map(m); nm.set(key, { id: p.id, displayName: p.displayName, photo: p.photo }); return nm; });
          this.activeCell.set(null);
          if (this.cells().size === 9) { this.gameState.set('won'); this.timerSub?.unsubscribe(); }
        } else {
          this.invalidCell.set(this.cellKey(cell.row, cell.col));
          setTimeout(() => this.invalidCell.set(null), 1200);
        }
        this.validating.set(false);
      },
      error: () => { this.validating.set(false); },
    });
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
}
