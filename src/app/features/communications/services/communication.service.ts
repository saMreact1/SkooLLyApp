import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/services/token.service';
import { WebSocketService } from '../../../core/services/websocket/websocket.service';
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementNotification,
  ApiResponse,
  CommunicationFilters,
  AnnouncementTarget,
  AnnouncementPriority,
  WebSocketEvent,
} from '../models/communication.models';

@Injectable({ providedIn: 'root' })
export class CommunicationService {

  private static readonly STORAGE_KEY = 'skooly_viewed_announcements';
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly ws = inject(WebSocketService);

  private readonly api = `${environment.apiUrl}/communication`;

  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly announcements$ = new Subject<AnnouncementNotification>();
  private readonly destroy$ = new Subject<void>();

  readonly isConnected = this.connected$.asObservable();
  readonly announcements = this.announcements$.asObservable();

  private readonly _announcements = signal<Announcement[]>([]);
  readonly announcementsSignal = this._announcements.asReadonly();

  private readonly _viewedAnnouncementIds = signal<Set<number>>(
    CommunicationService.loadViewedIds()
  );

  private static loadViewedIds(): Set<number> {
    try {
      const raw = localStorage.getItem(CommunicationService.STORAGE_KEY);
      return raw ? new Set<number>(JSON.parse(raw)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }

  readonly unviewedAnnouncements = computed(() =>
    this._announcements().filter(a => !this._viewedAnnouncementIds().has(a.id))
  );

  readonly unreadCount = computed(() => this.unviewedAnnouncements().length);

  connect(): void {
    this.ws.connect();
    this.subscribeToTopics();
    this.connected$.next(true);
  }

  disconnect(): void {
    this.ws.disconnect();
    this.connected$.next(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToTopics(): void {
    const role = this.tokenService.currentRole();
    const targets: AnnouncementTarget[] = ['ALL'];

    if (role === 'STUDENT') targets.push('STUDENTS');
    else if (role === 'TEACHER') targets.push('TEACHERS', 'STAFF');
    else if (role === 'PARENT') targets.push('PARENTS');
    else if (['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
      targets.push('STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF');
    }

    targets.forEach(target => {
      this.ws.subscribe(
        `/topic/announcements.${target}`,
        (body: string) => {
          console.log('[ANN] received:', body);
          const notification: AnnouncementNotification = JSON.parse(body);
          this.handleAnnouncementNotification(notification);
        }
      );
    });
  }

  private readonly _recentlyProcessedIds = new Set<number>();

  private handleAnnouncementNotification(notification: AnnouncementNotification): void {
    if (notification.announcementId && this._recentlyProcessedIds.has(notification.announcementId)) {
      return;
    }
    if (notification.announcementId) {
      this._recentlyProcessedIds.add(notification.announcementId);
      setTimeout(() => this._recentlyProcessedIds.delete(notification.announcementId), 5000);
    }

    if (notification.type === 'ANNOUNCEMENT_CREATED' && notification.announcementId) {
      this.getAnnouncementById(notification.announcementId).subscribe({
        next: (announcement) => {
          this._announcements.update(list => {
            if (list.some(a => a.id === announcement.id)) return list;
            return [announcement, ...list];
          });
        },
      });
    } else if (notification.type === 'ANNOUNCEMENT_DELETED' && notification.announcementId) {
      this._announcements.update(list => list.filter(a => a.id !== notification.announcementId));
    }
    this.announcements$.next(notification);
  }

  getAllAnnouncements(filters?: CommunicationFilters): Observable<Announcement[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http
      .get<ApiResponse<Announcement[]>>(`${this.api}/announcements`, { params })
      .pipe(map(r => r.data));
  }

  getVisibleAnnouncements(target: AnnouncementTarget): Observable<Announcement[]> {
    const params = new HttpParams().set('target', target);
    return this.http
      .get<ApiResponse<Announcement[]>>(`${this.api}/announcements/visible`, { params })
      .pipe(map(r => r.data));
  }

  getAnnouncementById(id: number): Observable<Announcement> {
    return this.http
      .get<ApiResponse<Announcement>>(`${this.api}/announcements/${id}`)
      .pipe(map(r => r.data));
  }

  getAnnouncementsByTarget(target: AnnouncementTarget): Observable<Announcement[]> {
    return this.http
      .get<ApiResponse<Announcement[]>>(`${this.api}/announcements/target/${target}`)
      .pipe(map(r => r.data));
  }

  createAnnouncement(request: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http
      .post<ApiResponse<Announcement>>(`${this.api}/announcements`, request)
      .pipe(map(r => r.data));
  }

  updateAnnouncement(id: number, request: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http
      .put<ApiResponse<Announcement>>(`${this.api}/announcements/${id}`, request)
      .pipe(map(r => r.data));
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.api}/announcements/${id}`)
      .pipe(map(() => void 0));
  }

  getPublishedCount(): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.api}/announcements/published/count`)
      .pipe(map(r => r.data));
  }

  loadAnnouncements(target?: AnnouncementTarget): void {
    const obs = target
      ? this.getVisibleAnnouncements(target)
      : this.getAllAnnouncements();

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => this._announcements.set(list),
      error: (err) => console.error('Failed to load announcements:', err),
    });
  }

  markAllAnnouncementsViewed(): void {
    const merged = new Set(this._viewedAnnouncementIds());
    this._announcements().forEach(a => merged.add(a.id));
    this._viewedAnnouncementIds.set(merged);
    localStorage.setItem(
      CommunicationService.STORAGE_KEY,
      JSON.stringify([...merged])
    );
  }
}