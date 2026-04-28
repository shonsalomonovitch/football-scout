import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  mobileOpen  = signal(false);
  sidebarOpen = signal(false);

  openSidebar():  void { this.sidebarOpen.set(true);  }
  closeSidebar(): void { this.sidebarOpen.set(false); }

  toggleMobile(): void { this.mobileOpen.update((v) => !v); }
  closeMobile():  void { this.mobileOpen.set(false); }

  logout(): void {
    this.auth.logout();
    this.closeMobile();
  }

  get displayName(): string {
    const name = this.auth.currentUser()?.name ?? '';
    return name.length > 22 ? name.slice(0, 22) + '…' : name;
  }

  get avatarInitial(): string {
    return (this.auth.currentUser()?.name ?? '?')[0].toUpperCase();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.mobileOpen.set(false); }
}
