import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, CommonModule],
  template: `
    <div class="page-header">
      @if (backLink()) {
        <a [routerLink]="backLink()" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          {{ backLabel() }}
        </a>
      }
      <div class="header-row">
        <div class="header-main">
          @if (label()) {
            <p class="section-label">{{ label() }}</p>
          }
          <h1 class="header-title">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="header-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="header-actions">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      padding: var(--space-8) 0 var(--space-6);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-6);
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: var(--font-medium);
      margin-bottom: var(--space-4);
      transition: color var(--transition-fast);
    }
    .back-link:hover { color: var(--color-text-primary); }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .header-title {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      font-weight: 700;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      color: var(--color-text-primary);
      line-height: 1.1;
    }
    .header-subtitle {
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      margin-top: var(--space-2);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }
    @media (max-width: 600px) {
      .header-row { flex-direction: column; }
      .header-title { font-size: var(--text-2xl); }
    }
  `],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input('');
  label = input('');
  backLink = input('');
  backLabel = input('Back');
}
