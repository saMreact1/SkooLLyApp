import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {map, Observable, tap} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TokenService } from './token.service';
import {
  CheckEmailSchoolRequest,
  CheckEmailSchoolResponse,
  CreateSchoolRequest,
  SchoolResponse,
  CompleteRegistrationRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserRole, ApiResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenService);
  private readonly api    = environment.apiUrl;
  private readonly USER_KEY = 'sms_user';

  private readonly _currentUser = signal<UserResponse | null>(this.restoreUser());
  readonly currentUser = this._currentUser.asReadonly();

  checkEmailAndSchool(payload: CheckEmailSchoolRequest): Observable<CheckEmailSchoolResponse> {
    return this.http.post<ApiResponse<CheckEmailSchoolResponse>>(
      `${this.api}/auth/check`,
      payload
    ).pipe(map(res => res.data));
  }

  createSchool(payload: CreateSchoolRequest): Observable<SchoolResponse> {
    return this.http.post<ApiResponse<SchoolResponse>>(`${this.api}/auth/school/register`, payload)
      .pipe(map(res => res.data));
  }

  register(payload: CompleteRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.api}/auth/register`,
      payload
    ).pipe(
      map(res => res.data),
      tap(response => this.handleAuthSuccess(response))
    );
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.api}/auth/login`,
      payload
    ).pipe(
      map(res => res.data),
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout(): void {
    this.tokens.clear();
    sessionStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['']);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/auth/reset-password`, payload);
  }

  redirectToDashboard(): void {
    const roleRoutes: Record<UserRole, string> = {
      SUPER_ADMIN: '/app/dashboard',
      ADMIN:       '/app/dashboard',
      TEACHER:     '/app/dashboard',
      STUDENT:     '/app/dashboard',
      PARENT:      '/app/dashboard',
    };
    const role = this._currentUser()?.role ?? this.tokens.currentRole();
    this.router.navigate([role ? roleRoutes[role] : '/auth/login']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokens.store(response.token, response.tokenType, response.user.role);
    this.persistUser(response.user);
  }

  private persistUser(user: UserResponse): void {
    this._currentUser.set(user);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private restoreUser(): UserResponse | null {
    if (!this.tokens.isLoggedIn()) {
      sessionStorage.removeItem(this.USER_KEY);
      return null;
    }

    const raw = sessionStorage.getItem(this.USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      sessionStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  uploadFile(file: File, folder: string): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post<{ url: string }>(
      `${this.api}/files/upload`,
      formData
    );
  }
}
