import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

const TOKEN_KEY = 'fs_token';
const USER_KEY = 'fs_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private base = environment.apiUrl;

  private _token = signal<string | null>(this.loadToken());
  private _user = signal<User | null>(this.loadUser());

  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser = computed(() => this._user());
  readonly token = computed(() => this._token());

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/auth/login`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.storeSession(data))
      );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/auth/register`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.storeSession(data))
      );
  }

  me(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.base}/auth/me`)
      .pipe(map((res) => res.data));
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private storeSession(data: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    this._token.set(data.token);
    this._user.set(data.user);
  }

  private loadToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
