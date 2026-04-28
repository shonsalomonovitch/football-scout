import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BouncingDotsSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-bouncing-dots',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bouncing-dots" [class]="'bouncing-dots--' + size()" [attr.aria-label]="message() || 'Loading'">
      @for (dot of dotsArray(); track $index) {
        <span class="dot" [style.animation-delay]="($index * delayMs()) + 'ms'"></span>
      }
    </div>
    @if (message()) {
      <span class="bouncing-dots-msg">{{ message() }}</span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bouncing-dots {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .dot {
      display: inline-block;
      border-radius: 50%;
      background: var(--color-accent);
      animation: bounce-dot 0.55s ease-in-out infinite alternate;
      flex-shrink: 0;
    }

    /* ── Sizes ── */
    .bouncing-dots--xs .dot { width: 4px;  height: 4px;  }
    .bouncing-dots--xs      { gap: 4px; }

    .bouncing-dots--sm .dot { width: 6px;  height: 6px;  }
    .bouncing-dots--sm      { gap: 5px; }

    .bouncing-dots--md .dot { width: 8px;  height: 8px;  }
    .bouncing-dots--md      { gap: 6px; }

    .bouncing-dots--lg .dot { width: 11px; height: 11px; }
    .bouncing-dots--lg      { gap: 8px; }

    /* ── Bounce heights per size ── */
    .bouncing-dots--xs .dot { --lift: -5px;  }
    .bouncing-dots--sm .dot { --lift: -8px;  }
    .bouncing-dots--md .dot { --lift: -12px; }
    .bouncing-dots--lg .dot { --lift: -18px; }

    @keyframes bounce-dot {
      0%   { transform: translateY(0);          opacity: 0.55; }
      100% { transform: translateY(var(--lift)); opacity: 1;    }
    }

    .bouncing-dots-msg {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: var(--font-semibold);
    }
  `],
})
export class BouncingDotsComponent {
  size    = input<BouncingDotsSize>('md');
  dots    = input(3);
  message = input('');

  readonly dotsArray = computed(() => Array.from({ length: this.dots() }));
  readonly delayMs   = computed(() => {
    const map: Record<BouncingDotsSize, number> = { xs: 120, sm: 140, md: 160, lg: 180 };
    return map[this.size()];
  });
}
