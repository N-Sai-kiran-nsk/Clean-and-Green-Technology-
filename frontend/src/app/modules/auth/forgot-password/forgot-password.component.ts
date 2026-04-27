import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container-xl d-flex align-items-center justify-content-center" style="min-height: 80vh;">
      <div class="card border-0 shadow-sm rounded-4 w-100" style="max-width: 450px;">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <h1 class="h3 fw-bold mb-2">Forgot Password</h1>
            <p class="text-secondary">Enter your email and we'll send you a reset link.</p>
          </div>

          <div *ngIf="successMessage" class="alert alert-success text-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <form *ngIf="!successMessage" [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="email" class="form-label fw-medium">Email address</label>
              <input type="email" id="email" class="form-control form-control-lg bg-light" formControlName="email" placeholder="name@example.com" required>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" [disabled]="forgotForm.invalid || loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <div class="text-center">
              <a routerLink="/auth/login" class="text-decoration-none text-muted">Back to Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotForm.value.email as string;

    this.authService.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'If an account with that email exists, we have sent a password reset link.';
      },
      error: () => {
        this.loading = false;
        // Do not reveal if email exists or not
        this.successMessage = 'If an account with that email exists, we have sent a password reset link.';
      }
    });
  }
}
