import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-manage-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="screen page-stack py-4 py-md-5">
      <div class="container-xl">
        <header class="mb-4">
          <p class="text-uppercase text-muted small mb-1">Administration</p>
          <h1 class="h3 mb-2">Manage Departments</h1>
          <p class="text-secondary mb-0">Create, edit, and remove civic departments.</p>
        </header>

        <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <div *ngIf="successMessage" class="alert alert-success" role="alert">
          {{ successMessage }}
        </div>

        <div class="row g-4">
          <!-- Department List -->
          <div class="col-12 col-lg-8">
            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-0">
                <div *ngIf="loading" class="p-5 text-center text-secondary">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>

                <div *ngIf="!loading && departments.length === 0" class="p-5 text-center text-muted empty-state">
                  <i class="bi bi-building fs-1 d-block mb-3 opacity-50"></i>
                  No departments found.
                </div>

                <div class="table-responsive" *ngIf="!loading && departments.length > 0">
                  <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th scope="col" class="ps-4">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col" class="text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let dept of departments">
                        <td class="ps-4 fw-semibold">{{ dept.name }}</td>
                        <td>{{ dept.description || '-' }}</td>
                        <td>{{ dept.email || '-' }}</td>
                        <td>{{ dept.phone_number || '-' }}</td>
                        <td class="text-end pe-4">
                          <button class="btn btn-sm btn-outline-danger" (click)="deleteDepartment(dept.id)" [disabled]="isDeleting === dept.id">
                            <span *ngIf="isDeleting === dept.id" class="spinner-border spinner-border-sm me-1"></span>
                            <i *ngIf="isDeleting !== dept.id" class="bi bi-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Department Form -->
          <div class="col-12 col-lg-4">
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-4">
                <h4 class="mb-4 h5 fw-bold">Add New Department</h4>
                <form [formGroup]="deptForm" (ngSubmit)="createDepartment()">
                  <div class="mb-3">
                    <label class="form-label">Department Name*</label>
                    <input type="text" class="form-control" formControlName="name" placeholder="e.g. Public Works" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" formControlName="description" rows="3" placeholder="Brief description of responsibilities"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Contact Email</label>
                    <input type="email" class="form-control" formControlName="email" placeholder="contact@example.com">
                  </div>
                  <div class="mb-4">
                    <label class="form-label">Phone Number</label>
                    <input type="text" class="form-control" formControlName="phone_number" placeholder="123-456-7890">
                  </div>
                  <div class="d-grid">
                    <button type="submit" class="btn btn-primary" [disabled]="deptForm.invalid || isCreating">
                      <span *ngIf="isCreating" class="spinner-border spinner-border-sm me-2"></span>
                      {{ isCreating ? 'Creating...' : 'Create Department' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ManageDepartmentsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private get apiUrl() { return `${environment.apiUrl}/departments/`; }

  departments: any[] = [];
  loading = false;
  isCreating = false;
  isDeleting: number | null = null;
  errorMessage = '';
  successMessage = '';

  deptForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    email: [''],
    phone_number: ['']
  });

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.errorMessage = '';
    
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        // Handle pagination wrapping if it exists
        this.departments = Array.isArray(res) ? res : (res.results || res.data || []);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load departments. Please try again.';
        this.loading = false;
      }
    });
  }

  createDepartment() {
    if (this.deptForm.invalid) return;

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(this.apiUrl, this.deptForm.value).subscribe({
      next: (newDept) => {
        this.isCreating = false;
        this.successMessage = 'Department created successfully!';
        this.deptForm.reset();
        this.departments.push(newDept);
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isCreating = false;
        this.errorMessage = err.error?.name?.[0] || 'Failed to create department. Check your inputs.';
      }
    });
  }

  deleteDepartment(id: number) {
    if (!confirm('Are you sure you want to delete this department? This might affect related issues.')) {
      return;
    }

    this.isDeleting = id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`${this.apiUrl}${id}/`).subscribe({
      next: () => {
        this.isDeleting = null;
        this.successMessage = 'Department deleted successfully.';
        this.departments = this.departments.filter(d => d.id !== id);
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isDeleting = null;
        this.errorMessage = 'Failed to delete department. It may have associated issues.';
      }
    });
  }
}
