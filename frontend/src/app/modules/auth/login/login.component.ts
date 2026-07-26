import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page py-4 py-md-5">
      <div class="auth-page__inner">
        <div class="auth-panel">
          <div class="mb-4">
            <p class="text-uppercase text-secondary small fw-semibold mb-2">Sign in</p>
            <h1 class="h3 mb-2">Welcome back</h1>
            <p class="text-body-secondary mb-0">Use your account email and password to continue.</p>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <div class="mb-3">
              <label for="loginEmail" class="form-label">Email address</label>
              <input
                id="loginEmail"
                type="email"
                class="form-control form-control-lg"
                formControlName="email"
                autocomplete="email"
                [class.is-invalid]="submitted && loginForm.get('email')?.invalid"
              />
              <div *ngIf="submitted && loginForm.get('email')?.hasError('required')" class="invalid-feedback d-block">
                Email address is required.
              </div>
              <div *ngIf="submitted && loginForm.get('email')?.hasError('email')" class="invalid-feedback d-block">
                Enter a valid email address.
              </div>
            </div>

            <div class="mb-3">
              <label for="loginPassword" class="form-label">Password</label>
              <input
                id="loginPassword"
                type="password"
                class="form-control form-control-lg"
                formControlName="password"
                autocomplete="current-password"
                [class.is-invalid]="submitted && loginForm.get('password')?.invalid"
              />
              <div *ngIf="submitted && loginForm.get('password')?.hasError('required')" class="invalid-feedback d-block">
                Password is required.
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>

            <div class="text-end mt-2">
              <a routerLink="/auth/forgot-password" class="text-decoration-none small text-muted">Forgot password?</a>
            </div>
          </form>

          <div class="mt-4 text-center">
            <p class="mb-2 text-body-secondary">Need an account?</p>
            <button type="button" class="btn btn-outline-secondary w-100" (click)="goToRegister()">
              Create account
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
      max-width: 32rem;
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  submitted = false;
  loading = false;
  errorMessage = '';

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.loginForm.getRawValue();
    const result = this.authService.login(payload.email ?? '', payload.password ?? '');

    this.handleResult(result, () => {
      this.loading = false;
      this.router.navigateByUrl('/dashboard');
    });
  }

  submit(): void {
    this.onSubmit();
  }

  login(): void {
    this.onSubmit();
  }

  signIn(): void {
    this.onSubmit();
  }

  goToRegister(): void {
    this.router.navigateByUrl('/auth/register');
  }


  private handleResult(result: any, onSuccess: () => void): void {
    if (!result) {
      onSuccess();
      return;
    }

    if (typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => onSuccess(),
        error: (error: any) => {
          this.loading = false;
          this.errorMessage = this.readError(error, 'Unable to sign in right now.');
        }
      });
      return;
    }

    if (typeof result.then === 'function') {
      result
        .then(() => onSuccess())
        .catch((error: any) => {
          this.loading = false;
          this.errorMessage = this.readError(error, 'Unable to sign in right now.');
        });
      return;
    }

    onSuccess();
  }

  private readError(error: any, fallback: string): string {
    if (error?.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.detail) {
        return error.error.detail;
      }
      if (error.error.non_field_errors?.[0]) {
        return error.error.non_field_errors[0];
      }
      if (error.error.message) {
        return error.error.message;
      }
      const firstKey = Object.keys(error.error)[0];
      if (firstKey && Array.isArray(error.error[firstKey])) {
        const fieldName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
        return `${fieldName}: ${error.error[firstKey][0]}`;
      }
    }
    return error?.message || fallback;
  }
}