import {ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import {CommonModule} from '@angular/common';
import {TokenService} from '../../../core/auth/services/token.service';
import {AuthService} from '../../../core/auth/services/auth.service';
import {NAV_ITEMS, NavItem} from '../../../core/layouts/nav-config.model';
import {filter} from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    CommonModule,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  @Input() isOpen = false;
  @Output() closeRequested = new EventEmitter<void>();

  private readonly tokens = inject(TokenService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly expandedGroup = signal<string | null>(null);

  // Filter nav items to only those the current role can see
  readonly navItems = computed(() => {
    const role = this.tokens.currentRole();
    if (!role) return [];
    return NAV_ITEMS
      .filter(item => item.roles.includes(role))
      .map(item => ({
        ...item,
        children: item.children?.filter(c => c.roles.includes(role)),
      }));
  });

  readonly currentUser = this.auth.currentUser;

  readonly roleLabel = computed(() => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super administrator',
      ADMIN:       'Administrator',
      TEACHER:     'Teacher',
      STUDENT:     'Student',
      PARENT:      'Parent / Guardian',
    };
    return labels[this.tokens.currentRole() ?? ''] ?? '';
  });

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.autoExpandActiveGroup();
    });
    this.autoExpandActiveGroup();
  }

  private autoExpandActiveGroup(): void {
    const url = this.router.url;
    for (const item of NAV_ITEMS) {
      if (item.children?.some(c => c.route && url.includes(c.route))) {
        this.expandedGroup.set(item.label);
        return;
      }
    }
  }

  toggleGroup(item: NavItem): void {
    if (!item.children?.length) return;
    this.expandedGroup.update(current =>
      current === item.label ? null : item.label
    );
  }

  isGroupExpanded(item: NavItem): boolean {
    return this.expandedGroup() === item.label;
  }

  isGroupActive(item: NavItem): boolean {
    const url = this.router.url;
    return item.children?.some(c => c.route && url.includes(c.route)) ?? false;
  }

  onNavClick(): void {
    this.closeRequested.emit();
  }

  onLogout(): void {
    this.auth.logout();
  }
}
