import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  related_issue?: number;
  is_read: boolean;
  created_at: string;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private get apiUrl() { return `${environment.apiUrl}/notifications`; }

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/`);
  }

  getUnreadNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread/`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/mark_as_read/`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mark_all_as_read/`, {});
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread/`);
  }
}