import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TokenService } from '../../../../core/auth/services/token.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import {
  ConversationResponse,
  MessageResponse,
  UserSearchResult,
} from '../../models/communication.models';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './messaging.html',
  styleUrl: './messaging.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Messaging implements OnInit, OnDestroy {
  private readonly messagingService = inject(MessagingService);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly fb = inject(FormBuilder);

  readonly conversations = this.messagingService.conversations;
  readonly activeMessages = this.messagingService.activeMessages;

  readonly isLoading = signal(true);
  readonly isSending = signal(false);
  readonly loadingMessages = signal(false);
  readonly loadingUsers = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly activeConversationId = signal<number | null>(null);
  readonly showNewChatPanel = signal(false);
  readonly userSearchQuery = signal('');
  readonly searchResults = signal<UserSearchResult[]>([]);
  readonly creatingConv = signal<number | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentUserId = computed(() => {
    const user = this.authService.currentUser();
    return user ? String(user.id) : null;
  });

  readonly messageForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    if (!id) return null;
    return this.conversations().find(c => c.id === id) ?? null;
  });

  readonly conversationPartner = computed(() => {
    const conv = this.activeConversation();
    const uid = this.currentUserId();
    if (!conv || !uid) return null;
    if (conv.type === 'GROUP') return null;
    return conv.participants.find(p => String(p.userId) !== uid) ?? null;
  });

  readonly sortedConversations = computed(() => {
    return [...this.conversations()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  readonly filteredResults = computed(() => {
    const uid = this.currentUserId();
    const q = this.userSearchQuery().toLowerCase().trim();
    if (!q) return this.searchResults();
    return this.searchResults().filter(u =>
      String(u.id) !== uid &&
      (`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.messagingService.connect();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.messagingService.getConversations().subscribe({
      next: (list) => {
        this.messagingService.setConversations(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load conversations');
        this.isLoading.set(false);
      },
    });
  }

  selectConversation(conversation: ConversationResponse): void {
    const prevId = this.activeConversationId();
    this.activeConversationId.set(conversation.id);
    this.messagingService.selectConversationForNotifications(conversation.id);
    this.loadMessages(conversation.id);
    this.messagingService.markAsRead(conversation.id).subscribe({
      next: () => this.messagingService.markConversationAsReadLocally(conversation.id),
    });

    if (prevId) {
      this.messagingService.unsubscribeFromConversation(prevId);
    }
    this.messagingService.subscribeToConversation(conversation.id);
  }

  loadMessages(conversationId: number): void {
    this.loadingMessages.set(true);
    this.messagingService.getConversationMessages(conversationId).subscribe({
      next: (messages) => {
        this.messagingService.setActiveMessages(messages.reverse());
        this.loadingMessages.set(false);
      },
      error: () => {
        this.loadingMessages.set(false);
      },
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid) return;
    const convId = this.activeConversationId();
    if (!convId) return;

    this.isSending.set(true);
    const content = this.messageForm.getRawValue().content!;

    this.messagingService.sendMessage({ conversationId: convId, content }).subscribe({
      next: (msg) => {
        this.messagingService.appendMessage(msg);
        this.messageForm.reset();
        this.isSending.set(false);
      },
      error: () => {
        this.isSending.set(false);
      },
    });
  }

  openNewChat(): void {
    this.showNewChatPanel.set(true);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.loadingUsers.set(true);
    this.messagingService.getSchoolUsers().subscribe({
      next: (users) => {
        this.searchResults.set(users);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.loadingUsers.set(false);
      },
    });
  }

  closeNewChat(): void {
    this.showNewChatPanel.set(false);
    this.searchTimer = null;
  }

  onSearchInput(query: string): void {
    this.userSearchQuery.set(query);
    if (this.searchTimer) clearTimeout(this.searchTimer);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.loadingUsers.set(true);
    this.searchTimer = setTimeout(() => {
      this.messagingService.searchUsers(trimmed).subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.loadingUsers.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.loadingUsers.set(false);
        },
      });
    }, 300);
  }

  startDirectConversation(userId: number): void {
    this.creatingConv.set(userId);
    this.messagingService
      .createConversation({ type: 'DIRECT', participantIds: [userId] })
      .subscribe({
        next: (conv) => {
          this.messagingService.updateConversationInList(conv);
          this.creatingConv.set(null);
          this.closeNewChat();
          this.selectConversation(conv);
        },
        error: () => {
          this.creatingConv.set(null);
        },
      });
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  conversationTitle(conv: ConversationResponse): string {
    if (conv.title) return conv.title;
    if (conv.type === 'GROUP') return 'Group Chat';
    const uid = this.currentUserId();
    if (!uid) return 'Unknown';
    const other = conv.participants.find(p => String(p.userId) !== uid);
    return other ? `${other.firstName} ${other.lastName}` : 'Unknown';
  }

  conversationAvatar(conv: ConversationResponse): string {
    if (conv.type === 'GROUP') return 'G';
    const uid = this.currentUserId();
    if (!uid) return '?';
    const other = conv.participants.find(p => String(p.userId) !== uid);
    return other ? `${other.firstName.charAt(0)}${other.lastName.charAt(0)}` : '?';
  }

  lastMessagePreview(conv: ConversationResponse): string {
    if (!conv.lastMessage) return 'No messages yet';
    const uid = this.currentUserId();
    const isMine = uid !== null && String(conv.lastMessage.senderId) === uid;
    const prefix = isMine ? 'You: ' : '';
    const content = conv.lastMessage.deleted
      ? 'Message deleted'
      : conv.lastMessage.content;
    return prefix + content;
  }

  isOwnMessage(msg: MessageResponse): boolean {
    const uid = this.currentUserId();
    return uid !== null && String(msg.senderId) === uid;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
