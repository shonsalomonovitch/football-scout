import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LeagueService } from '../../../core/services/league.service';
import { League } from '../../../core/models/league.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
@Component({
  selector: 'app-league-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './league-list.component.html',
  styleUrl: './league-list.component.css',
})
export class LeagueListComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  leagues = signal<League[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = '';
  countryFilter = '';

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.loadLeagues());

    this.loadLeagues();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeagues(): void {
    this.loading.set(true);
    this.error.set('');
    this.leagueService.getLeagues({
      search: this.searchTerm || undefined,
      country: this.countryFilter || undefined,
    }).subscribe({
      next: (data) => {
        this.leagues.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load leagues');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onCountryChange(): void {
    this.loadLeagues();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
