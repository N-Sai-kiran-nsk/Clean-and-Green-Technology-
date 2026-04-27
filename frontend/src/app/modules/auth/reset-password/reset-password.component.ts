import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container-xl d-flex align-items-center justify-content-center" style="min-height: 80vh;">
      <div class="card border-0 shadow-sm rounded-4 w-100" style="max-width: 450px;">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <h1 class="h3 fw-bold mb-2">Reset Password</h1>
            <p class="text-secondary">Enter your new password below.</p>
          </div>

          <div *ngIf="successMessage" class="alert alert-success text-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
            <div class="mt-3">
              <a routerLink="/auth/login" class="btn btn-primary btn-sm">Back to Login</a>
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <div *ngIf="!successMessage && !validLink" class="text-center py-3">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-1 d-block mb-3"></i>
            <p class="text-muted">This reset link is invalid or missing required parameters.</p>
            <a routerLink="/auth/forgot-password" class="btn btn-primary">Request a new link</a>
          </div>

          <form *ngIf="!successMessage && validLink" [formGroup]="resetForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="new_password" class="form-label fw-medium">New Password</label>
              <input type="password" id="new_password" class="form-control form-control-lg bg-light"
                formControlName="new_password" placeholder="Min. 6 characters" required>
              <div *ngIf="resetForm.get('new_password')?.invalid && resetForm.get('new_password')?.touched"
                class="text-danger small mt-1">Password must be at least 6 characters.</div>
            </div>

            <div class="mb-4">
              <label for="confirm_password" class="form-label fw-medium">Confirm Password</label>
              <input type="password" id="confirm_password" class="form-control form-control-lg bg-light"
                formControlName="confirm_password" placeholder="Re-enter new password" required>
              <div *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirm_password')?.touched"
                class="text-danger small mt-1">Passwords do not match.</div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100" [disabled]="resetForm.invalid || loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  uid = '';
  token = '';
  validLink = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  resetForm = this.fb.group({
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: any) {
    const pw = form.get('new_password')?.value;
    const cpw = form.get('confirm_password')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.uid = params['uid'] || '';
      this.token = params['token'] || '';
      this.validLink = !!(this.uid && this.token);
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.validLink) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      uid: this.uid,
      token: this.token,
      new_password: this.resetForm.value.new_password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Password has been reset successfully!';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'This reset link is invalid or has expired. Please request a new one.';
      }
    });
  }
}
