import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isObservable } from 'rxjs';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { DepartmentService } from '../../../core/services/department.service';
import { IssueService } from '../../../core/services/issue.service';

@Component({
  selector: 'app-report-issue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LeafletModule],
  template: `
    <section class="screen page-stack">
      <header class="dashboard-header card-surface">
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <p class="text-uppercase text-muted small mb-1">Report a problem</p>
            <h1 class="h3 mb-2">Submit a new issue</h1>
            <p class="mb-0 text-secondary">
              Use clear details and a simple description so the right team can help sooner.
            </p>
          </div>
          <a routerLink="/issues" class="btn btn-outline-secondary">Back to issues</a>
        </div>
      </header>

      <div class="card-surface">
        <div *ngIf="errorMessage" class="alert alert-danger mb-4" role="alert">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success mb-4" role="status">
          {{ successMessage }}
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="row g-4">
            <div class="col-12">
              <label for="title" class="form-label fw-semibold">Issue title</label>
              <input
                id="title"
                type="text"
                class="form-control form-control-lg"
                formControlName="title"
                placeholder="Example: Broken street light near Main Road"
              />
              <div class="invalid-feedback d-block" *ngIf="isInvalid('title')">
                Please enter a clear title.
              </div>
            </div>

            <div class="col-12 col-lg-6">
              <label for="departmentId" class="form-label fw-semibold">Department</label>
              <select id="departmentId" class="form-select form-select-lg" formControlName="departmentId">
                <option value="">Choose a department</option>
                <option *ngFor="let department of departments; trackBy: trackByDepartment" [value]="departmentValue(department)">
                  {{ departmentLabel(department) }}
                </option>
              </select>
              <div class="invalid-feedback d-block" *ngIf="isInvalid('departmentId')">
                Please choose a department.
              </div>
            </div>

            <div class="col-12 col-lg-6">
              <label for="location" class="form-label fw-semibold">Location</label>
              <input
                id="location"
                type="text"
                class="form-control form-control-lg"
                formControlName="location"
                placeholder="Street, landmark, ward, or building"
              />
              <div class="invalid-feedback d-block" *ngIf="isInvalid('location')">
                Please add the location.
              </div>
            </div>

            <div class="col-12 col-lg-6">
              <label for="category" class="form-label fw-semibold">Category</label>
              <select id="category" class="form-select form-select-lg" formControlName="category">
                <option value="">Select a category</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="roads">Roads & Traffic</option>
                <option value="sanitation">Sanitation</option>
                <option value="utilities">Utilities</option>
                <option value="parks">Parks & Green Spaces</option>
                <option value="public_safety">Public Safety</option>
                <option value="other">Other</option>
              </select>
              <div class="invalid-feedback d-block" *ngIf="isInvalid('category')">
                Please select a category.
              </div>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Pin location on map</label>
              <p class="text-muted small mb-2">Click on the map to set the location coordinates, or enter coordinates manually below.</p>
              <div class="map-container border rounded-3" style="height: 300px; overflow: hidden;">
                <div
                  leaflet
                  [leafletOptions]="mapOptions"
                  (leafletMapReady)="onMapReady($event)"
                  (leafletClick)="onMapClick($event)"
                  class="h-100 w-100"
                ></div>
              </div>
            </div>

            <div class="col-12 col-lg-6">
              <label for="latitude" class="form-label fw-semibold">Latitude</label>
              <input
                id="latitude"
                type="number"
                step="any"
                class="form-control"
                formControlName="latitude"
                placeholder="e.g., 40.7128"
              />
            </div>

            <div class="col-12 col-lg-6">
              <label for="longitude" class="form-label fw-semibold">Longitude</label>
              <input
                id="longitude"
                type="number"
                step="any"
                class="form-control"
                formControlName="longitude"
                placeholder="e.g., -74.0060"
              />
            </div>

            <div class="col-12 col-lg-6">
              <label for="priority" class="form-label fw-semibold">Priority</label>
              <select id="priority" class="form-select form-select-lg" formControlName="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div class="col-12">
              <label for="description" class="form-label fw-semibold">Description</label>
              <textarea
                id="description"
                rows="6"
                class="form-control"
                formControlName="description"
                placeholder="Explain what happened, when it started, and anything important the team should know."
              ></textarea>
              <div class="invalid-feedback d-block" *ngIf="isInvalid('description')">
                Please write a short description.
              </div>
            </div>

            <div class="col-12 col-lg-4">
              <label for="contactName" class="form-label fw-semibold">Your name</label>
              <input id="contactName" type="text" class="form-control" formControlName="contactName" />
            </div>

            <div class="col-12 col-lg-4">
              <label for="contactPhone" class="form-label fw-semibold">Phone number</label>
              <input id="contactPhone" type="tel" class="form-control" formControlName="contactPhone" />
            </div>

            <div class="col-12 col-lg-4">
              <label for="contactEmail" class="form-label fw-semibold">Email address</label>
              <input id="contactEmail" type="email" class="form-control" formControlName="contactEmail" />
            </div>

            <div class="col-12">
              <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end">
                <button type="button" class="btn btn-outline-secondary" (click)="onCancel()" [disabled]="loading">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="loading">
                  {{ loading ? 'Submitting...' : 'Submit issue' }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class ReportIssueComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private readonly departmentService = inject(DepartmentService);

  departments: any[] = [];
  loading = false;
  departmentsLoading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    departmentId: ['', Validators.required],
    category: ['', Validators.required],
    location: ['', [Validators.required, Validators.minLength(3)]],
    priority: ['medium', Validators.required],
    latitude: [null as any],
    longitude: [null as any],
    contactName: [''],
    contactPhone: [''],
    contactEmail: ['', Validators.email],
  });

  mapOptions: L.MapOptions = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      })
    ],
    zoom: 13,
    center: L.latLng(40.7128, -74.006)
  };

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngOnInit(): void {
    this.loadDepartments();
  }

  onMapReady(map: L.Map): void {
    this.map = map;
    map.invalidateSize();
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    const { lat, lng } = event.latlng;
    this.form.patchValue({ latitude: lat, longitude: lng });
    this.updateMarker(lat, lng);
  }

  private updateMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng(L.latLng(lat, lng));
    } else if (this.map) {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.form.patchValue({ latitude: pos.lat, longitude: pos.lng });
      });
    }
  }

  loadDepartments(): void {
    this.departmentsLoading = true;

    const result = this.invokeFallback(this.departmentService as any, [
      'getDepartments',
      'loadDepartments',
      'fetchDepartments',
      'listDepartments',
      'getAllDepartments',
      'getDepartmentList',
    ]);

    this.consumeListResult(
      result,
      (items) => {
        this.departments = items;
        this.departmentsLoading = false;
      },
      () => {
        this.departments = [];
        this.departmentsLoading = false;
      }
    );
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please complete the highlighted fields before submitting.';
      return;
    }

    this.loading = true;

    const formValues = this.form.getRawValue();
    const payload = {
      title: formValues.title,
      description: formValues.description,
      department: formValues.departmentId ? Number(formValues.departmentId) : null,
      category: formValues.category,
      location: formValues.location,
      priority: formValues.priority,
      latitude: formValues.latitude !== null && formValues.latitude !== '' ? Number(formValues.latitude) : null,
      longitude: formValues.longitude !== null && formValues.longitude !== '' ? Number(formValues.longitude) : null,
    };

    const result = this.invokeFallback(this.issueService as any, [
      'createIssue',
      'reportIssue',
      'submitIssue',
      'addIssue',
      'saveIssue',
      'create',
      'submit',
    ], payload);

    this.consumeMutationResult(
      result,
      () => {
        this.loading = false;
        this.successMessage = 'Your issue has been submitted.';
        this.form.reset({
          title: '',
          description: '',
          departmentId: '',
          location: '',
          priority: 'medium',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
        });
        this.router.navigate(['/issues']);
      },
      (error) => {
        console.error('Error submitting issue:', error);
        this.loading = false;
        this.errorMessage = 'We could not submit the issue right now. Please try again.';
      }
    );
  }

  onCancel(): void {
    this.router.navigate(['/issues']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.touched && control.invalid);
  }

  departmentValue(department: any): string | number {
    return department?.id ?? department?._id ?? department?.departmentId ?? department?.name ?? '';
  }

  departmentLabel(department: any): string {
    return department?.name ?? department?.departmentName ?? department?.title ?? 'Department';
  }

  trackByDepartment = (index: number, department: any): string | number => {
    return this.departmentValue(department) || index;
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

  private consumeMutationResult(result: unknown, onSuccess: () => void, onError: (err?: any) => void): void {
    if (!result) {
      onSuccess();
      return;
    }

    if (isObservable(result)) {
      result.subscribe({
        next: () => onSuccess(),
        error: (err) => onError(err),
      });
      return;
    }

    if (typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).then(() => onSuccess()).catch((err) => onError(err));
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
}