import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../auth/services/token.service';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly tokenService = inject(TokenService);
  private readonly zone = inject(NgZone);

  private stompClient: any = null;
  private connecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly topics = new Map<string, Array<(body: string) => void>>();
  private readonly stompSubs = new Map<string, any>();

  private readonly wsUrl = environment.apiUrl.replace('/api', '/ws');

  private get connected(): boolean {
    return !!this.stompClient?.connected;
  }

  connect(): void {
    if (this.connected || this.connecting) {
      console.log('[WS] already connected/connecting');
      return;
    }

    const token = this.tokenService.token();
    if (!token) {
      console.warn('[WS] no token available');
      return;
    }

    console.log('[WS] connecting...');
    this.connecting = true;

    try {
      this.stompClient = Stomp.over(
        () => new SockJS(this.wsUrl + '?token=' + encodeURIComponent(token))
      );
      this.stompClient.debug = () => {};
      this.stompClient.heartbeatIncoming = 10000;
      this.stompClient.heartbeatOutgoing = 10000;

      this.stompClient.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          console.log('[WS] connected successfully');
          this.connecting = false;
          this.zone.run(() => this.resubscribeAll());
        },
        (error: any) => {
          console.warn('[WS] connection error:', error);
          this.connecting = false;
          this.stompClient = null;
          this.scheduleReconnect();
        }
      );
    } catch {
      this.connecting = false;
      this.stompClient = null;
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.topics.clear();
    this.stompSubs.clear();
    if (this.stompClient?.connected) {
      try { this.stompClient.disconnect(); } catch { /* ignore */ }
    }
    this.stompClient = null;
  }

  subscribe(topic: string, callback: (body: string) => void): void {
    console.log('[WS] subscribe:', topic, 'connected:', this.connected, 'callbacks:', (this.topics.get(topic)?.length ?? 0) + 1);
    const callbacks = this.topics.get(topic) || [];
    callbacks.push(callback);
    this.topics.set(topic, callbacks);

    if (this.connected) {
      this.doSubscribe(topic, callback);
    }
  }

  unsubscribe(topic: string): void {
    this.topics.delete(topic);
    const sub = this.stompSubs.get(topic);
    if (sub) {
      try { sub.unsubscribe(); } catch { /* ignore */ }
      this.stompSubs.delete(topic);
    }
  }

  private doSubscribe(topic: string, callback: (body: string) => void): void {
    if (!this.stompClient?.connected) return;

    const sub = this.stompClient.subscribe(topic, (message: any) => {
      this.zone.run(() => callback(message.body));
    });
    if (!this.stompSubs.has(topic)) {
      this.stompSubs.set(topic, sub);
    }
  }

  private resubscribeAll(): void {
    console.log('[WS] resubscribing all topics, topics count:', this.topics.size);
    this.stompSubs.clear();
    this.topics.forEach((callbacks, topic) => {
      console.log('[WS] resubscribing:', topic, 'callbacks:', callbacks.length);
      callbacks.forEach(cb => this.doSubscribe(topic, cb));
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}
