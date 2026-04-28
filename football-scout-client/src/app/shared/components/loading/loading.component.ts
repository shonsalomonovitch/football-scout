import { Component, input } from '@angular/core';
import { BouncingDotsComponent } from '../bouncing-dots/bouncing-dots.component';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [BouncingDotsComponent],
  template: `
    @if (full()) {
      <div class="loading-full">
        <app-bouncing-dots size="lg" [message]="label()" />
      </div>
    } @else {
      <!-- Inline skeleton: rows with shimmer -->
      <div class="loading-list" role="status" aria-label="Loading">
        @for (_ of rows; track $index) {
          <div class="skeleton-row">
            <div class="skeleton skeleton-circle" style="width:36px;height:36px;flex-shrink:0"></div>
            <div class="skeleton-body">
              <div class="skeleton skeleton-text" [style.width]="widths[$index % 4] + '%'"></div>
              <div class="skeleton skeleton-text" style="width:38%;height:10px;margin-top:7px"></div>
            </div>
            <div class="skeleton skeleton-text" style="width:50px;height:24px"></div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    /* ── Full loader ── */
    .loading-full {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }

    /* ── Skeleton rows ── */
    .loading-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
    }

    .skeleton-body { flex: 1; }
  `],
})
export class LoadingComponent {
  full  = input(false);
  label = input('');
  readonly rows   = [1, 2, 3, 4, 5];
  readonly widths = [58, 72, 44, 66];
}
