import {ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Output, signal, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../core/auth/services/auth.service';
import {ThemeToggle} from '../../../shared/components/theme-toggle/theme-toggle';
import {Router} from '@angular/router';
import {MessagingService} from '../../../features/communications/services/messaging.service';
import {CommunicationService} from '../../../features/communications/services/communication.service';

@Component({
  selector: 'app-topbar',
  imports: [
    CommonModule,
    ThemeToggle,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Topbar {
  @Output() menuToggled = new EventEmitter<void>();

  private readonly router = inject(Router);
  readonly messagingService = inject(MessagingService);
  readonly communicationService = inject(CommunicationService);
  readonly currentUser = inject(AuthService).currentUser;

  readonly showNotifications = signal(false);

  readonly notificationConversations = this.messagingService.conversations;

  readonly totalUnread = computed(() =>
    this.messagingService.totalUnreadCount() + this.communicationService.unreadCount()
  );

  readonly unreadConvCount = computed(() =>
    this.messagingService.conversations().filter(c => c.unreadCount > 0).length
  );

  readonly recentAnnouncements = computed(() =>
    this.communicationService.unviewedAnnouncements().slice(0, 5)
  );

  toggleNotifications(): void {
    if (!this.showNotifications()) {
      this.messagingService.loadConversations();
      this.communicationService.loadAnnouncements();
      this.showNotifications.set(true);
    } else {
      this.closeNotifications();
    }
  }

  closeNotifications(): void {
    if (this.showNotifications()) {
      this.showNotifications.set(false);
      this.communicationService.markAllAnnouncementsViewed();
    }
  }

  goToMessaging(): void {
    this.closeNotifications();
    void this.router.navigate(['/app/communication/messaging']);
  }

  goToAnnouncements(): void {
    this.closeNotifications();
    void this.router.navigate(['/app/communication/announcements']);
  }

  goToProfile(): void {
    void this.router.navigate(['/app/profile']);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.topbar__notif-wrapper')) {
      this.closeNotifications();
    }
  }
}
