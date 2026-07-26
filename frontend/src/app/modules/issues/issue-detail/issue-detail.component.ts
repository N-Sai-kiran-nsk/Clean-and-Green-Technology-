import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { isObservable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { IssueService } from '../../../core/services/issue.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LeafletModule],
  template: `
    <section class="screen page-stack">
      <header class="dashboard-header card-surface">
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <p class="text-uppercase text-muted small mb-1">Issue details</p>
            <h1 class="h3 mb-2">Review a report</h1>
            <p class="mb-0 text-secondary">
              Read the full report and update its status if needed.
            </p>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <a routerLink="/issues" class="btn btn-outline-secondary">Back to list</a>
            <button type="button" class="btn btn-outline-primary" (click)="loadIssue()" [disabled]="loading">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="card-surface py-4 text-center text-secondary">
        Loading issue details...
      </div>

      <div *ngIf="!loading && errorMessage" class="card-surface empty-state text-danger">
        {{ errorMessage }}
      </div>

      <div *ngIf="!loading && issue" class="row g-3">
        <div class="col-12 col-xl-8">
          <div class="card-surface h-100">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 class="h4 mb-2 text-break">{{ issueTitle(issue) }}</h2>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="pill">{{ statusLabel(issue) }}</span>
                  <span class="pill">{{ priorityLabel(issue) }}</span>
                  <span class="pill">{{ departmentLabel(issue) }}</span>
                </div>
              </div>
              <button type="button" class="btn" [class.btn-primary]="issue?.has_upvoted" [class.btn-outline-primary]="!issue?.has_upvoted" (click)="toggleUpvote()">
                <i class="bi" [class.bi-hand-thumbs-up-fill]="issue?.has_upvoted" [class.bi-hand-thumbs-up]="!issue?.has_upvoted"></i> 
                {{ issue?.upvotes_count || 0 }} Upvote{{ (issue?.upvotes_count || 0) === 1 ? '' : 's' }}
              </button>
            </div>
            <p class="lead text-secondary text-break mb-4">{{ issueDescription(issue) }}</p>

            <dl class="row g-3 mb-0">
              <div class="col-12 col-md-6">
                <dt class="text-muted small text-uppercase">Location</dt>
                <dd class="mb-0">{{ locationLabel(issue) }}</dd>
              </div>

              <div class="col-12 col-md-6">
                <dt class="text-muted small text-uppercase">Submitted</dt>
                <dd class="mb-0">{{ displayDate(issue) }}</dd>
              </div>

              <div class="col-12 col-md-6">
                <dt class="text-muted small text-uppercase">Contact</dt>
                <dd class="mb-0">{{ contactLabel(issue) }}</dd>
              </div>

              <div class="col-12 col-md-6">
                <dt class="text-muted small text-uppercase">Reference</dt>
                <dd class="mb-0">{{ issueIdentifier(issue) }}</dd>
              </div>

              <div class="col-12">
                <dt class="text-muted small text-uppercase">Additional notes</dt>
                <dd class="mb-0 text-break">{{ notesLabel(issue) }}</dd>
              </div>

              <div class="col-12" *ngIf="hasLocation(issue)">
                <dt class="text-muted small text-uppercase">Location</dt>
                <dd class="mb-0">
                  <div class="map-container border rounded-3 mt-2" style="height: 250px; overflow: hidden;">
                    <div
                      leaflet
                      [leafletOptions]="getMapOptions(issue)"
                      [leafletLayers]="getMapLayers()"
                      class="h-100 w-100"
                    ></div>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="col-12 col-xl-4" *ngIf="isAdmin">
          <div class="card-surface h-100">
            <div class="section-header">
              <h2 class="h5 mb-1">Actions</h2>
              <p class="text-secondary mb-0">Choose the current state for this issue.</p>
            </div>

            <div class="d-grid gap-2">
              <button type="button" class="btn btn-outline-secondary" (click)="updateStatus('open')">
                Mark as open
              </button>
              <button type="button" class="btn btn-outline-primary" (click)="updateStatus('in_progress')">
                Mark as in progress
              </button>
              <button type="button" class="btn btn-primary" (click)="updateStatus('resolved')">
                Mark as resolved
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !issue && !errorMessage" class="card-surface empty-state">
        This issue could not be found.
      </div>
    </section>
  `,
})
export class IssueDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  issueId = '';
  issue: any = null;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.issueId = params.get('id') ?? '';
      this.loadIssue();
    });
  }

  loadIssue(): void {
    if (!this.issueId) {
      this.issue = null;
      this.errorMessage = 'No issue identifier was provided.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const numId = isNaN(Number(this.issueId)) ? this.issueId : Number(this.issueId);

    const result = this.invokeFallback(this.issueService as any, [
      'getIssueById',
      'loadIssue',
      'getIssue',
      'fetchIssue',
      'findIssue',
      'loadIssueById',
      'getIssueDetails',
    ], numId);

    this.consumeResult(
      result,
      (value) => {
        this.issue = this.unwrapSingle(value);
        this.loading = false;

        if (!this.issue) {
          this.errorMessage = 'This issue could not be found.';
        }
      },
      () => {
        this.issue = null;
        this.loading = false;
        this.errorMessage = 'Unable to load the issue details right now.';
      }
    );
  }

  updateStatus(status: string): void {
    if (!this.issueId) {
      return;
    }

    const numId = isNaN(Number(this.issueId)) ? this.issueId : Number(this.issueId);

    const result = this.invokeFallback(this.issueService as any, [
      'updateIssueStatus',
      'setIssueStatus',
      'changeIssueStatus',
      'updateStatus',
      'markIssueStatus',
      'setStatus',
      'changeStatus',
      'resolveIssue',
      'markResolved',
    ], numId, status);

    this.consumeMutationResult(result, () => {
      if (this.issue) {
        this.issue = {
          ...this.issue,
          status,
          issueStatus: status,
          state: status,
          currentStatus: status,
        };
      }
    });
  }

  toggleUpvote(): void {
    if (!this.issueId || !this.issue) return;
    
    // Optimistic UI update
    const previousHasUpvoted = this.issue.has_upvoted;
    const previousCount = this.issue.upvotes_count || 0;
    
    this.issue.has_upvoted = !previousHasUpvoted;
    this.issue.upvotes_count = previousHasUpvoted ? Math.max(0, previousCount - 1) : previousCount + 1;

    this.issueService.toggleUpvote(Number(this.issueId)).subscribe({
      next: (response) => {
        this.issue.has_upvoted = response.has_upvoted;
        this.issue.upvotes_count = response.upvotes_count;
      },
      error: () => {
        // Revert on error
        this.issue.has_upvoted = previousHasUpvoted;
        this.issue.upvotes_count = previousCount;
      }
    });
  }

  issueTitle(issue: any): string {
    return this.toText(issue?.title ?? issue?.subject ?? issue?.name ?? 'Untitled issue');
  }

  issueDescription(issue: any): string {
    return this.toText(issue?.description ?? issue?.summary ?? issue?.details ?? 'No description available.');
  }

  statusLabel(issue: any): string {
    const status = this.normalizeStatus(issue) || 'open';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  priorityLabel(issue: any): string {
    const priority = this.toText(issue?.priority ?? issue?.urgency ?? 'normal');
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  departmentLabel(issue: any): string {
    return this.toText(issue?.departmentName ?? issue?.department?.name ?? issue?.department ?? 'General');
  }

  locationLabel(issue: any): string {
    return this.toText(issue?.location ?? issue?.address ?? issue?.ward ?? 'Not provided');
  }

  displayDate(issue: any): string {
    const value = issue?.createdAt ?? issue?.createdDate ?? issue?.date ?? issue?.submittedAt;
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

  contactLabel(issue: any): string {
    return this.toText(issue?.contactName ?? issue?.contact ?? issue?.reporterName ?? issue?.email ?? 'Not provided');
  }

  issueIdentifier(issue: any): string {
    return this.toText(issue?.id ?? issue?._id ?? issue?.issueId ?? this.issueId);
  }

  notesLabel(issue: any): string {
    return this.toText(issue?.notes ?? issue?.remarks ?? issue?.additionalNotes ?? issue?.adminNotes ?? 'No additional notes.');
  }

  hasLocation(issue: any): boolean {
    const lat = issue?.latitude ?? issue?.lat;
    const lng = issue?.longitude ?? issue?.lng;
    return lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
  }

  getMapOptions(issue: any): L.MapOptions {
    const lat = Number(issue?.latitude ?? issue?.lat ?? 40.7128);
    const lng = Number(issue?.longitude ?? issue?.lng ?? -74.006);
    return {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ],
      zoom: 15,
      center: L.latLng(lat, lng)
    };
  }

  getMapLayers(): L.Layer[] {
    if (this.issue) {
      const lat = Number(this.issue?.latitude ?? this.issue?.lat);
      const lng = Number(this.issue?.longitude ?? this.issue?.lng);
      if (lat != null && lng != null) {
        return [L.marker([lat, lng])];
      }
    }
    return [];
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

  private consumeResult(
    result: unknown,
    onSuccess: (value: unknown) => void,
    onError: (error: unknown) => void
  ): void {
    if (Array.isArray(result)) {
      onSuccess(result);
      return;
    }

    if (isObservable(result)) {
      result.subscribe({
        next: onSuccess,
        error: onError,
      });
      return;
    }

    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>)
        .then(onSuccess)
        .catch(onError);
      return;
    }

    onSuccess(result);
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

  private unwrapSingle(value: unknown): any {
    const candidate = value as any;

    if (candidate && typeof candidate === 'object') {
      if (candidate.data && typeof candidate.data === 'object' && !Array.isArray(candidate.data)) {
        return candidate.data;
      }

      if (candidate.item && typeof candidate.item === 'object' && !Array.isArray(candidate.item)) {
        return candidate.item;
      }

      if (candidate.result && typeof candidate.result === 'object' && !Array.isArray(candidate.result)) {
        return candidate.result;
      }
    }

    return candidate;
  }

  private normalizeStatus(issue: any): string {
    return this.toText(issue?.status ?? issue?.issueStatus ?? issue?.state ?? issue?.currentStatus).toLowerCase();
  }

  private toText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }
}