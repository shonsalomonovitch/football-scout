import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error-state animate-fade-up">
      <div class="error-icon">
        <!-- Red card motif -->
        <svg width="56" height="68" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Card shadow -->
          <rect x="5" y="7" width="46" height="58" rx="8" fill="rgba(244,63,94,0.06)"/>
          <!-- Card body -->
          <rect x="2" y="2" width="46" height="58" rx="8"
            fill="rgba(244,63,94,0.10)" stroke="rgba(244,63,94,0.30)" stroke-width="1.5"/>
          <!-- Card inner -->
          <rect x="8" y="8" width="34" height="46" rx="5"
            fill="rgba(244,63,94,0.06)" stroke="rgba(244,63,94,0.15)" stroke-width="1"/>
          <!-- Exclamation mark -->
          <rect x="23" y="20" width="4" height="18" rx="2" fill="rgba(244,63,94,0.7)"/>
          <circle cx="25" cy="45" r="2.5" fill="rgba(244,63,94,0.7)"/>
        </svg>
      </div>
      <p class="error-title">{{ title() }}</p>
      @if (message()) {
        <p class="error-msg">{{ message() }}</p>
      }
      @if (retryable()) {
        <button class="btn btn-secondary btn-sm error-btn" (click)="retry.emit()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Try again
        </button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 72px 24px;
      gap: 14px;
      text-align: center;
    }

    .error-icon { margin-bottom: 6px; }

    .error-title {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-danger);
    }

    .error-msg {
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      max-width: 360px;
      line-height: 1.65;
    }

    .error-btn {
      margin-top: 6px;
      border-color: rgba(244,63,94,0.35);
      color: var(--color-danger);
    }
    .error-btn:hover {
      background: rgba(244,63,94,0.10);
      border-color: var(--color-danger);
    }
  `],
})
export class ErrorStateComponent {
  title     = input('Something went wrong');
  message   = input('');
  retryable = input(true);
  retry     = output<void>();
}
