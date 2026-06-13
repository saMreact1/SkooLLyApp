// src/app/core/auth/services/token.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { JwtPayload, UserRole } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenService {

  private readonly TOKEN_KEY = 'sms_token';
  private readonly TOKEN_TYPE_KEY = 'sms_token_type';
  private readonly ROLE_KEY = 'sms_user_role';

  private readonly _token = signal<string | null>(
    sessionStorage.getItem(this.TOKEN_KEY)
  );
  private readonly _tokenType = signal<string>(
    sessionStorage.getItem(this.TOKEN_TYPE_KEY) ?? 'Bearer'
  );
  private readonly _role = signal<UserRole | null>(
    sessionStorage.getItem(this.ROLE_KEY) as UserRole | null
  );

  readonly token       = this._token.asReadonly();
  readonly tokenType = this._tokenType.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._token() && !this.isTokenExpired());
  readonly currentRole = computed<UserRole | null>(
    () => this.decodePayload()?.role ?? this._role()
  );
  readonly currentUserId = computed<string | null>(() => this.decodePayload()?.sub ?? null);
  readonly schoolId = computed<number | null>(() => this.decodePayload()?.schoolId ?? null);

  store(token: string, tokenType: string = 'Bearer', role?: UserRole | null): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.TOKEN_TYPE_KEY, tokenType);
    this._token.set(token);
    this._tokenType.set(tokenType);

    if (role) {
      sessionStorage.setItem(this.ROLE_KEY, role);
      this._role.set(role);
    }
  }

  clear(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_TYPE_KEY);
    sessionStorage.removeItem(this.ROLE_KEY);
    this._token.set(null);
    this._tokenType.set('Bearer');
    this._role.set(null);
  }

  decodePayload(): JwtPayload | null {
    const token = this._token();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1];
      const json   = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      this.clear();
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.decodePayload();
    if (!payload) return true;
    return payload.exp * 1000 < Date.now();
  }
}
