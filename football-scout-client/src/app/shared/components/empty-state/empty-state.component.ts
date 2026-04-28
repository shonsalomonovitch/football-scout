import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state animate-fade-up">
      <div class="empty-icon">
        <!-- Football on pitch circle -->
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer pitch circle -->
          <circle cx="40" cy="40" r="36" stroke="rgba(26,45,74,1)" stroke-width="1.5" stroke-dasharray="5 3"/>
          <!-- Inner pitch ring -->
          <circle cx="40" cy="40" r="24" stroke="rgba(26,45,74,0.7)" stroke-width="1"/>
          <!-- Ball body -->
          <circle cx="40" cy="40" r="14" fill="var(--color-surface-2)" stroke="rgba(37,62,104,1)" stroke-width="1.5"/>
          <!-- Top pentagon -->
          <path d="M40 28.5 l3.5 2.5 -1.3 4.2H37.8L36.5 31z"
            fill="rgba(85,104,130,0.15)" stroke="rgba(85,104,130,0.6)" stroke-width="1.2" stroke-linejoin="round"/>
          <!-- Left pentagon -->
          <path d="M29.5 38 l2.2-1.6 3.2 2.2 -1.2 3.6 -3.5 0.4z"
            fill="rgba(85,104,130,0.1)" stroke="rgba(85,104,130,0.4)" stroke-width="1.1" stroke-linejoin="round"/>
          <!-- Right pentagon -->
          <path d="M50.5 38 l-2.2-1.6 -3.2 2.2 1.2 3.6 3.5 0.4z"
            fill="rgba(85,104,130,0.1)" stroke="rgba(85,104,130,0.4)" stroke-width="1.1" stroke-linejoin="round"/>
          <!-- Stitch lines -->
          <line x1="36.5" y1="31" x2="31.7" y2="36.4" stroke="rgba(85,104,130,0.35)" stroke-width="0.9"/>
          <line x1="43.5" y1="31" x2="48.3" y2="36.4" stroke="rgba(85,104,130,0.35)" stroke-width="0.9"/>
          <line x1="37.8" y1="35.2" x2="35.4" y2="40"  stroke="rgba(85,104,130,0.3)"  stroke-width="0.9"/>
          <line x1="42.2" y1="35.2" x2="44.6" y2="40"  stroke="rgba(85,104,130,0.3)"  stroke-width="0.9"/>
        </svg>
      </div>
      <p class="empty-title">{{ title() }}</p>
      @if (message()) {
        <p class="empty-msg">{{ message() }}</p>
      }
      <div class="empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 72px 24px;
      gap: 14px;
      text-align: center;
    }

    .empty-icon {
      margin-bottom: 6px;
    }

    .empty-title {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .empty-msg {
      font-size: var(--text-base);
      color: var(--color-text-muted);
      max-width: 360px;
      line-height: 1.65;
    }

    .empty-actions {
      margin-top: 6px;
    }
  `],
})
export class EmptyStateComponent {
  title   = input('No results found');
  message = input('');
}
