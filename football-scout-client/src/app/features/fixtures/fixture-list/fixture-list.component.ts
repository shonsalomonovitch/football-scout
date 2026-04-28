import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixtureService } from '../../../core/services/fixture.service';
import { Fixture } from '../../../core/models/fixture.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-fixture-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, PageHeaderComponent],
  templateUrl: './fixture-list.component.html',
  styleUrl: './fixture-list.component.css',
})
export class FixtureListComponent implements OnInit {
  private fixtureService = inject(FixtureService);

  fixtures = signal<Fixture[]>([]);
  loading = signal(false);
  error = signal('');
  selectedDate = signal(this.todayStr());
  mode = signal<'date' | 'live'>('date');

  groupedFixtures = computed(() => {
    const groups = new Map<string, Fixture[]>();
    for (const f of this.fixtures()) {
      const key = f.startingAt ? f.startingAt.substring(0, 10) : 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return Array.from(groups.entries());
  });

  ngOnInit(): void {
    this.loadFixtures();
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadFixtures(): void {
    this.loading.set(true);
    this.error.set('');
    const filters = this.mode() === 'live'
      ? {}
      : { date: this.selectedDate() };

    this.fixtureService.getFixtures(filters).subscribe({
      next: (data) => { this.fixtures.set(data ?? []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.message || 'Failed to load fixtures'); this.loading.set(false); },
    });
  }

  setMode(m: 'date' | 'live'): void {
    this.mode.set(m);
    this.loadFixtures();
  }

  homeGoals(f: Fixture): number | null {
    const s = f.scores?.find(sc => sc.participant === 'home' && sc.description === 'CURRENT');
    return s !== undefined ? s.goals : null;
  }

  awayGoals(f: Fixture): number | null {
    const s = f.scores?.find(sc => sc.participant === 'away' && sc.description === 'CURRENT');
    return s !== undefined ? s.goals : null;
  }

  statusBadgeClass(shortName: string | undefined): string {
    if (!shortName) return 'badge-gray';
    if (shortName === 'FT') return 'badge-gray';
    if (shortName === 'HT') return 'badge-yellow';
    if (['LIVE', '1H', '2H', 'ET', 'P'].includes(shortName)) return 'badge-live';
    return 'badge-gray';
  }

  formatDateTime(f: Fixture): string {
    const d = f.startingAtTimestamp
      ? new Date(f.startingAtTimestamp * 1000)
      : new Date(f.startingAt.replace(' ', 'T') + 'Z');
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
