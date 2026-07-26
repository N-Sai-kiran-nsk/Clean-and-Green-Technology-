import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_picture?: string | null;
  is_department_staff?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
}

import { environment } from '../../../environments/environment';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get apiUrl() { return `${environment.apiUrl}/auth`; }
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredAccessToken());
  private userSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  public token$ = this.tokenSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) { }

  register(email: string, password: string, username?: string, firstName?: string, lastName?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/`, {
      email,
      password,
      username: username || email,
      first_name: firstName,
      last_name: lastName
    }).pipe(
      tap(response => this.persistAuth(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, {
      email,
      password
    }).pipe(
      tap(response => this.persistAuth(response))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('user_data');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  setToken(token: string): void {
    localStorage.setItem('auth_access_token', token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem('auth_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('auth_refresh_token');
  }

  private persistAuth(response: AuthResponse): void {
    this.setToken(response.access);
    localStorage.setItem('auth_refresh_token', response.refresh);
    this.storeUser(response.user);
  }

  private getStoredAccessToken(): string | null {
    return localStorage.getItem('auth_access_token');
  }

  private getStoredUser(): UserProfile | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  private storeUser(user: UserProfile): void {
    localStorage.setItem('user_data', JSON.stringify(user));
    this.userSubject.next(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.userSubject.value || this.getStoredUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && !!(user.is_staff || user.is_superuser || user.is_department_staff);
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && !!user.is_superuser;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/`).pipe(
      tap(user => this.storeUser(user))
    );
  }

  updateProfile(data: any): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile/update/`, data).pipe(
      tap(user => this.storeUser(user))
    );
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  setUserAdmin(userId: number, data: { is_admin?: boolean; is_staff?: boolean; is_superuser?: boolean; is_department_staff?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/set_admin/`, data);
  }

  removeUserAdmin(userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/remove_admin/`, {});
  }

  getStaffList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/staff_list/`);
  }

  deleteUser(userId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}/`);
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/request-password-reset/`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password/`, data);
  }
}
