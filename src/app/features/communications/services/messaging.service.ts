import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/services/token.service';
import { WebSocketService } from '../../../core/services/websocket/websocket.service';
import {
  ConversationResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  MessageResponse,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessageNotification,
  ApiResponse,
  ConversationType,
  UserSearchResult,
} from '../models/communication.models';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly ws = inject(WebSocketService);

  private readonly api = `${environment.apiUrl}/messaging`;

  private readonly subscribedConversations = new Set<number>();

  private readonly _selectedConversationId = signal<number | null>(null);
  readonly selectedConversationId = this._selectedConversationId.asReadonly();

  readonly incomingMessage = new Subject<MessageNotification>();

  private readonly _totalUnreadCount = signal<number>(0);
  readonly totalUnreadCount = this._totalUnreadCount.asReadonly();

  private readonly _conversations = signal<ConversationResponse[]>([]);
  readonly conversations = this._conversations.asReadonly();

  private readonly _activeMessages = signal<MessageResponse[]>([]);
  readonly activeMessages = this._activeMessages.asReadonly();

  // ── REST API ────────────────────────────────────────────

  getConversations(): Observable<ConversationResponse[]> {
    return this.http
      .get<ApiResponse<ConversationResponse[]>>(`${this.api}/conversations`)
      .pipe(map(r => r.data));
  }

  getConversationsByType(type: ConversationType): Observable<ConversationResponse[]> {
    return this.http
      .get<ApiResponse<ConversationResponse[]>>(`${this.api}/conversations/type/${type}`)
      .pipe(map(r => r.data));
  }

  getConversationById(id: number): Observable<ConversationResponse> {
    return this.http
      .get<ApiResponse<ConversationResponse>>(`${this.api}/conversations/${id}`)
      .pipe(map(r => r.data));
  }

  createConversation(request: CreateConversationRequest): Observable<ConversationResponse> {
    return this.http
      .post<ApiResponse<ConversationResponse>>(`${this.api}/conversations`, request)
      .pipe(map(r => r.data));
  }

  updateConversation(id: number, request: UpdateConversationRequest): Observable<ConversationResponse> {
    return this.http
      .put<ApiResponse<ConversationResponse>>(`${this.api}/conversations/${id}`, request)
      .pipe(map(r => r.data));
  }

  deleteConversation(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.api}/conversations/${id}`)
      .pipe(map(() => void 0));
  }

  leaveConversation(id: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.api}/conversations/${id}/leave`, {})
      .pipe(map(() => void 0));
  }

  addParticipants(conversationId: number, userIds: number[]): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.api}/conversations/${conversationId}/participants`, userIds)
      .pipe(map(() => void 0));
  }

  removeParticipant(conversationId: number, userId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.api}/conversations/${conversationId}/participants/${userId}`)
      .pipe(map(() => void 0));
  }

  sendMessage(request: CreateMessageRequest): Observable<MessageResponse> {
    return this.http
      .post<ApiResponse<MessageResponse>>(`${this.api}/messages`, request)
      .pipe(map(r => r.data));
  }

  getConversationMessages(conversationId: number, page = 0, size = 50): Observable<MessageResponse[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http
      .get<ApiResponse<MessageResponse[]>>(`${this.api}/conversations/${conversationId}/messages`, { params })
      .pipe(map(r => r.data));
  }

  getMessageById(conversationId: number, messageId: number): Observable<MessageResponse> {
    return this.http
      .get<ApiResponse<MessageResponse>>(`${this.api}/conversations/${conversationId}/messages/${messageId}`)
      .pipe(map(r => r.data));
  }

  updateMessage(conversationId: number, messageId: number, request: UpdateMessageRequest): Observable<MessageResponse> {
    return this.http
      .put<ApiResponse<MessageResponse>>(`${this.api}/conversations/${conversationId}/messages/${messageId}`, request)
      .pipe(map(r => r.data));
  }

  deleteMessage(conversationId: number, messageId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.api}/conversations/${conversationId}/messages/${messageId}`)
      .pipe(map(() => void 0));
  }

  markAsRead(conversationId: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.api}/conversations/${conversationId}/read`, {})
      .pipe(map(() => void 0));
  }

  markConversationAsReadLocally(conversationId: number): void {
    const oldCount = this._conversations().find(c => c.id === conversationId)?.unreadCount ?? 0;
    if (oldCount === 0) return;

    this._conversations.update(list =>
      list.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
    this._totalUnreadCount.update(c => Math.max(0, c - oldCount));
  }

  getUnreadCount(conversationId: number): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.api}/conversations/${conversationId}/unread/count`)
      .pipe(map(r => r.data));
  }

  searchUsers(query: string): Observable<UserSearchResult[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<ApiResponse<UserSearchResult[]>>(`${environment.apiUrl}/users/search`, { params })
      .pipe(map(r => r.data));
  }

  getSchoolUsers(): Observable<UserSearchResult[]> {
    return this.http
      .get<ApiResponse<UserSearchResult[]>>(`${environment.apiUrl}/users/school`)
      .pipe(map(r => r.data));
  }

  getTotalUnreadCount(): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.api}/unread/total`)
      .pipe(map(r => r.data));
  }

  loadConversations(): void {
    this.getConversations().subscribe({
      next: list => {
        this.setConversations(list);
        const total = list.reduce((sum, c) => sum + c.unreadCount, 0);
        this._totalUnreadCount.set(total);
      },
      error: err => console.error('Failed to load conversations:', err),
    });
  }

  loadTotalUnreadCount(): void {
    this.getTotalUnreadCount().subscribe({
      next: count => this._totalUnreadCount.set(count),
      error: () => {},
    });
  }

  setConversations(list: ConversationResponse[]): void {
    this._conversations.set(list);
    list.forEach(c => this.subscribeToConversation(c.id));
  }

  selectConversationForNotifications(conversationId: number | null): void {
    this._selectedConversationId.set(conversationId);
  }

  updateConversationInList(conv: ConversationResponse): void {
    this._conversations.update(list => {
      if (list.some(c => c.id === conv.id)) return list;
      return [conv, ...list];
    });
    this.subscribeToConversation(conv.id);
  }

  setActiveMessages(messages: MessageResponse[]): void {
    this._activeMessages.set(messages);
  }

  appendMessage(msg: MessageResponse): void {
    this._activeMessages.update(list => {
      if (list.some(m => m.id === msg.id)) return list;
      return [...list, msg];
    });
    this.updateConversationLastMessage(msg);
  }

  private updateConversationLastMessage(msg: MessageResponse): void {
    this._conversations.update(list =>
      list.map(c => {
        if (c.id !== msg.conversationId) return c;
        return { ...c, lastMessage: msg, updatedAt: msg.createdAt };
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  }

  // WebSocket
  connect(): void {
    this.ws.connect();
  }

  disconnect(): void {
    this.subscribedConversations.clear();
    this.ws.disconnect();
  }

  subscribeToConversation(conversationId: number): void {
    if (this.subscribedConversations.has(conversationId)) return;
    this.subscribedConversations.add(conversationId);
    const topic = `/topic/conversations.${conversationId}`;
    this.ws.subscribe(topic, (body: string) => {
      console.log('[MSG] received notification:', body);
      const notification: MessageNotification = JSON.parse(body);
      this.handleNotification(notification);
    });
  }

  unsubscribeFromConversation(_conversationId: number): void {
    // Keep all subscriptions active for real-time updates across all conversations
  }

  private handleNotification(notification: MessageNotification): void {
    console.log('[MSG] handleNotification called, type:', notification.type, 'convId:', notification.conversationId, 'msgId:', notification.messageId);
    this.incomingMessage.next(notification);

    if (notification.type === 'NEW_MESSAGE') {
      const msg = this.notificationToMessage(notification);

      if (notification.conversationId === this._selectedConversationId()) {
        this._activeMessages.update(list => {
          const exists = list.some(m => m.id === notification.messageId);
          console.log('[MSG] _activeMessages update, current length:', list.length, 'exists:', exists);
          if (exists) return list;
          return [...list, msg];
        });
      }

      this.updateConversationLastMessage(msg);

      const myId = this.getMyUserId();
      if (myId !== null && notification.senderId !== myId) {
        this._totalUnreadCount.update(c => c + 1);
        this._conversations.update(list =>
          list.map(c => {
            if (c.id !== notification.conversationId) return c;
            return { ...c, unreadCount: c.unreadCount + 1 };
          })
        );
        console.log('[MSG] totalUnreadCount incremented to:', this._totalUnreadCount());
      }
    }
  }

  private getMyUserId(): number | null {
    try {
      const token = this.tokenService.token();
      if (!token) {
        console.warn('[MSG] getMyUserId: no token');
        return null;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[MSG] getMyUserId: token payload userId:', payload.userId);
      return payload.userId ?? null;
    } catch (err) {
      console.warn('[MSG] getMyUserId error:', err);
      return null;
    }
  }

  private notificationToMessage(n: MessageNotification): MessageResponse {
    return {
      id: n.messageId,
      conversationId: n.conversationId,
      senderId: n.senderId,
      senderName: n.senderName,
      senderRole: '',
      content: n.content || '',
      type: n.messageType,
      edited: false,
      deleted: false,
      createdAt: n.createdAt,
    };
  }
}
