import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-favorite-btn',
  template: `
    <button
      class="fav-btn"
      [class.fav-active]="active()"
      (click)="toggle.emit()"
      [title]="active() ? 'Remove from favorites' : 'Add to favorites'"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" [attr.fill]="active() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      {{ active() ? 'Saved' : 'Save' }}
    </button>
  `,
  styles: [`
    .fav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .fav-btn:hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
    .fav-active {
      border-color: var(--color-danger) !important;
      color: var(--color-danger) !important;
      background: var(--color-danger-light) !important;
    }
  `],
})
export class FavoriteBtnComponent {
  active = input(false);
  toggle = output<void>();
}
