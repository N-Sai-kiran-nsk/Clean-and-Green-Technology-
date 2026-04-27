import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { isObservable } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card-surface">
      <div class="section-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h2 class="h5 mb-1">Notifications</h2>
          <p class="text-secondary mb-0">Recent updates in a simple list.</p>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="loadNotifications()" [disabled]="loading">
            Refresh
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" (click)="markAllRead()" [disabled]="!unreadCount">
            Mark all read
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="py-4 text-center text-secondary">Loading notifications...</div>

      <div *ngIf="!loading && errorMessage" class="empty-state text-danger">
        {{ errorMessage }}
      </div>

      <div *ngIf="!loading && !errorMessage && !notifications.length" class="empty-state">
        You do not have any notifications.
      </div>

      <div *ngIf="!loading && !errorMessage && notifications.length" class="page-stack">
        <article
          *ngFor="let notification of notifications; trackBy: trackByNotification"
          class="border rounded-3 p-3"
          [class.bg-body-tertiary]="!isRead(notification)"
        >
          <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div class="flex-grow-1">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                <strong>{{ notificationTitle(notification) }}</strong>
                <span class="pill" *ngIf="!isRead(notification)">Unread</span>
              </div>
              <p class="mb-2 text-secondary text-break">{{ notificationMessage(notification) }}</p>
              <span class="text-muted small">{{ notificationDate(notification) }}</span>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-outline-primary align-self-start"
              (click)="markRead(notification)"
              [disabled]="isRead(notification)"
            >
              Mark read
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  notifications: any[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !this.isRead(notification)).length;
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';

    const result = this.invokeFallback(this.notificationService as any, [
      'getNotifications',
      'loadNotifications',
      'fetchNotifications',
      'listNotifications',
      'getAllNotifications',
      'getUserNotifications',
      'getNotificationList',
    ]);

    this.consumeListResult(
      result,
      (items) => {
        this.notifications = items;
        this.loading = false;
      },
      () => {
        this.notifications = [];
        this.loading = false;
        this.errorMessage = 'Unable to load notifications right now.';
      }
    );
  }

  markRead(notification: any): void {
    const notificationId = this.notificationId(notification);
    if (notificationId == null) {
      return;
    }

    const result = this.invokeFallback(this.notificationService as any, [
      'markRead',
      'markAsRead',
      'setAsRead',
      'readNotification',
      'read',
    ], notificationId);

    this.consumeMutationResult(result, () => this.loadNotifications());
  }

  markAllRead(): void {
    const result = this.invokeFallback(this.notificationService as any, [
      'markAllRead',
      'markAllAsRead',
      'setAllRead',
      'readAllNotifications',
      'readAll',
    ]);

    this.consumeMutationResult(result, () => this.loadNotifications());
  }

  isRead(notification: any): boolean {
    return Boolean(notification?.read ?? notification?.isRead ?? notification?.is_read ?? notification?.viewed ?? notification?.seen);
  }

  notificationTitle(notification: any): string {
    return this.toText(notification?.title ?? notification?.subject ?? 'Notification');
  }

  notificationMessage(notification: any): string {
    return this.toText(notification?.message ?? notification?.description ?? notification?.body ?? '');
  }

  notificationDate(notification: any): string {
    const value = notification?.createdAt ?? notification?.created_at ?? notification?.date ?? notification?.createdDate;
    if (!value) {
      return 'Unknown date';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
    }

    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  trackByNotification(index: number, notification: any): string | number {
    return this.notificationId(notification) ?? index;
  }

  private notificationId(notification: any): string | number | null {
    return notification?.id ?? notification?._id ?? notification?.notificationId ?? null;
  }

  private invokeFallback(target: any, methodNames: string[], ...args: any[]): unknown {
    for (const methodName of methodNames) {
      const method = target?.[methodName];
      if (typeof method === 'function') {
        return method.apply(target, args);
      }
    }

    return undefined;
  }

  private consumeListResult(
    result: unknown,
    onSuccess: (items: any[]) => void,
    onError: (error: unknown) => void
  ): void {
    if (Array.isArray(result)) {
      onSuccess(this.normalizeArray(result));
      return;
    }

    if (isObservable(result)) {
      result.subscribe({
        next: (value) => onSuccess(this.normalizeArray(value)),
        error: onError,
      });
      return;
    }

    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>)
        .then((value) => onSuccess(this.normalizeArray(value)))
        .catch(onError);
      return;
    }

    onError(result);
  }

  private consumeMutationResult(result: unknown, onSuccess: () => void): void {
    if (!result) {
      onSuccess();
      return;
    }

    if (isObservable(result)) {
      result.subscribe({
        next: () => onSuccess(),
        error: () => onSuccess(),
      });
      return;
    }

    if (typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).then(() => onSuccess()).catch(() => onSuccess());
      return;
    }

    onSuccess();
  }

  private normalizeArray(value: unknown): any[] {
    if (Array.isArray(value)) {
      return value;
    }

    const candidate = value as any;
    if (Array.isArray(candidate?.data)) {
      return candidate.data;
    }

    if (Array.isArray(candidate?.items)) {
      return candidate.items;
    }

    if (Array.isArray(candidate?.results)) {
      return candidate.results;
    }

    return [];
  }

  private toText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }
}