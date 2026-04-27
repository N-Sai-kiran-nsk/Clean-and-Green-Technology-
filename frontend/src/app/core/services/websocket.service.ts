import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, timer, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, switchMap, takeUntil, retry } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface WSNotification {
  type: 'notification';
  id: number;
  title: string;
  message: string;
  issue_id?: number;
  created_at: string;
}

export interface WSUnreadCount {
  type: 'unread_count';
  count: number;
}

export interface WSError {
  type: 'error';
  message: string;
}

export type WSMessage = WSNotification | WSUnreadCount | WSError;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private wsUrl = 'ws://localhost:8000/ws/notifications/';
  private socket$: WebSocketSubject<WSMessage> | null = null;
  private destroy$ = new Subject<void>();
  
  private notificationsSubject = new Subject<WSNotification>();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private connectedSubject = new BehaviorSubject<boolean>(false);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {
    this.connect();
  }

  private connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.socket$ = webSocket<WSMessage>({
      url: `${this.wsUrl}?token=${token}`,
      openObserver: {
        next: () => {
          this.connectedSubject.next(true);
          this.requestUnreadCount();
        }
      },
      closeObserver: {
        next: () => {
          this.connectedSubject.next(false);
        }
      }
    });

    this.socket$.pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('WebSocket error:', err);
        return EMPTY;
      })
    ).subscribe({
      next: (message) => this.handleMessage(message)
    });
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'notification':
        this.notificationsSubject.next(message);
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        break;
      case 'unread_count':
        this.unreadCountSubject.next(message.count);
        break;
      case 'error':
        console.error('WebSocket server error:', message.message);
        break;
    }
  }

  requestUnreadCount(): void {
    this.send({ action: 'get_unread' });
  }

  markAsRead(notificationId: number): void {
    this.send({ action: 'mark_as_read', notification_id: notificationId });
  }

  private send(data: object): void {
    if (this.socket$) {
      this.socket$.next(data as WSMessage);
    }
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}