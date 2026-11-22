import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isObservable } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
              <div *ngIf="departmentErrorMessage" class="small text-danger mt-1">{{ departmentErrorMessage }}</div>
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
                (input)="onLocationInput()"
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
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <label class="form-label fw-semibold mb-0">Pin location on map</label>
                <button type="button" class="btn btn-sm btn-outline-primary" (click)="useMyLocation()" [disabled]="loading">
                  Use my current location
                </button>
              </div>
              <p class="text-muted small mb-2">Click the map to drop a pin, use your device location, or enter coordinates manually.</p>
              <div *ngIf="locationMessage" class="small text-primary mb-2">{{ locationMessage }}</div>
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

            <div class="col-12">
              <label for="photo" class="form-label fw-semibold">Photos of the issue</label>
              <p class="text-muted small mb-2">Add up to 5 clear photos, each max 10 MB.</p>
              <input
                id="photo"
                type="file"
                accept="image/*"
                multiple
                class="form-control"
                (change)="onPhotoSelected($event)"
              />
              <div *ngIf="photoError" class="small text-danger mt-1">{{ photoError }}</div>
              <div *ngIf="photoFiles.length" class="mt-3">
                <div class="d-flex flex-wrap gap-3">
                  <div *ngFor="let preview of photoPreviews; let i = index">
                    <img [src]="preview" [alt]="'Selected issue photo ' + (i + 1)" class="img-thumbnail" style="max-height: 160px; max-width: 200px; object-fit: cover;" />
                    <button type="button" class="btn btn-sm btn-outline-danger mt-1" (click)="removePhoto(i)">Remove</button>
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger mt-2" (click)="clearPhotos()">Clear all</button>
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
export class ReportIssueComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private readonly departmentService = inject(DepartmentService);
  private readonly sanitizer = inject(DomSanitizer);

  departments: any[] = [];
  loading = false;
  departmentsLoading = false;
  departmentErrorMessage = '';
  locationMessage = '';
  photoFiles: File[] = [];
  photoPreviews: SafeUrl[] = [];
  photoObjectUrls: string[] = [];
  photoError = '';
  private lastAutoLocation = '';
  private geocodeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
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
      L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
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

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.geocodeTimer) {
      clearTimeout(this.geocodeTimer);
      this.geocodeTimer = null;
    }
    this.releasePhotoUrls();
  }

  onMapReady(map: L.Map): void {
    this.map = map;
    map.invalidateSize();
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    const { lat, lng } = event.latlng;
    this.form.patchValue({ latitude: lat, longitude: lng });
    this.locationMessage = 'Pin set on the map.';
    this.updateMarker(lat, lng);
    this.reverseGeocode(lat, lng);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.locationMessage = 'Your browser does not support location access.';
      return;
    }

    this.locationMessage = 'Getting your current location...';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const existingLocation = typeof this.form.value.location === 'string' ? this.form.value.location.trim() : '';
        const autoLocation = existingLocation || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        this.form.patchValue({
          latitude: lat,
          longitude: lng,
          location: autoLocation,
        });
        if (!existingLocation) {
          this.lastAutoLocation = autoLocation;
        }
        this.map?.setView([lat, lng], 16);
        this.updateMarker(lat, lng);
        this.locationMessage = 'Location set from your device.';
        this.reverseGeocode(lat, lng);
      },
      () => {
        this.locationMessage = 'Location access was denied or unavailable. You can still click the map to set a pin.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    input.value = '';
    this.photoError = '';

    if (!selected.length) {
      return;
    }

    const remaining = 5 - this.photoFiles.length;
    if (remaining <= 0) {
      this.photoError = 'You can add up to 5 photos.';
      return;
    }

    if (selected.length > remaining) {
      this.photoError = 'You can add up to 5 photos.';
    }

    for (const file of selected.slice(0, remaining)) {
      if (!(file.type || '').toLowerCase().startsWith('image/')) {
        this.photoError = 'Please choose image files only.';
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.photoError = 'Each photo must be smaller than 10 MB.';
        continue;
      }

      this.addPhoto(file);
    }
  }

  removePhoto(index: number): void {
    if (index < 0 || index >= this.photoFiles.length) {
      return;
    }

    this.photoFiles.splice(index, 1);
    this.photoPreviews.splice(index, 1);
    const [removedUrl] = this.photoObjectUrls.splice(index, 1);
    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }
  }

  clearPhotos(): void {
    this.releasePhotoUrls();
    this.photoFiles = [];
    this.photoPreviews = [];
    this.photoError = '';
  }

  onLocationInput(): void {
    this.lastAutoLocation = '';
  }

  private addPhoto(file: File): void {
    const objectUrl = URL.createObjectURL(file);
    const index = this.photoFiles.length;
    this.photoFiles.push(file);
    this.photoObjectUrls.push(objectUrl);
    this.photoPreviews.push(this.sanitizer.bypassSecurityTrustUrl(objectUrl));

    void this.compressImage(file).then((processed) => {
      if (this.destroyed || this.photoFiles[index] !== file) {
        return;
      }

      URL.revokeObjectURL(this.photoObjectUrls[index]);
      const nextUrl = URL.createObjectURL(processed);
      this.photoFiles[index] = processed;
      this.photoObjectUrls[index] = nextUrl;
      this.photoPreviews[index] = this.sanitizer.bypassSecurityTrustUrl(nextUrl);
    });
  }

  private async compressImage(file: File): Promise<File> {
    let source: ImageBitmap | HTMLImageElement | null = null;
    try {
      source = await this.loadImage(file);
      const width = source.width;
      const height = source.height;
      if (!width || !height) {
        return file;
      }

      const scale = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        return file;
      }

      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob) {
        return file;
      }

      const originalBase = file.name.replace(/\.[^.]+$/, '') || 'photo';
      return new File([blob], `${originalBase}-compressed.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    } catch {
      return file;
    } finally {
      if (source && typeof (source as ImageBitmap).close === 'function') {
        (source as ImageBitmap).close();
      }
    }
  }

  private async loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(file);
      } catch {
        return this.loadImageViaElement(file);
      }
    }

    return this.loadImageViaElement(file);
  }

  private loadImageViaElement(file: File): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to load image.'));
      };
      image.src = url;
    });
  }

  private releasePhotoUrls(): void {
    for (const url of this.photoObjectUrls) {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
    this.photoObjectUrls = [];
  }

  private reverseGeocode(lat: number, lng: number): void {
    if (this.geocodeTimer) {
      clearTimeout(this.geocodeTimer);
      this.geocodeTimer = null;
    }

    this.geocodeTimer = setTimeout(() => {
      this.geocodeTimer = null;
      void this.resolveLocation(lat, lng);
    }, 400);
  }

  private async resolveLocation(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`);
      }

      const data = await response.json();
      const displayName = typeof data?.display_name === 'string' && data.display_name.trim()
        ? data.display_name.trim()
        : '';
      const currentLocation = typeof this.form.value.location === 'string' ? this.form.value.location.trim() : '';
      if (!currentLocation || currentLocation === this.lastAutoLocation) {
        if (displayName) {
          this.form.patchValue({ location: displayName });
          this.lastAutoLocation = displayName;
        }
      }

      this.locationMessage = displayName || 'Address not found. Please enter the location manually.';
    } catch {
      this.locationMessage = 'Could not look up the address. Please enter the location manually.';
    }
  }

  private updateMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng(L.latLng(lat, lng));
    } else if (this.map) {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.form.patchValue({ latitude: pos.lat, longitude: pos.lng });
        this.reverseGeocode(pos.lat, pos.lng);
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
        this.departmentErrorMessage = items.length ? '' : 'No departments are available yet.';
      },
      () => {
        this.departments = [];
        this.departmentsLoading = false;
        this.departmentErrorMessage = 'Unable to load departments. Please try again.';
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
    ], payload, this.photoFiles);

    this.consumeMutationResult(
      result,
      (created) => {
        this.loading = false;
        this.successMessage = 'Your issue has been submitted.';
        const createdId = created?.id ?? created?._id ?? created?.issueId;
        this.form.reset({
          title: '',
          description: '',
          departmentId: '',
          category: '',
          location: '',
          latitude: null,
          longitude: null,
          priority: 'medium',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
        });
        this.clearPhotos();
        this.lastAutoLocation = '';
        this.locationMessage = '';
        this.router.navigate(createdId != null ? ['/issues/detail', createdId] : ['/issues']);
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

  private consumeMutationResult(result: unknown, onSuccess: (value: any) => void, onError: (err?: any) => void): void {
    if (!result) {
      onSuccess(undefined);
      return;
    }

    if (isObservable(result)) {
      result.subscribe({
        next: (value) => onSuccess(value),
        error: (err) => onError(err),
      });
      return;
    }

    if (typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).then((value) => onSuccess(value)).catch((err) => onError(err));
      return;
    }

    onSuccess(result);
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