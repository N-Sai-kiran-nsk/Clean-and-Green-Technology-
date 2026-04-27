import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IssueService } from '../../../core/services/issue.service';

interface IssueRecord {
  [key: string]: any;
  id?: number | string;
  _id?: number | string;
  issue_id?: number | string;
  title?: string;
  subject?: string;
  summary?: string;
  description?: string;
  details?: string;
  status?: string;
  category?: string;
  priority?: string;
  location?: string;
  createdAt?: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
  reporter?: any;
  reportedBy?: any;
  reported_by?: any;
  user?: any;
}

@Component({
  selector: 'app-manage-issues',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screen manage-issues-screen">
      <header class="dashboard-header">
        <div class="dashboard-header__copy">
          <span class="pill">Admin · Issues</span>
          <h1 class="page-title">Manage issues</h1>
          <p class="page-subtitle">
            Review civic reports, update their status, and keep the queue moving for your city.
          </p>
        </div>

        <div class="dashboard-header__meta">
          <span class="pill">{{ issues.length }} issue{{ issues.length === 1 ? '' : 's' }}</span>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            (click)="loadIssues()"
            [disabled]="isBusy"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </header>

      <div class="page-stack">
        @if (successMessage) {
          <div class="page-stack__row">
            <div class="alert alert-success flex-grow-1 mb-0" role="status">
              {{ successMessage }}
            </div>
          </div>
        }

        @if (errorMessage) {
          <div class="page-stack__row">
            <div class="alert alert-danger flex-grow-1 mb-0" role="alert">
              {{ errorMessage }}
            </div>
          </div>
        }

        <section class="card-surface issue-panel">
          <div class="section-header">
            <div>
              <h2 class="h5 mb-1">Issue queue</h2>
              <p class="text-body-secondary mb-0">
                Keep tabs on the latest civic reports and move them through the review flow.
              </p>
            </div>

            <span class="pill">{{ issues.length }} total</span>
          </div>

          @if (loading) {
            <div class="empty-state">
              <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
              <h3 class="h5 mb-2">Loading issues</h3>
              <p class="text-body-secondary mb-0">Fetching the latest reports from the server.</p>
            </div>
          } @else if (!issues.length) {
            <div class="empty-state">
              <i class="bi bi-inbox fs-1 text-body-secondary"></i>
              <h3 class="h5 mb-2">No issues found</h3>
              <p class="text-body-secondary mb-0">
                There are currently no reported issues waiting for admin review.
              </p>
            </div>
          } @else {
            <div class="issue-list" role="list">
              @for (issue of issues; track getIssueTrack(issue)) {
                <article class="issue-card" role="listitem">
                  <div class="issue-card__header">
                    <div class="issue-card__content">
                      <div class="issue-card__chips">
                        <span class="badge rounded-pill issue-status" [ngClass]="getStatusBadge(issue)">
                          {{ getStatusLabel(issue) }}
                        </span>

                        @if (getIssueCategory(issue)) {
                          <span class="pill">{{ getIssueCategory(issue) }}</span>
                        }

                        @if (getIssuePriority(issue)) {
                          <span class="pill">{{ getIssuePriority(issue) }}</span>
                        }
                      </div>

                      <h3 class="issue-card__title">
                        {{ getIssueTitle(issue) }}
                      </h3>

                      <p class="issue-card__description">
                        {{ getIssueDescription(issue) }}
                      </p>

                      <div class="issue-card__meta">
                        @if (getIssueLocation(issue)) {
                          <span class="issue-card__meta-item">
                            <i class="bi bi-geo-alt me-1"></i>
                            {{ getIssueLocation(issue) }}
                          </span>
                        }

                        @if (getIssueReporter(issue)) {
                          <span class="issue-card__meta-item">
                            <i class="bi bi-person me-1"></i>
                            {{ getIssueReporter(issue) }}
                          </span>
                        }

                        @if (getIssueDate(issue)) {
                          <span class="issue-card__meta-item">
                            <i class="bi bi-calendar3 me-1"></i>
                            {{ getIssueDate(issue) | date: 'mediumDate' }}
                          </span>
                        }
                      </div>
                    </div>

                    <div class="issue-card__actions">
                      @if (canSetInProgress(issue)) {
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          (click)="setAsInProgress(issue)"
                          [disabled]="isBusy"
                        >
                          <i class="bi bi-arrow-right-circle me-1"></i>
                          Start review
                        </button>
                      }

                      @if (canSetResolved(issue)) {
                        <button
                          type="button"
                          class="btn btn-outline-success btn-sm"
                          (click)="setAsResolved(issue)"
                          [disabled]="isBusy"
                        >
                          <i class="bi bi-check2-circle me-1"></i>
                          Resolve
                        </button>
                      }

                      @if (canReject(issue)) {
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm"
                          (click)="rejectIssue(issue)"
                          [disabled]="isBusy"
                        >
                          <i class="bi bi-x-circle me-1"></i>
                          Reject
                        </button>
                      }

                      @if (canReopen(issue)) {
                        <button
                          type="button"
                          class="btn btn-outline-secondary btn-sm"
                          (click)="setAsOpen(issue)"
                          [disabled]="isBusy"
                        >
                          <i class="bi bi-arrow-counterclockwise me-1"></i>
                          Reopen
                        </button>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .manage-issues-screen {
        min-height: 100%;
      }

      .dashboard-header {
        gap: 1rem;
      }

      .dashboard-header__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .issue-panel {
        padding: 1.25rem;
      }

      .issue-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .issue-card {
        border: 1px solid rgba(var(--bs-border-color-rgb), 0.8);
        border-radius: 1rem;
        background: var(--bs-body-bg);
        padding: 1rem;
      }

      .issue-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .issue-card__content {
        min-width: 0;
        flex: 1 1 auto;
      }

      .issue-card__chips,
      .issue-card__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 0.75rem;
      }

      .issue-card__chips {
        margin-bottom: 0.75rem;
      }

      .issue-card__title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        line-height: 1.35;
        color: var(--bs-body-color);
        overflow-wrap: anywhere;
      }

      .issue-card__description {
        margin: 0.5rem 0 0;
        color: var(--bs-secondary-color);
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .issue-card__meta {
        margin-top: 0.85rem;
      }

      .issue-card__meta-item {
        color: var(--bs-secondary-color);
        font-size: 0.875rem;
      }

      .issue-card__actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
        max-width: 18rem;
      }

      .issue-status {
        white-space: nowrap;
      }

      .empty-state {
        min-height: 18rem;
      }

      @media (max-width: 767.98px) {
        .issue-panel {
          padding: 1rem;
        }

        .issue-card__header {
          flex-direction: column;
        }

        .issue-card__actions {
          width: 100%;
          justify-content: flex-start;
          max-width: none;
        }

        .dashboard-header__meta {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class ManageIssuesComponent implements OnInit {
  issues: IssueRecord[] = [];
  loading = false;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly issueService: IssueService) {}

  ngOnInit(): void {
    this.loadIssues();
  }

  get isBusy(): boolean {
    return this.loading || this.actionLoading;
  }

  loadIssues(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const service: any = this.issueService;
    const loader =
      service.getIssues ??
      service.getAllIssues ??
      service.listIssues ??
      service.fetchIssues ??
      service.getAdminIssues ??
      service.getReportedIssues ??
      service.getAll;

    if (typeof loader !== 'function') {
      this.issues = [];
      this.loading = false;
      this.errorMessage = 'Unable to load issues right now.';
      return;
    }

    try {
      const result = loader.apply(service, []);

      this.subscribeLike(
        result,
        (payload: any) => {
          this.issues = this.normalizeIssues(payload);
          this.loading = false;
        },
        (message: string) => {
          this.issues = [];
          this.loading = false;
          this.errorMessage = message;
        }
      );
    } catch {
      this.issues = [];
      this.loading = false;
      this.errorMessage = 'Unable to load issues right now.';
    }
  }

  setAsResolved(issue: IssueRecord): void {
    this.updateIssueStatus(issue, 'resolved');
  }

  setAsInProgress(issue: IssueRecord): void {
    this.updateIssueStatus(issue, 'in_progress');
  }

  setAsOpen(issue: IssueRecord): void {
    this.updateIssueStatus(issue, 'open');
  }

  rejectIssue(issue: IssueRecord): void {
    this.updateIssueStatus(issue, 'rejected');
  }

  resolveIssue(issue: IssueRecord): void {
    this.setAsResolved(issue);
  }

  markAsResolved(issue: IssueRecord): void {
    this.setAsResolved(issue);
  }

  markAsInProgress(issue: IssueRecord): void {
    this.setAsInProgress(issue);
  }

  reopenIssue(issue: IssueRecord): void {
    this.setAsOpen(issue);
  }

  getStatusBadge(issue: IssueRecord): string {
    const status = this.normalizeStatus(issue);
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-success';
      case 'rejected':
      case 'archived':
        return 'bg-danger';
      case 'in_progress':
      case 'in progress':
      case 'review':
        return 'bg-primary';
      case 'pending':
      case 'open':
      default:
        return 'bg-warning text-dark';
    }
  }

  getStatusLabel(issue: IssueRecord): string {
    const status = this.normalizeStatus(issue);

    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      case 'rejected':
        return 'Rejected';
      case 'archived':
        return 'Archived';
      case 'in_progress':
      case 'in progress':
        return 'In progress';
      case 'review':
        return 'In review';
      case 'open':
        return 'Open';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  canSetInProgress(issue: IssueRecord): boolean {
    const status = this.normalizeStatus(issue);
    return !['in_progress', 'in progress', 'resolved', 'closed', 'rejected', 'archived', 'review'].includes(status);
  }

  canSetResolved(issue: IssueRecord): boolean {
    const status = this.normalizeStatus(issue);
    return !['resolved', 'closed', 'rejected', 'archived'].includes(status);
  }

  canReject(issue: IssueRecord): boolean {
    const status = this.normalizeStatus(issue);
    return !['rejected', 'archived', 'resolved', 'closed'].includes(status);
  }

  canReopen(issue: IssueRecord): boolean {
    const status = this.normalizeStatus(issue);
    return ['resolved', 'closed', 'rejected', 'archived'].includes(status);
  }

  getIssueTrack(issue: IssueRecord): string | number {
    return this.getIssueId(issue) ?? this.getIssueTitle(issue);
  }

  getIssueTitle(issue: IssueRecord): string {
    return issue?.title ?? issue?.subject ?? issue?.summary ?? issue?.['name'] ?? 'Untitled issue';
  }

  getIssueDescription(issue: IssueRecord): string {
    return (
      issue?.description ??
      issue?.details ??
      issue?.['body'] ??
      issue?.['message'] ??
      'No description provided.'
    );
  }

  getIssueCategory(issue: IssueRecord): string {
    return issue?.category ?? issue?.['type'] ?? issue?.['department'] ?? '';
  }

  getIssuePriority(issue: IssueRecord): string {
    return issue?.priority ?? issue?.['urgency'] ?? issue?.['severity'] ?? '';
  }

  getIssueLocation(issue: IssueRecord): string {
    return issue?.location ?? issue?.['address'] ?? issue?.['ward'] ?? issue?.['area'] ?? '';
  }

  getIssueReporter(issue: IssueRecord): string {
    return (
      issue?.reported_by?.username ??
      issue?.reportedBy?.username ??
      issue?.reporter?.username ??
      issue?.user?.username ??
      issue?.reported_by?.name ??
      issue?.reportedBy?.name ??
      issue?.reporter?.name ??
      issue?.user?.name ??
      issue?.reported_by?.email ??
      issue?.reportedBy?.email ??
      issue?.reporter?.email ??
      issue?.user?.email ??
      ''
    );
  }

  getIssueDate(issue: IssueRecord): string | Date | null {
    return issue?.createdAt ?? issue?.created_at ?? issue?.updatedAt ?? issue?.updated_at ?? null;
  }

  private updateIssueStatus(issue: IssueRecord, status: string): void {
    const service: any = this.issueService;
    const updater =
      service.updateIssueStatus ??
      service.changeIssueStatus ??
      service.setIssueStatus ??
      service.updateStatus ??
      service.patchIssueStatus;

    if (typeof updater !== 'function') {
      this.errorMessage = 'Unable to update issue status right now.';
      return;
    }

    const id = this.getIssueId(issue);
    const args = updater.length <= 1 ? [issue, status] : [id, status];

    this.actionLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = updater.apply(service, args);

      this.subscribeLike(
        result,
        () => {
          this.actionLoading = false;
          this.successMessage = 'Issue updated successfully.';
          this.loadIssues();
        },
        (message: string) => {
          this.actionLoading = false;
          this.errorMessage = message;
        }
      );
    } catch {
      this.actionLoading = false;
      this.errorMessage = 'Unable to update issue status right now.';
    }
  }

  private normalizeIssues(payload: any): IssueRecord[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.results)) {
      return payload.results;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.issues)) {
      return payload.issues;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    return [];
  }

  private normalizeStatus(issue: IssueRecord): string {
    return String(
      issue?.status ??
        issue?.['state'] ??
        issue?.['current_status'] ??
        issue?.['issue_status'] ??
        ''
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  private getIssueId(issue: IssueRecord): number | string | null {
    return issue?.id ?? issue?._id ?? issue?.issue_id ?? null;
  }

  private subscribeLike(result: any, onSuccess: (payload: any) => void, onError: (message: string) => void): void {
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: (payload: any) => onSuccess(payload),
        error: () => onError('A server error occurred. Please try again.'),
      });
      return;
    }

    if (result && typeof result.then === 'function') {
      result
        .then((payload: any) => onSuccess(payload))
        .catch(() => onError('A server error occurred. Please try again.'));
      return;
    }

    onSuccess(result);
  }
}
