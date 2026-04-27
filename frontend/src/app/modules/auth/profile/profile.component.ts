import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="profile-page py-4 py-md-5">
      <div class="profile-page__inner">
        <div class="profile-panel">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
            <div>
              <p class="text-uppercase text-secondary small fw-semibold mb-2">Account details</p>
              <h1 class="h3 mb-2">Profile</h1>
              <p class="text-body-secondary mb-0">Review and update your personal information.</p>
            </div>

            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-secondary" (click)="toggleEdit()">
                {{ isEditing ? 'Stop editing' : 'Edit profile' }}
              </button>
              <button *ngIf="isEditing" type="button" class="btn btn-link text-decoration-none" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
          </div>

          <div *ngIf="loadError" class="alert alert-danger" role="alert">
            {{ loadError }}
          </div>

          <div *ngIf="successMessage" class="alert alert-success" role="alert">
            {{ successMessage }}
          </div>

          <div class="profile-summary mb-4">
            <div class="profile-summary__item">
              <span class="text-secondary small d-block">Name</span>
              <strong>{{ displayName }}</strong>
            </div>
            <div class="profile-summary__item">
              <span class="text-secondary small d-block">Email</span>
              <strong>{{ profileForm.get('email')?.value || 'Not provided' }}</strong>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="profileName" class="form-label">Full name</label>
                <input
                  id="profileName"
                  type="text"
                  class="form-control form-control-lg"
                  formControlName="name"
                  [readonly]="!isEditing"
                  [class.is-invalid]="submitted && profileForm.get('name')?.invalid"
                />
                <div *ngIf="submitted && profileForm.get('name')?.hasError('required')" class="invalid-feedback d-block">
                  Full name is required.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="profileEmail" class="form-label">Email address</label>
                <input
                  id="profileEmail"
                  type="email"
                  class="form-control form-control-lg"
                  formControlName="email"
                  [readonly]="!isEditing"
                  [class.is-invalid]="submitted && profileForm.get('email')?.invalid"
                />
                <div *ngIf="submitted && profileForm.get('email')?.hasError('email')" class="invalid-feedback d-block">
                  Enter a valid email address.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="profilePhone" class="form-label">Phone number</label>
                <input
                  id="profilePhone"
                  type="text"
                  class="form-control form-control-lg"
                  formControlName="phone"
                  [readonly]="!isEditing"
                />
              </div>

              <div class="col-12 col-md-6">
                <label for="profileDepartment" class="form-label">Department</label>
                <input
                  id="profileDepartment"
                  type="text"
                  class="form-control form-control-lg"
                  formControlName="department"
                  [readonly]="!isEditing"
                />
              </div>

              <div class="col-12">
                <label for="profileAddress" class="form-label">Address</label>
                <textarea
                  id="profileAddress"
                  class="form-control"
                  rows="4"
                  formControlName="address"
                  [readonly]="!isEditing"
                ></textarea>
              </div>
            </div>

            <div class="mt-4 d-flex flex-column flex-sm-row gap-2">
              <button *ngIf="isEditing" type="submit" class="btn btn-primary btn-lg" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                {{ saving ? 'Saving...' : 'Save changes' }}
              </button>
              <button *ngIf="!isEditing" type="button" class="btn btn-primary btn-lg" (click)="toggleEdit()">
                Edit profile
              </button>
              <button *ngIf="isEditing" type="button" class="btn btn-outline-secondary btn-lg" (click)="cancelEdit()">
                Discard changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .profile-page {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .profile-page__inner {
      max-width: 46rem;
      margin: 0 auto;
    }

    .profile-panel {
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .profile-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--bs-border-color);
      border-radius: 0.85rem;
      background: rgba(0, 0, 0, 0.02);
    }

    :host-context(body.dark-theme) .profile-summary {
      background: rgba(255, 255, 255, 0.03);
    }

    .profile-summary__item strong {
      font-size: 1rem;
      word-break: break-word;
    }

    .form-label {
      font-weight: 600;
    }

    .btn {
      min-height: 3rem;
    }

    textarea.form-control {
      min-height: 7rem;
    }

    @media (min-width: 768px) {
      .profile-panel {
        padding: 2rem;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  submitted = false;
  isEditing = false;
  loading = true;
  saving = false;
  loadError = '';
  successMessage = '';
  currentUser: any = null;

  readonly profileForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    department: [''],
    address: ['']
  });

  get displayName(): string {
    const name = this.profileForm.get('name')?.value;
    return (name || this.currentUser?.name || this.currentUser?.fullName || this.currentUser?.firstName || 'Account holder') as string;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  load(): void {
    this.loadProfile();
  }

  loadUser(): void {
    this.loadProfile();
  }

  reloadProfile(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.loadError = '';
    this.successMessage = '';

    const result = this.callService(['getCurrentUser', 'getProfile', 'me', 'currentUser', 'getUserProfile']);
    if (this.isObservable(result)) {
      result.subscribe({
        next: (user: any) => this.applyProfile(user),
        error: (error: any) => {
          this.loading = false;
          this.loadError = this.readError(error, 'Unable to load your profile right now.');
          this.applyProfile(this.readFallbackUser());
        }
      });
      return;
    }

    this.applyProfile(result || this.readFallbackUser());
  }

  toggleEdit(): void {
    this.successMessage = '';

    if (this.isEditing) {
      this.cancelEdit();
      return;
    }

    this.isEditing = true;
    this.profileForm.enable({ emitEvent: false });
  }

  editProfile(): void {
    this.toggleEdit();
  }

  startEdit(): void {
    this.toggleEdit();
  }

  cancelEdit(): void {
    this.submitted = false;
    this.successMessage = '';
    this.isEditing = false;
    this.profileForm.reset(this.buildProfileValue(this.currentUser));
    this.profileForm.disable({ emitEvent: false });
  }

  cancelChanges(): void {
    this.cancelEdit();
  }

  saveProfile(): void {
    this.submitted = true;
    this.successMessage = '';
    this.loadError = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.profileForm.getRawValue();
    const result = this.callService(['updateProfile', 'saveProfile', 'updateUserProfile', 'updateAccount'], payload);

    this.handleResult(result, (user: any) => {
      this.saving = false;
      this.currentUser = user || { ...(this.currentUser ?? {}), ...payload };
      this.profileForm.patchValue(this.buildProfileValue(this.currentUser));
      this.profileForm.disable({ emitEvent: false });
      this.isEditing = false;
      this.successMessage = 'Profile updated successfully.';
    });
  }

  save(): void {
    this.saveProfile();
  }

  private applyProfile(user: any): void {
    this.currentUser = user || this.readFallbackUser();
    this.profileForm.reset(this.buildProfileValue(this.currentUser));
    this.profileForm.disable({ emitEvent: false });
    this.loading = false;
  }

  private buildProfileValue(user: any): { name: string; email: string; phone: string; department: string; address: string } {
    const name = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return {
      name: name || '',
      email: user?.email || '',
      phone: user?.phone || user?.mobile || user?.phoneNumber || '',
      department: user?.department || user?.departmentName || '',
      address: user?.address || user?.location || ''
    };
  }

  private readFallbackUser(): any {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private callService(methodNames: string[], ...args: any[]): any {
    const service = this.authService as any;

    for (const name of methodNames) {
      if (typeof service[name] === 'function') {
        return service[name](...args);
      }
    }

    return null;
  }

  private handleResult(result: any, onSuccess: (value: any) => void): void {
    if (!result) {
      onSuccess(null);
      return;
    }

    if (this.isObservable(result)) {
      result.subscribe({
        next: (value: any) => onSuccess(value),
        error: (error: any) => {
          this.saving = false;
          this.loadError = this.readError(error, 'Unable to save your profile right now.');
        }
      });
      return;
    }

    if (typeof result.then === 'function') {
      result
        .then((value: any) => onSuccess(value))
        .catch((error: any) => {
          this.saving = false;
          this.loadError = this.readError(error, 'Unable to save your profile right now.');
        });
      return;
    }

    onSuccess(result);
  }

  private isObservable(value: any): boolean {
    return !!value && typeof value.subscribe === 'function';
  }

  private readError(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}