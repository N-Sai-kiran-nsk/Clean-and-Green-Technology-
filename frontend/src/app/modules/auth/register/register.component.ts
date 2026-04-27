import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="auth-page py-4 py-md-5">
      <div class="auth-page__inner">
        <div class="auth-panel">
          <div class="mb-4">
            <p class="text-uppercase text-secondary small fw-semibold mb-2">Create account</p>
            <h1 class="h3 mb-2">Register</h1>
            <p class="text-body-secondary mb-0">Fill in the details below to create your account.</p>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="firstName" class="form-label">First name</label>
                <input
                  id="firstName"
                  type="text"
                  class="form-control form-control-lg"
                  formControlName="firstName"
                  autocomplete="given-name"
                  [class.is-invalid]="submitted && registerForm.get('firstName')?.invalid"
                />
                <div *ngIf="submitted && registerForm.get('firstName')?.hasError('required')" class="invalid-feedback d-block">
                  First name is required.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="lastName" class="form-label">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  class="form-control form-control-lg"
                  formControlName="lastName"
                  autocomplete="family-name"
                  [class.is-invalid]="submitted && registerForm.get('lastName')?.invalid"
                />
                <div *ngIf="submitted && registerForm.get('lastName')?.hasError('required')" class="invalid-feedback d-block">
                  Last name is required.
                </div>
              </div>

              <div class="col-12">
                <label for="registerEmail" class="form-label">Email address</label>
                <input
                  id="registerEmail"
                  type="email"
                  class="form-control form-control-lg"
                  formControlName="email"
                  autocomplete="email"
                  [class.is-invalid]="submitted && registerForm.get('email')?.invalid"
                />
                <div *ngIf="submitted && registerForm.get('email')?.hasError('required')" class="invalid-feedback d-block">
                  Email address is required.
                </div>
                <div *ngIf="submitted && registerForm.get('email')?.hasError('email')" class="invalid-feedback d-block">
                  Enter a valid email address.
                </div>
              </div>

              <div class="col-12">
                <label for="registerPassword" class="form-label">Password</label>
                <input
                  id="registerPassword"
                  type="password"
                  class="form-control form-control-lg"
                  formControlName="password"
                  autocomplete="new-password"
                  [class.is-invalid]="submitted && registerForm.get('password')?.invalid"
                />
                <div *ngIf="submitted && registerForm.get('password')?.hasError('required')" class="invalid-feedback d-block">
                  Password is required.
                </div>
                <div *ngIf="submitted && registerForm.get('password')?.hasError('minlength')" class="invalid-feedback d-block">
                  Password must be at least 8 characters long.
                </div>
              </div>

              <div class="col-12">
                <label for="confirmPassword" class="form-label">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control form-control-lg"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  [class.is-invalid]="submitted && (registerForm.get('confirmPassword')?.invalid || registerForm.hasError('passwordMismatch'))"
                />
                <div *ngIf="submitted && registerForm.get('confirmPassword')?.hasError('required')" class="invalid-feedback d-block">
                  Please confirm your password.
                </div>
                <div *ngIf="submitted && registerForm.hasError('passwordMismatch')" class="invalid-feedback d-block">
                  Passwords do not match.
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 mt-4" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          <div class="mt-4 text-center">
            <p class="mb-2 text-body-secondary">Already registered?</p>
            <button type="button" class="btn btn-outline-secondary w-100" (click)="goToLogin()">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .auth-page {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .auth-page__inner {
      max-width: 36rem;
      margin: 0 auto;
    }

    .auth-panel {
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: none;
    }

    .form-label {
      font-weight: 600;
    }

    .btn {
      min-height: 3rem;
    }

    @media (min-width: 768px) {
      .auth-panel {
        padding: 2rem;
      }
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  submitted = false;
  loading = false;
  errorMessage = '';

  readonly registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordsMatchValidator }
  );

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.registerForm.getRawValue();
    this.authService.register(
      payload.email ?? '',
      payload.password ?? '',
      payload.email ?? '',
      payload.firstName ?? '',
      payload.lastName ?? ''
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = this.readError(error, 'Unable to create your account right now.');
      }
    });
  }

  submit(): void {
    this.onSubmit();
  }

  register(): void {
    this.onSubmit();
  }

  createAccount(): void {
    this.onSubmit();
  }

  goToLogin(): void {
    this.router.navigateByUrl('/auth/login');
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword || password === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  }

  private readError(error: any, fallback: string): string {
    if (error?.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.detail) {
        return error.error.detail;
      }
      // Handle Django REST framework field errors (e.g. {"email": ["user with this email already exists."]})
      const firstKey = Object.keys(error.error)[0];
      if (firstKey && Array.isArray(error.error[firstKey])) {
        const fieldName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
        return `${fieldName}: ${error.error[firstKey][0]}`;
      }
    }
    return error?.message || fallback;
  }
}