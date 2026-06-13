import {ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Sidebar} from './sidebar/sidebar';
import {Topbar} from './topbar/topbar';
import {ConfirmationModal} from '../../shared/components/confirmation-modal';
import {MessagingService} from '../../features/communications/services/messaging.service';
import {CommunicationService} from '../../features/communications/services/communication.service';
import {AuthService} from '../../core/auth/services/auth.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface Toast {
  id: number;
  type: 'message' | 'announcement';
  title: string;
  body: string;
}

@Component({
  selector: 'app-app-layout',
  imports: [
    RouterOutlet,
    Sidebar,
    Topbar,
    ConfirmationModal
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayout implements OnInit, OnDestroy {
  private readonly messagingService = inject(MessagingService);
  private readonly communicationService = inject(CommunicationService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  readonly sidebarOpen = signal(false);
  readonly toasts = signal<Toast[]>([]);
  private toastId = 0;

  ngOnInit(): void {
    this.messagingService.connect();
    this.communicationService.connect();
    this.messagingService.loadTotalUnreadCount();
    this.messagingService.loadConversations();
    this.communicationService.loadAnnouncements();

    this.messagingService.incomingMessage
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        if (notification.type !== 'NEW_MESSAGE') return;
        const me = this.authService.currentUser();
        if (me && notification.senderId === me.id) return;
        this.addToast('message', notification.senderName, notification.content || 'New message');
      });

    this.communicationService.announcements
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        if (notification.type !== 'ANNOUNCEMENT_CREATED') return;
        this.addToast('announcement', notification.title || 'New Announcement', notification.content || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addToast(type: Toast['type'], title: string, body: string): void {
    const id = ++this.toastId;
    this.toasts.update(list => [...list, {id, type, title, body}]);
    setTimeout(() => {
      this.toasts.update(list => list.filter(t => t.id !== id));
    }, 4500);
  }

  dismissToast(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
