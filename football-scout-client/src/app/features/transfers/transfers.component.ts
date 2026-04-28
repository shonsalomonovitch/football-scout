import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransferService } from '../../core/services/transfer.service';
import { Transfer } from '../../core/models/transfer.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingComponent, EmptyStateComponent],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.css',
})
export class TransfersComponent implements OnInit {
  private transferService = inject(TransferService);

  transfers = signal<Transfer[]>([]);
  loading = signal(true);
  error = signal('');
  fromDate = signal('');
  toDate = signal('');

  ngOnInit(): void {
    this.loadLatest();
  }

  loadLatest(): void {
    this.loading.set(true);
    this.error.set('');
    this.transferService.getLatestTransfers().subscribe({
      next: (data) => { this.transfers.set(data ?? []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load transfers'); this.loading.set(false); },
    });
  }

  search(): void {
    if (!this.fromDate() || !this.toDate()) return;
    this.loading.set(true);
    this.error.set('');
    this.transferService.getTransfersBetween({ from: this.fromDate(), to: this.toDate() }).subscribe({
      next: (data) => { this.transfers.set(data ?? []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load transfers'); this.loading.set(false); },
    });
  }

  formatAmount(amount?: number): string {
    if (!amount) return 'Undisclosed';
    if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
    return `€${amount}`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
