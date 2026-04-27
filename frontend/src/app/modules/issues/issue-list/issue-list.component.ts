import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isObservable } from 'rxjs';
import { IssueService } from '../../../core/services/issue.service';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="screen page-stack">
      <header class="dashboard-header card-surface">
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <p class="text-uppercase text-muted small mb-1">Issue list</p>
            <h1 class="h3 mb-2">Reported issues</h1>
            <p class="mb-0 text-secondary">
              Search, filter, and open the reports that matter to you.
            </p>
          </div>

          <div class="d-flex gap-2">
            <div class="btn-group" role="group">
              <button type="button" class="btn" [class.btn-primary]="viewMode === 'list'" [class.btn-outline-primary]="viewMode !== 'list'" (click)="setViewMode('list')">
                <i class="bi bi-list-ul"></i> List
              </button>
              <button type="button" class="btn" [class.btn-primary]="viewMode === 'map'" [class.btn-outline-primary]="viewMode !== 'map'" (click)="setViewMode('map')">
                <i class="bi bi-map"></i> Map
              </button>
            </div>
            <a routerLink="/issues/report" class="btn btn-primary">Report issue</a>
          </div>
        </div>
      </header>

      <div class="card-surface">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-lg-5">
            <label for="search" class="form-label fw-semibold">Search</label>
            <input
              id="search"
              type="search"
              class="form-control form-control-lg"
              [(ngModel)]="searchTerm"
              name="searchTerm"
              placeholder="Search by title, location, or description"
            />
          </div>

          <div class="col-12 col-md-6 col-lg-2">
            <label for="status" class="form-label fw-semibold">Status</label>
            <select id="status" class="form-select form-select-lg" [(ngModel)]="selectedStatus" name="selectedStatus">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div class="col-12 col-md-6 col-lg-2">
            <label for="priority" class="form-label fw-semibold">Priority</label>
            <select id="priority" class="form-select form-select-lg" [(ngModel)]="selectedPriority" name="selectedPriority">
              <option value="all">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <label for="department" class="form-label fw-semibold">Department</label>
            <select
              id="department"
              class="form-select form-select-lg"
              [(ngModel)]="selectedDepartment"
              name="selectedDepartment"
            >
              <option value="all">All departments</option>
              <option *ngFor="let department of departmentOptions; trackBy: trackByDepartment" [value]="department">
                {{ department }}
              </option>
            </select>
          </div>

          <div class="col-12 col-lg-1 d-grid">
            <button type="button" class="btn btn-outline-secondary" (click)="clearFilters()">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div class="card-surface">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h2 class="h5 mb-1">Results</h2>
            <p class="text-secondary mb-0">{{ filteredIssues.length }} issues found</p>
          </div>
        </div>

        <div *ngIf="loading" class="py-4 text-center text-secondary">Loading issues...</div>

        <div *ngIf="!loading && errorMessage" class="empty-state text-danger">
          {{ errorMessage }}
        </div>

        <div *ngIf="viewMode === 'list'">
          <div *ngIf="!loading && !errorMessage && !filteredIssues.length" class="empty-state">
            No issues match your filters.
          </div>

          <div *ngIf="!loading && !errorMessage && filteredIssues.length" class="page-stack">
            <article
              *ngFor="let issue of filteredIssues; trackBy: trackByIssue"
              class="border rounded-3 p-3 bg-body-tertiary"
            >
              <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                <div class="flex-grow-1">
                  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span class="pill">{{ statusLabel(issue) }}</span>
                    <span class="pill">{{ departmentLabel(issue) }}</span>
                    <span class="text-muted small">{{ displayDate(issue) }}</span>
                  </div>

                  <h3 class="h5 mb-2 text-break">{{ issueTitle(issue) }}</h3>
                  <p class="text-secondary mb-3 text-break">
                    {{ issueDescription(issue) }}
                  </p>

                  <div class="d-flex flex-wrap gap-2 text-muted small">
                    <span *ngIf="locationLabel(issue)"><i class="bi bi-geo-alt"></i> {{ locationLabel(issue) }}</span>
                  </div>
                </div>

                <a class="btn btn-outline-primary align-self-start" [routerLink]="['/issues/detail', issueId(issue)]">
                  Open details
                </a>
              </div>
            </article>
          </div>
        </div>

        <div *ngIf="viewMode === 'map'" class="map-container position-relative">
          <div id="issuesMap" style="height: 600px; width: 100%; border-radius: 0.5rem; z-index: 1;"></div>
          <div *ngIf="!loading && !errorMessage && filteredIssuesWithCoords.length === 0" class="position-absolute top-50 start-50 translate-middle bg-white p-3 rounded shadow text-center" style="z-index: 2;">
            <p class="mb-0 text-muted">No issues with location data match your filters.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .pill {
      display: inline-block;
      padding: 0.25em 0.6em;
      font-size: 0.75em;
      font-weight: 700;
      line-height: 1;
      color: #fff;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
      border-radius: 50rem;
      background-color: #6c757d;
    }
  `]
})
export class IssueListComponent implements OnInit {
  private readonly issueService = inject(IssueService);
  private readonly route = inject(ActivatedRoute);

  issues: any[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  selectedStatus = 'all';
  selectedDepartment = 'all';
  selectedPriority = 'all';
  viewMode: 'list' | 'map' = 'list';
  
  private map: any = null;
  private markersLayer: any = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['priority']) {
        this.selectedPriority = params['priority'].toLowerCase();
      }
    });
    this.loadIssues();
  }

  get filteredIssues(): any[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.issues.filter((issue) => {
      const matchesSearch =
        !search ||
        this.issueTitle(issue).toLowerCase().includes(search) ||
        this.issueDescription(issue).toLowerCase().includes(search) ||
        this.departmentLabel(issue).toLowerCase().includes(search) ||
        this.locationLabel(issue).toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'all' || this.normalizeStatus(issue) === this.selectedStatus.toLowerCase();

      const matchesDepartment =
        this.selectedDepartment === 'all' || this.departmentLabel(issue).toLowerCase() === this.selectedDepartment.toLowerCase();

      const issuePriority = (issue?.priority || '').toLowerCase();
      const matchesPriority = 
        this.selectedPriority === 'all' || issuePriority === this.selectedPriority;

      return matchesSearch && matchesStatus && matchesDepartment && matchesPriority;
    });
  }

  get filteredIssuesWithCoords(): any[] {
    return this.filteredIssues.filter(issue => issue.latitude && issue.longitude);
  }

  get departmentOptions(): string[] {
    return Array.from(
      new Set(
        this.issues
          .map((issue) => this.departmentLabel(issue))
          .filter((department) => Boolean(department))
      )
    ).sort((left, right) => left.localeCompare(right));
  }

  loadIssues(): void {
    this.loading = true;
    this.errorMessage = '';

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
        this.loading = false;
      },
      () => {
        this.issues = [];
        this.loading = false;
        this.errorMessage = 'Unable to load issues at the moment.';
      }
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedDepartment = 'all';
    this.selectedPriority = 'all';
    if (this.viewMode === 'map') {
      this.updateMapMarkers();
    }
  }

  setViewMode(mode: 'list' | 'map'): void {
    this.viewMode = mode;
    if (mode === 'map') {
      // Need timeout to allow DOM to render the map div
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  private initMap(): void {
    // @ts-ignore - L is loaded globally from index.html
    const L = (window as any)['L'];
    if (!L) {
      console.error('Leaflet is not loaded!');
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    // Default center (can be user's location or a default city center)
    const defaultLat = 37.7749;
    const defaultLng = -122.4194;

    this.map = L.map('issuesMap').setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.updateMapMarkers();

    // Try to center on user's location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        if (this.map) {
          this.map.setView([position.coords.latitude, position.coords.longitude], 13);
        }
      });
    }
  }

  private updateMapMarkers(): void {
    if (!this.map || !this.markersLayer) return;
    
    // @ts-ignore
    const L = (window as any)['L'];
    this.markersLayer.clearLayers();

    const issues = this.filteredIssuesWithCoords;
    if (issues.length === 0) return;

    const bounds = L.latLngBounds();

    issues.forEach(issue => {
      const lat = parseFloat(issue.latitude);
      const lng = parseFloat(issue.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]);
        
        // Build popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h6 style="margin-bottom: 5px;"><strong>${this.issueTitle(issue)}</strong></h6>
            <div style="margin-bottom: 8px;">
              <span style="background-color: #6c757d; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">
                ${this.statusLabel(issue)}
              </span>
              <span style="background-color: #0d6efd; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">
                ${this.departmentLabel(issue)}
              </span>
            </div>
            <p style="font-size: 12px; margin-bottom: 10px; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
              ${this.issueDescription(issue)}
            </p>
            <a href="/issues/detail/${this.issueId(issue)}" class="btn btn-sm btn-primary" style="font-size: 12px; padding: 3px 8px;">View Details</a>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        this.markersLayer.addLayer(marker);
        bounds.extend([lat, lng]);
      }
    });

    // Auto-fit bounds if we have markers
    if (issues.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  issueId(issue: any): string | number | null {
    return issue?.id ?? issue?._id ?? issue?.issueId ?? null;
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

  departmentLabel(issue: any): string {
    const department = issue?.department;

    if (department && typeof department === 'object') {
      return this.toText(department?.name ?? department?.departmentName ?? department?.title ?? 'General');
    }

    return this.toText(issue?.departmentName ?? department ?? 'General');
  }

  locationLabel(issue: any): string {
    return this.toText(issue?.location ?? issue?.address ?? issue?.ward ?? '');
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

  trackByIssue = (index: number, issue: any): string | number => {
    return this.issueId(issue) ?? index;
  };

  trackByDepartment(index: number, department: string): string {
    return department || String(index);
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

  private normalizeStatus(issue: any): string {
    return this.toText(issue?.status ?? issue?.issueStatus ?? issue?.state ?? issue?.currentStatus)
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }
}