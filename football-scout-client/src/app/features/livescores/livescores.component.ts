import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { LivescoreService } from '../../core/services/livescore.service';
import { Livescore } from '../../core/models/livescore.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-livescores',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, EmptyStateComponent],
  templateUrl: './livescores.component.html',
  styleUrl: './livescores.component.css',
  animations: [
    /* League group cards stagger in from below */
    trigger('groupsEnter', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(70, [
            animate('320ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
    /* Each match card inside a group fades in from left */
    trigger('matchEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-6px)' }),
        animate('220ms ease', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class LivescoresComponent implements OnInit, OnDestroy {
  private livescoreService = inject(LivescoreService);

  matches = signal<Livescore[]>([]);
  loading = signal(true);
  error = signal('');
  refreshing = signal(false);
  mode = signal<'all' | 'inplay'>('all');
  private pollSub?: Subscription;

  groupedMatches = computed(() => {
    const groups: Record<number, Livescore[]> = {};
    for (const m of this.matches()) {
      if (!groups[m.leagueId]) groups[m.leagueId] = [];
      groups[m.leagueId].push(m);
    }
    return Object.values(groups);
  });

  ngOnInit(): void {
    this.loadMatches();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadMatches(): void {
    this.loading.set(true);
    this.error.set('');
    const obs = this.mode() === 'inplay'
      ? this.livescoreService.getInPlay()
      : this.livescoreService.getAll();

    obs.subscribe({
      next: (data) => { this.matches.set(data ?? []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load livescores'); this.loading.set(false); },
    });
  }

  startPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(12000).pipe(
      startWith(0),
      switchMap(() => this.livescoreService.getLatest()),
    ).subscribe({
      next: (latest) => {
        if (!latest?.length) return;
        this.matches.update(current => {
          const updated = [...current];
          for (const live of latest) {
            const idx = updated.findIndex(m => m.id === live.id);
            if (idx !== -1) updated[idx] = live;
          }
          return updated;
        });
      },
    });
  }

  manualRefresh(): void {
    if (this.loading() || this.refreshing()) return;
    this.refreshing.set(true);
    const obs = this.mode() === 'inplay'
      ? this.livescoreService.getInPlay()
      : this.livescoreService.getAll();
    obs.subscribe({
      next: (data) => { this.matches.set(data ?? []); this.refreshing.set(false); },
      error: () => { this.error.set('Failed to refresh livescores'); this.refreshing.set(false); },
    });
  }

  setMode(mode: 'all' | 'inplay'): void {
    this.mode.set(mode);
    this.loadMatches();
  }

  isLive(m: Livescore): boolean {
    const s = m.state?.short_name ?? '';
    return ['1H', '2H', 'HT', 'ET', 'PEN', 'LIVE'].includes(s);
  }

  stateClass(m: Livescore): string {
    const s = m.state?.short_name ?? '';
    if (s === 'FT' || s === 'AET') return 'state-ft';
    if (this.isLive(m)) return 'state-live';
    if (s === 'NS') return 'state-ns';
    return 'state-other';
  }

  formatKO(m: Livescore): string {
    try {
      const d = m.startingAtTimestamp
        ? new Date(m.startingAtTimestamp * 1000)
        : new Date(m.startingAt.replace(' ', 'T') + 'Z');
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
    } catch { return m.startingAt; }
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
