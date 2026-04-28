import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GameService, WhoAreYaSearchResult, WhoAreYaGuessResponse, WhoAreYaHints } from '../../../core/services/game.service';
import { BouncingDotsComponent } from '../../../shared/components/bouncing-dots/bouncing-dots.component';

const MAX_GUESSES = 8;

@Component({
  selector: 'app-who-are-ya',
  standalone: true,
  imports: [RouterLink, CommonModule, UpperCasePipe, BouncingDotsComponent],
  templateUrl: './who-are-ya.component.html',
  styleUrl: './who-are-ya.component.css',
})
export class WhoAreYaComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private search$ = new Subject<string>();

  mode       = signal<'daily' | 'random'>('daily');
  loading    = signal(true);
  error      = signal('');
  puzzleId   = signal('');
  photo      = signal('');
  guesses    = signal<{ id: number; displayName: string; photo: string; hints?: WhoAreYaHints }[]>([]);
  gameState  = signal<'playing' | 'won' | 'lost'>('playing');
  revealedPlayer = signal<WhoAreYaGuessResponse['player'] | null>(null);
  searchTerm = signal('');
  suggestions    = signal<WhoAreYaSearchResult[]>([]);
  suggestLoading = signal(false);
  dropdownOpen   = signal(false);
  submitting     = signal(false);
  photoError     = signal(false);

  maxGuesses = MAX_GUESSES;

  blurPx = computed(() => Math.max(0, 20 * 0.6 - this.guesses().length * (20 * 0.05)));

  // Confirmed correct fields — derived purely from hints.match returned by backend
  confirmedHints = computed(() => {
    const out: {
      nat?:        { value: string; flag?: string };
      league?:     { value: string; logo?: string };
      team?:       { value: string; logo?: string };
      position?:   string;
      age?:        number;
      shirtNumber?: number;
    } = {};
    for (const g of this.guesses()) {
      const h = g.hints;
      if (!h) continue;
      if (h.nationality.match   === 'correct') out.nat        = { value: h.nationality.value, flag: h.nationality.flag };
      if (h.league.match        === 'correct') out.league     = { value: h.league.value,      logo: h.league.logo };
      if (h.team.match          === 'correct') out.team       = { value: h.team.value,         logo: h.team.logo };
      if (h.position.match      === 'correct') out.position   = h.position.value;
      if (h.age.match           === 'correct') out.age        = h.age.value;
      if (h.shirtNumber.match   === 'correct' && h.shirtNumber.value !== null) out.shirtNumber = h.shirtNumber.value!;
    }
    return out;
  });

  posAbbr(position: string | undefined): string {
    if (!position) return '?';
    const p = position.toLowerCase();
    if (p.includes('goalkeeper') || p === 'gk') return 'GK';
    if (p.includes('defend') || p === 'cb' || p === 'rb' || p === 'lb') return 'DEF';
    if (p.includes('midfield') || p === 'cm' || p === 'dm' || p === 'am') return 'MID';
    if (p.includes('winger') || p.includes('wing')) return 'WNG';
    if (p.includes('forward') || p.includes('striker') || p.includes('attack') || p === 'st' || p === 'cf') return 'FWD';
    return position.slice(0, 3).toUpperCase();
  }

  ngOnInit(): void {
    this.search$.pipe(debounceTime(250), distinctUntilChanged()).subscribe(q => this.doSearch(q));
    const m = this.route.snapshot.queryParamMap.get('mode');
    m === 'random' ? this.loadRandom() : this.loadDaily();
  }

  loadDaily(): void {
    this.mode.set('daily');
    this.resetGame();
    this.gameService.getWhoAreYaDaily().subscribe({
      next: (data) => { this.puzzleId.set(data.puzzleId); this.photo.set(data.photo); this.loading.set(false); },
      error: () => { this.error.set('Failed to load today\'s puzzle.'); this.loading.set(false); },
    });
  }

  loadRandom(): void {
    this.mode.set('random');
    this.resetGame();
    this.gameService.getWhoAreYaRandom().subscribe({
      next: (data) => { this.puzzleId.set(data.puzzleId); this.photo.set(data.photo); this.loading.set(false); },
      error: () => { this.error.set('Failed to load a random puzzle.'); this.loading.set(false); },
    });
  }

  private resetGame(): void {
    this.loading.set(true);
    this.error.set('');
    this.puzzleId.set('');
    this.photo.set('');
    this.guesses.set([]);
    this.gameState.set('playing');
    this.revealedPlayer.set(null);
    this.searchTerm.set('');
    this.suggestions.set([]);
    this.photoError.set(false);
  }

  onInput(val: string): void {
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
    this.gameService.searchWhoAreYa(q).subscribe({
      next: (data) => { this.suggestions.set(data ?? []); this.suggestLoading.set(false); },
      error: () => this.suggestLoading.set(false),
    });
  }

  isAlreadyGuessed(id: number): boolean {
    return this.guesses().some(g => g.id === id);
  }

  selectPlayer(p: WhoAreYaSearchResult): void {
    this.dropdownOpen.set(false);
    this.suggestions.set([]);
    this.searchTerm.set('');
    if (this.gameState() !== 'playing' || this.submitting()) return;
    if (this.isAlreadyGuessed(p.id)) return;
    this.submitting.set(true);
    this.gameService.guessWhoAreYa(p.id, this.puzzleId(), this.guesses().length + 1).subscribe({
      next: (res) => {
        this.guesses.update(gs => [...gs, { id: p.id, displayName: p.displayName, photo: p.photo, hints: res.hints }]);
        if (res.correct) {
          this.revealedPlayer.set(res.player!);
          this.gameState.set('won');
        } else if (this.guesses().length >= MAX_GUESSES) {
          this.revealedPlayer.set(res.player ?? null);
          this.gameState.set('lost');
        }
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }

  ngOnDestroy(): void {}

  closeDropdown(): void { this.dropdownOpen.set(false); }
  onPhotoError(e: Event): void { this.photoError.set(true); (e.target as HTMLImageElement).style.display = 'none'; }
  onImgError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
}
