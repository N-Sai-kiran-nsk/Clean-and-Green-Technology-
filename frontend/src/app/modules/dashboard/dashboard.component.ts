import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isObservable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxApexchartsModule } from 'ngx-apexcharts';
import { IssueService } from '../../core/services/issue.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService, WSNotification } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxApexchartsModule],
  template: `
    <div class="dashboard-desktop">
      <!-- Hero Banner -->
      <header class="desktop-hero pt-5 pb-5 px-4 mb-4 rounded-bottom-4 shadow-sm" style="background: linear-gradient(135deg, #6366f1, #4f46e5); margin-top: -1.5rem;">
        <div class="container-xl">
          <div class="d-flex justify-content-between align-items-center">
            <div class="user-greeting text-white">
              <h1 class="display-6 fw-bold mb-2">Welcome back, {{ userName }}! 👋</h1>
              <p class="mb-0 fs-5 opacity-75"><i class="bi bi-geo-alt me-2"></i>{{ locationText }}</p>
            </div>
            <div class="d-flex gap-3 align-items-center">
              <div class="position-relative text-white bg-white bg-opacity-25 rounded-circle p-3 shadow-sm" style="cursor: pointer;" (click)="scrollToNotifications()">
                <i class="bi bi-bell fs-4"></i>
                <span *ngIf="unreadNotifications" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow border border-2 border-white" style="font-size: 0.75rem;">
                  {{ unreadNotifications }}
                </span>
              </div>
              <button type="button" class="btn btn-light rounded-pill px-4 py-2 shadow-sm fw-medium d-flex align-items-center gap-2" (click)="toggleTheme()">
                <i class="bi" [ngClass]="darkTheme ? 'bi-sun-fill text-warning' : 'bi-moon-fill text-primary'"></i>
                {{ darkTheme ? 'Light Mode' : 'Dark Mode' }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="container-xl" style="margin-top: -4rem; position: relative; z-index: 10;">
        <!-- Action Cards Grid -->
        <div class="row g-4 mb-5">
          <div class="col-12 col-md-6 col-xl-3">
            <a routerLink="/issues/report" class="card h-100 border-0 shadow-sm text-decoration-none action-card rounded-4">
              <div class="card-body p-4 d-flex flex-column">
                <div class="icon-box rounded-3 mb-3 d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 56px; height: 56px; background-color: #e0e7ff; color: #6366f1;">
                  <i class="bi bi-camera fs-3"></i>
                </div>
                <h5 class="card-title text-dark fw-bold">Report Issue</h5>
                <p class="card-text text-muted mb-0">Quickly raise civic problems in your area.</p>
              </div>
            </a>
          </div>
          <div class="col-12 col-md-6 col-xl-3">
            <a routerLink="/issues" class="card h-100 border-0 shadow-sm text-decoration-none action-card rounded-4">
              <div class="card-body p-4 d-flex flex-column">
                <div class="icon-box rounded-3 mb-3 d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 56px; height: 56px; background-color: #ccfbf1; color: #0d9488;">
                  <i class="bi bi-geo-alt-fill fs-3"></i>
                </div>
                <h5 class="card-title text-dark fw-bold">Issues near me</h5>
                <p class="card-text text-muted mb-0">Check out localized problems reported by others.</p>
              </div>
            </a>
          </div>
          <div class="col-12 col-md-6 col-xl-3">
            <a routerLink="/issues" class="card h-100 border-0 shadow-sm text-decoration-none action-card rounded-4">
              <div class="card-body p-4 d-flex flex-column">
                <div class="icon-box rounded-3 mb-3 d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 56px; height: 56px; background-color: #fef3c7; color: #d97706;">
                  <i class="bi bi-file-earmark-text-fill fs-3"></i>
                </div>
                <h5 class="card-title text-dark fw-bold">My Complaints</h5>
                <p class="card-text text-muted mb-0">Track the progress of your submitted reports.</p>
              </div>
            </a>
          </div>
          <div class="col-12 col-md-6 col-xl-3">
            <a routerLink="/issues" [queryParams]="{ priority: 'critical' }" class="card h-100 border-0 shadow-sm text-decoration-none action-card rounded-4">
              <div class="card-body p-4 d-flex flex-column">
                <div class="icon-box rounded-3 mb-3 d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 56px; height: 56px; background-color: #fee2e2; color: #dc2626;">
                  <i class="bi bi-exclamation-triangle-fill fs-3"></i>
                </div>
                <h5 class="card-title text-dark fw-bold">Critical Issues</h5>
                <p class="card-text text-muted mb-0">View the latest and most risky reported problems.</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Two Column Layout: Recent Issues and Notifications -->
        <div class="row g-4 pb-5">
          <!-- Recent Issues (Left) -->
          <div class="col-12 col-lg-7">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="mb-0 fw-bold">Recent Issues</h4>
              <a routerLink="/issues" class="btn btn-outline-primary rounded-pill fw-medium px-4">View All</a>
            </div>

            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-0">
                <div *ngIf="loadingIssues" class="p-5 text-center text-secondary">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <div *ngIf="!loadingIssues && !recentIssues.length" class="empty-state p-5 text-center text-muted">
                  <i class="bi bi-clipboard-x fs-1 d-block mb-3 opacity-50"></i>
                  No issues reported recently.
                </div>
                
                <div class="list-group list-group-flush rounded-4">
                  <article
                    *ngFor="let issue of recentIssues; trackBy: trackByIssue"
                    class="list-group-item p-4 border-bottom-0 border-top issue-list-item"
                  >
                    <div class="d-flex gap-4 align-items-center">
                      <div class="issue-img-placeholder bg-light rounded-4 d-flex align-items-center justify-content-center text-muted shadow-sm" style="width: 80px; height: 80px; flex-shrink: 0;">
                        <i class="bi bi-image fs-2 opacity-50"></i>
                      </div>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <h5 class="mb-0 text-dark fw-bold text-truncate pe-3">{{ issueTitle(issue) }}</h5>
                          <span class="badge fw-medium px-3 py-2 rounded-pill" [ngClass]="{
                            'bg-warning text-dark': statusLabel(issue).toLowerCase() === 'open',
                            'bg-info': statusLabel(issue).toLowerCase() === 'in progress',
                            'bg-success': statusLabel(issue).toLowerCase() === 'resolved',
                            'bg-secondary': statusLabel(issue).toLowerCase() === 'closed'
                          }">{{ statusLabel(issue) }}</span>
                        </div>
                        <p class="text-muted mb-2 text-truncate">{{ issueDescription(issue) }}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                          <span class="small text-muted fw-medium"><i class="bi bi-clock me-1"></i> {{ displayDate(issue) }}</span>
                          <a [routerLink]="['/issues/detail', issueId(issue)]" class="btn btn-link text-decoration-none fw-semibold p-0 text-primary">View Details <i class="bi bi-arrow-right ms-1"></i></a>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <!-- Notifications (Right) -->
          <div class="col-12 col-lg-5" id="notifications-section">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="mb-0 fw-bold">Notifications</h4>
              <button class="btn btn-link text-decoration-none text-muted fw-medium px-0" (click)="markAllRead()" [disabled]="!unreadNotifications">
                Mark all read
              </button>
            </div>

            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-0">
                <div *ngIf="loadingNotifications" class="p-5 text-center text-secondary">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <div *ngIf="!loadingNotifications && notificationsError" class="p-5 text-center text-danger">
                  {{ notificationsError }}
                </div>
                <div *ngIf="!loadingNotifications && !notificationsError && !recentNotifications.length" class="empty-state p-5 text-center text-muted">
                  <i class="bi bi-bell-slash fs-1 d-block mb-3 opacity-50"></i>
                  You're all caught up!
                </div>

                <div class="list-group list-group-flush rounded-4">
                  <div
                    *ngFor="let notification of recentNotifications; trackBy: trackByNotification"
                    class="list-group-item p-4 border-bottom-0 border-top notification-item"
                    [class.bg-light]="!isNotificationRead(notification)"
                  >
                    <div class="d-flex justify-content-between gap-3">
                      <div class="flex-grow-1">
                        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                          <strong class="mb-0 text-dark">{{ notificationTitle(notification) }}</strong>
                          <span class="badge bg-danger rounded-pill" *ngIf="!isNotificationRead(notification)">New</span>
                        </div>
                        <p class="text-secondary mb-2">{{ notificationMessage(notification) }}</p>
                        <span class="text-muted small fw-medium"><i class="bi bi-calendar me-1"></i> {{ displayNotificationDate(notification) }}</span>
                      </div>

                      <button
                        *ngIf="!isNotificationRead(notification)"
                        type="button"
                        class="btn btn-sm btn-light rounded-circle shadow-sm align-self-start p-2 d-flex justify-content-center align-items-center"
                        style="width: 32px; height: 32px;"
                        (click)="markRead(notification)"
                        title="Mark as read"
                      >
                        <i class="bi bi-check2 text-primary"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Charts Section -->
      <div class="row g-4 pb-5">
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-4">
              <h4 class="mb-4 fw-bold">Issues by Status</h4>
              <div id="statusChart"></div>
              <apx-chart
                [series]="statusChartOptions.series"
                [chart]="statusChartOptions.chart"
                [labels]="statusChartOptions.labels"
                [colors]="statusChartOptions.colors"
                [legend]="statusChartOptions.legend"
                [plotOptions]="statusChartOptions.plotOptions">
              </apx-chart>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-4">
              <h4 class="mb-4 fw-bold">Issues by Priority</h4>
              <apx-chart
                [series]="priorityChartOptions.series"
                [chart]="priorityChartOptions.chart"
                [xaxis]="priorityChartOptions.xaxis"
                [colors]="priorityChartOptions.colors"
                [plotOptions]="priorityChartOptions.plotOptions">
              </apx-chart>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-desktop {
      min-height: 100vh;
      background-color: #f8fafc;
    }
    .desktop-hero {
      position: relative;
    }
    .desktop-hero::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6rem;
      background: linear-gradient(to top, rgba(248, 250, 252, 0.4), transparent);
      pointer-events: none;
    }
    .action-card {
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .action-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }
    .issue-list-item:hover, .notification-item:hover {
      background-color: rgba(248, 250, 252, 0.8);
    }
    .list-group-item:first-child {
      border-top: none !important;
    }
    body.dark-theme .dashboard-desktop {
      background-color: var(--app-bg);
    }
    body.dark-theme .action-card, body.dark-theme .card, body.dark-theme .list-group-item {
      background-color: var(--app-surface);
      border-color: var(--app-border) !important;
    }
    body.dark-theme .list-group-item.bg-light {
      background-color: var(--app-surface-alt) !important;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly issueService = inject(IssueService);
  private readonly notificationService = inject(NotificationService);
  private readonly wsService = inject(WebSocketService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  userName = 'Citizen';
  locationText = 'Locating...';
  issues: any[] = [];
  notifications: any[] = [];
  loadingIssues = false;
  loadingNotifications = false;
  issuesError = '';
  notificationsError = '';
  darkTheme = false;
  realtimeNotificationCount = 0;

  statusChartOptions: any = {
    series: [0, 0, 0, 0],
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    colors: ['#ffc107', '#0dcaf0', '#198754', '#6c757d'],
    chart: { type: 'donut', height: 250, sparkline: { enabled: false } },
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { size: '65%' } } }
  };

  priorityChartOptions: any = {
    series: [{ name: 'Issues', data: [0, 0, 0, 0] }],
    chart: { type: 'bar', height: 250, toolbar: { show: false } },
    xaxis: { categories: ['Low', 'Medium', 'High', 'Critical'] },
    colors: ['#6c757d', '#ffc107', '#fd7e14', '#dc3545'],
    plotOptions: { bar: { columnWidth: '50%', borderRadius: 4 } }
  };

  ngOnInit(): void {
    this.checkTheme();
    this.loadUserAndLocation();
    this.loadIssues();
    this.loadNotifications();
    this.subscribeToWebSocket();
  }

  private loadUserAndLocation(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.first_name || user.username || 'Citizen';
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locationText = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
        },
        (error) => {
          this.locationText = 'Location unavailable';
        }
      );
    } else {
      this.locationText = 'Location not supported';
    }
  }

  private subscribeToWebSocket(): void {
    this.wsService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: WSNotification) => {
        this.notifications.unshift({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          related_issue: notification.issue_id,
          created_at: notification.created_at,
          is_read: false
        });
      });

    this.wsService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.realtimeNotificationCount = count;
      });
  }

  get totalIssues(): number {
    return this.issues.length;
  }

  get openIssues(): number {
    return this.issues.filter((issue) => this.normalizeStatus(issue) === 'open').length;
  }

  get inProgressIssues(): number {
    return this.issues.filter((issue) => this.normalizeStatus(issue) === 'in progress').length;
  }

  get resolvedIssues(): number {
    return this.issues.filter((issue) => this.normalizeStatus(issue) === 'resolved').length;
  }

  get unreadNotifications(): number {
    const apiCount = this.notifications.filter((notification) => !this.isNotificationRead(notification)).length;
    return Math.max(apiCount, this.realtimeNotificationCount);
  }

  get recentIssues(): any[] {
    return [...this.issues]
      .sort((left, right) => this.sortByDate(right) - this.sortByDate(left))
      .slice(0, 5);
  }

  get recentNotifications(): any[] {
    return [...this.notifications]
      .sort((left, right) => this.sortByDate(right) - this.sortByDate(left))
      .slice(0, 5);
  }

  get closedIssues(): number {
    return this.issues.filter((issue) => this.normalizeStatus(issue) === 'closed').length;
  }

  priorityCount(level: string): number {
    const counts = this.priorityCounts;
    return counts[level as keyof typeof counts] || 0;
  }

  getBarHeight(level: string): number {
    const counts = this.priorityCounts;
    const max = Math.max(counts.low, counts.medium, counts.high, counts.critical, 1);
    const maxHeight = 100;
    return Math.max(4, (counts[level as keyof typeof counts] / max) * maxHeight);
  }

  getDonutSegment(status: string): string {
    const total = Math.max(this.totalIssues, 1);
    const circumference = 2 * Math.PI * 40;
    let count = 0;
    switch(status) {
      case 'open': count = this.openIssues; break;
      case 'in_progress': count = this.inProgressIssues; break;
      case 'resolved': count = this.resolvedIssues; break;
      case 'closed': count = this.closedIssues; break;
    }
    const percent = total > 0 ? (count / total) : 0;
    const dashArray = percent * circumference;
    return `${dashArray} ${circumference}`;
  }

  priorityCounts: { low: number; medium: number; high: number; critical: number } = { low: 0, medium: 0, high: 0, critical: 0 };

  loadIssues(): void {
    this.loadingIssues = true;
    this.issuesError = '';

    const result = this.invokeFallback(this.issueService as any, [
      'getIssues',
      'loadIssues',
      'fetchIssues',
      'getAllIssues',
      'listIssues',
      'getIssueList',
      'getAll',
      'getCitizenIssues',
    ]);

    this.consumeListResult(
      result,
      (items) => {
        this.issues = items;
        this.loadingIssues = false;
        this.updateChartData();
      },
      () => {
        this.issues = [];
        this.loadingIssues = false;
        this.issuesError = 'Unable to load issues at the moment.';
      }
    );
  }

  private updateChartData(): void {
    if (!this.issues.length) return;
    
    const open = this.issues.filter(i => (i?.status ?? 'open').toLowerCase() === 'open').length;
    const inProgress = this.issues.filter(i => (i?.status ?? '').toLowerCase() === 'in progress').length;
    const resolved = this.issues.filter(i => (i?.status ?? '').toLowerCase() === 'resolved').length;
    const closed = this.issues.filter(i => (i?.status ?? '').toLowerCase() === 'closed').length;

    const low = this.issues.filter(i => (i?.priority ?? 'medium').toLowerCase() === 'low').length;
    const medium = this.issues.filter(i => (i?.priority ?? 'medium').toLowerCase() === 'medium').length;
    const high = this.issues.filter(i => (i?.priority ?? 'medium').toLowerCase() === 'high').length;
    const critical = this.issues.filter(i => (i?.priority ?? 'medium').toLowerCase() === 'critical').length;

    this.statusChartOptions = {
      ...this.statusChartOptions,
      series: [open, inProgress, resolved, closed]
    };

    this.priorityChartOptions = {
      ...this.priorityChartOptions,
      series: [{ name: 'Issues', data: [low, medium, high, critical] }]
    };
  }

  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationsError = '';

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
        this.loadingNotifications = false;
      },
      () => {
        this.notifications = [];
        this.loadingNotifications = false;
        this.notificationsError = 'Unable to load notifications at the moment.';
      }
    );
  }

  markRead(notification: any): void {
    const notificationId = this.itemId(notification);
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

  checkTheme(): void {
    this.darkTheme = document.body.classList.contains('dark-theme');
  }

  toggleTheme(): void {
    this.darkTheme = !this.darkTheme;
    document.body.classList.toggle('dark-theme', this.darkTheme);
    localStorage.setItem('theme', this.darkTheme ? 'dark' : 'light');
  }

  scrollToNotifications(): void {
    const el = document.getElementById('notifications-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPieGradient(): string {
    const total = Math.max(this.totalIssues, 1);
    const resolved = (this.resolvedIssues / total) * 100;
    const inProgress = (this.inProgressIssues / total) * 100;
    const open = Math.max(0, 100 - resolved - inProgress);

    return `conic-gradient(#198754 0 ${resolved}%, #ffc107 ${resolved}% ${resolved + inProgress}%, #dc3545 ${resolved + inProgress}% ${resolved + inProgress + open}%)`;
  }

  issueId(issue: any): string | number | null {
    return this.itemId(issue);
  }

  issueTitle(issue: any): string {
    return this.toText(issue?.title ?? issue?.subject ?? issue?.name ?? issue?.issueTitle ?? 'Untitled issue');
  }

  issueDescription(issue: any): string {
    return this.toText(issue?.description ?? issue?.summary ?? issue?.details ?? 'No description provided.');
  }

  statusLabel(issue: any): string {
    return this.capitalize(this.normalizeStatus(issue) || 'open');
  }

  departmentLabel(issue: any): string {
    const department = issue?.department;

    if (department && typeof department === 'object') {
      return this.toText(department?.name ?? department?.departmentName ?? department?.title ?? 'General');
    }

    return this.toText(issue?.departmentName ?? department ?? 'General');
  }

  displayDate(issue: any): string {
    return this.formatDate(issue?.createdAt ?? issue?.createdDate ?? issue?.date ?? issue?.submittedAt);
  }

  notificationTitle(notification: any): string {
    return this.toText(notification?.title ?? notification?.subject ?? 'Notification');
  }

  notificationMessage(notification: any): string {
    return this.toText(notification?.message ?? notification?.description ?? notification?.body ?? '');
  }

  displayNotificationDate(notification: any): string {
    return this.formatDate(notification?.createdAt ?? notification?.created_at ?? notification?.date ?? notification?.createdDate);
  }

  isNotificationRead(notification: any): boolean {
    return Boolean(notification?.read ?? notification?.isRead ?? notification?.is_read ?? notification?.viewed ?? notification?.seen);
  }

  trackByIssue = (index: number, issue: any): string | number => {
    return this.itemId(issue) ?? index;
  };

  trackByNotification = (index: number, notification: any): string | number => {
    return this.itemId(notification) ?? index;
  };

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
      (result as Promise<unknown>).finally(onSuccess);
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

  private itemId(item: any): string | number | null {
    return item?.id ?? item?._id ?? item?.notificationId ?? item?.issueId ?? null;
  }

  private normalizeStatus(issue: any): string {
    return this.toText(issue?.status ?? issue?.issueStatus ?? issue?.state ?? issue?.currentStatus)
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sortByDate(item: any): number {
    const raw = item?.createdAt ?? item?.createdDate ?? item?.date ?? item?.submittedAt ?? item?.updatedAt;
    const parsed = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatDate(value: unknown): string {
    if (!value) {
      return 'Unknown date';
    }

    const parsed = new Date(value as string | number | Date);
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

  private toText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}