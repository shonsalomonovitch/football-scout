import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';
import { NavComponent } from './nav/nav.component';

const pageTransition = trigger('routeAnimations', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ],
      { optional: true }
    ),
  ]),
]);

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, NavComponent],
  animations: [pageTransition],
  template: `
    <app-nav />
    <main class="shell-main" [@routeAnimations]="currentRoute()">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .shell-main {
        margin-left: var(--sidebar-width, 56px);
        min-height: 100vh;
      }
      @media (max-width: 768px) {
        .shell-main {
          margin-left: 0;
          padding-bottom: 56px;
        }
      }
    `,
  ],
})
export class ShellComponent {
  private router = inject(Router);

  currentRoute = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).url)
    ),
    { initialValue: '/' }
  );
}
