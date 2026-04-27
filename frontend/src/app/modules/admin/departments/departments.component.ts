import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService, Department } from '../../../core/services/department.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="screen">
      <header class="dashboard-header">
        <span class="pill">Department Administration</span>
        <h1 class="page-title">Manage Departments</h1>
        <p class="page-subtitle">Create, update, and retire departments while keeping contact details organized.</p>
      </header>

      <div class="page-stack">
        <section class="card-surface">
          <div class="section-header page-stack__row mb-4">
            <div>
              <h2 class="section-header__title">Department directory</h2>
              <p class="text-muted mb-0">Track status, contacts, and issue routing ownership.</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="showForm = !showForm">
              <i class="bi me-1" [ngClass]="showForm ? 'bi-x-lg' : 'bi-plus-lg'"></i>
              {{ showForm ? 'Hide Form' : 'Add Department' }}
            </button>
          </div>

          <div *ngIf="loading" class="d-flex justify-content-center py-5">
            <div class="spinner-border" role="status" aria-label="Loading departments"></div>
          </div>

          <div *ngIf="!loading && departments.length === 0" class="empty-state">
            <i class="bi bi-building"></i>
            <h3 class="h5 mb-0">No departments found</h3>
            <p class="mb-0">Add a department to start managing civic issue routing and contact details.</p>
            <button type="button" class="btn btn-primary" (click)="showForm = true">Add Department</button>
          </div>

          <div *ngIf="!loading && departments.length > 0" class="table-responsive">
            <table class="table table-hover align-middle mb-0 department-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let dept of departments">
                  <td class="department-cell department-cell--title">{{ dept.name }}</td>
                  <td class="department-cell text-break">{{ dept.email }}</td>
                  <td class="department-cell text-break">{{ dept.phone }}</td>
                  <td>
                    <span class="badge" [ngClass]="dept.is_active ? 'badge-success' : 'badge-secondary'">
                      {{ dept.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="department-actions">
                      <button class="btn btn-sm btn-outline-secondary" (click)="editDepartment(dept)">
                        <i class="bi bi-pencil-square me-1"></i>
                        Edit
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteDepartment(dept)">
                        <i class="bi bi-trash3 me-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section *ngIf="showForm" class="card-surface">
          <div class="section-header page-stack__row mb-4">
            <div>
              <h2 class="section-header__title">{{ editingDept ? 'Edit Department' : 'Add New Department' }}</h2>
              <p class="text-muted mb-0">Keep contact and status information current.</p>
            </div>
            <span class="pill">{{ editingDept ? 'Editing' : 'New Entry' }}</span>
          </div>

          <form [formGroup]="departmentForm" (ngSubmit)="saveDepartment()" class="page-stack">
            <div class="page-stack__group">
              <label for="name" class="form-label">Department Name *</label>
              <input
                type="text"
                class="form-control"
                id="name"
                formControlName="name"
                [class.is-invalid]="isFieldInvalid('name')"
                placeholder="Department name">
              <div class="invalid-feedback" *ngIf="isFieldInvalid('name')">
                Name is required
              </div>
            </div>

            <div class="page-stack__group">
              <label for="email" class="form-label">Email *</label>
              <input
                type="email"
                class="form-control"
                id="email"
                formControlName="email"
                [class.is-invalid]="isFieldInvalid('email')"
                placeholder="Email address">
              <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">
                Valid email is required
              </div>
            </div>

            <div class="page-stack__group">
              <label for="phone" class="form-label">Phone *</label>
              <input
                type="tel"
                class="form-control"
                id="phone"
                formControlName="phone"
                [class.is-invalid]="isFieldInvalid('phone')"
                placeholder="Phone number">
              <div class="invalid-feedback" *ngIf="isFieldInvalid('phone')">
                Phone is required
              </div>
            </div>

            <div class="page-stack__group">
              <label for="address" class="form-label">Address *</label>
              <textarea
                class="form-control"
                id="address"
                formControlName="address"
                [class.is-invalid]="isFieldInvalid('address')"
                rows="3"
                placeholder="Department address"></textarea>
              <div class="invalid-feedback" *ngIf="isFieldInvalid('address')">
                Address is required
              </div>
            </div>

            <div class="page-stack__group">
              <label for="contact" class="form-label">Contact Person *</label>
              <input
                type="text"
                class="form-control"
                id="contact"
                formControlName="contact_person"
                [class.is-invalid]="isFieldInvalid('contact_person')"
                placeholder="Contact person name">
              <div class="invalid-feedback" *ngIf="isFieldInvalid('contact_person')">
                Contact person is required
              </div>
            </div>

            <div class="page-stack__group">
              <label for="description" class="form-label">Description</label>
              <textarea
                class="form-control"
                id="description"
                formControlName="description"
                rows="2"
                placeholder="Department description"></textarea>
            </div>

            <div class="page-stack__group">
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="active"
                  formControlName="is_active">
                <label class="form-check-label" for="active">
                  Active
                </label>
              </div>
            </div>

            <div class="page-stack__row">
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ saving ? 'Saving...' : 'Save Department' }}
              </button>
              <button type="button" class="btn btn-outline-secondary" (click)="clearForm()">
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .department-table th {
      white-space: nowrap;
    }

    .department-table td {
      vertical-align: middle;
    }

    .department-cell--title {
      font-weight: 700;
      color: var(--text);
    }

    .department-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .department-actions .btn {
      white-space: nowrap;
    }

    .form-check {
      padding-left: 1.5rem;
    }

    .form-check-input {
      margin-top: 0.35rem;
    }

    @media (max-width: 767px) {
      .department-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .department-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DepartmentsComponent implements OnInit {
  departments: Department[] = [];
  departmentForm: FormGroup;
  loading = true;
  saving = false;
  showForm = false;
  editingDept: Department | null = null;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService
  ) {
    this.departmentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      contact_person: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        this.departments = response.results || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editDepartment(dept: Department): void {
    this.editingDept = dept;
    this.departmentForm.patchValue(dept);
    this.showForm = true;
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) {
      return;
    }

    this.saving = true;
    const data = this.departmentForm.value;

    if (this.editingDept) {
      this.departmentService.updateDepartment(this.editingDept.id, data).subscribe({
        next: () => {
          this.loadDepartments();
          this.clearForm();
          this.saving = false;
        },
        error: () => {
          alert('Failed to update department');
          this.saving = false;
        }
      });
    } else {
      this.departmentService.createDepartment(data).subscribe({
        next: () => {
          this.loadDepartments();
          this.clearForm();
          this.saving = false;
        },
        error: () => {
          alert('Failed to create department');
          this.saving = false;
        }
      });
    }
  }

  deleteDepartment(dept: Department): void {
    if (confirm(`Delete "${dept.name}"?`)) {
      this.departmentService.deleteDepartment(dept.id).subscribe({
        next: () => {
          this.departments = this.departments.filter(d => d.id !== dept.id);
        },
        error: () => {
          alert('Failed to delete department');
        }
      });
    }
  }

  clearForm(): void {
    this.departmentForm.reset({ is_active: true });
    this.editingDept = null;
    this.showForm = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.departmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
