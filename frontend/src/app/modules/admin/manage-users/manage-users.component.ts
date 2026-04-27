import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

interface AdminUser {
  id?: number | string;
  pk?: number | string;
  user_id?: number | string;
  username?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_superuser?: boolean;
  isSuperuser?: boolean;
  is_staff?: boolean;
  isStaff?: boolean;
  is_admin?: boolean;
  isAdmin?: boolean;
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="screen">
      <header class="dashboard-header">
        <div class="d-flex flex-column gap-2">
          <span class="pill">Admin users</span>
          <div>
            <h1 class="page-title mb-1">Manage users</h1>
            <p class="page-subtitle mb-0">
              Review civic platform accounts and grant or remove admin access.
            </p>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="pill">{{ users.length }} accounts</span>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            (click)="loadUsers()"
            [disabled]="loading || actionLoading"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </header>

      <div class="page-stack">
        <div class="page-stack__group" *ngIf="successMessage || errorMessage">
          <div *ngIf="successMessage" class="alert alert-success mb-0" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            {{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger mb-0" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ errorMessage }}
          </div>
        </div>

        <section class="card-surface">
          <div class="section-header">
            <div>
              <h2 class="h5 mb-1">Users</h2>
              <p class="text-body-secondary mb-0">
                Promote trusted users to admins or remove elevated access when needed.
              </p>
            </div>

            <span class="pill">{{ users.length }} total</span>
          </div>

          <div *ngIf="loading" class="empty-state">
            <div class="spinner-border text-primary" role="status" aria-label="Loading users"></div>
            <h3 class="h5 mb-2 mt-3">Loading users</h3>
            <p class="text-body-secondary mb-0">Fetching the latest account list.</p>
          </div>

          <ng-container *ngIf="!loading">
            <div *ngIf="users.length === 0" class="empty-state">
              <i class="bi bi-people display-6 text-body-secondary"></i>
              <h3 class="h5 mb-2 mt-3">No users found</h3>
              <p class="text-body-secondary mb-0">
                There are no user accounts available to manage right now.
              </p>
            </div>

            <div *ngIf="users.length > 0" class="table-responsive users-table-wrap">
              <table class="table align-middle mb-0 users-table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col" class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of users; trackBy: trackByUser">
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar" aria-hidden="true">
                          {{ getInitials(user) }}
                        </div>
                        <div class="user-copy">
                          <div class="fw-semibold text-break">
                            {{ getDisplayName(user) }}
                          </div>
                          <div class="text-body-secondary small text-break">
                            {{ getSecondaryLabel(user) }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="text-break">
                      {{ user.email || '—' }}
                    </td>

                    <td>
                      <span class="badge rounded-pill" [ngClass]="getRoleBadge(user)">
                        {{ getRoleLabel(user) }}
                      </span>
                    </td>

                    <td class="text-end">
                      <div class="d-inline-flex flex-wrap justify-content-end gap-2">
                        <button
                          *ngIf="!isSuperUser(user) && !isAdminUser(user)"
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          (click)="setAsAdmin(user)"
                          [disabled]="actionLoading"
                        >
                          <i class="bi bi-shield-plus me-1"></i>
                          Make admin
                        </button>

                        <button
                          *ngIf="!isSuperUser(user) && isAdminUser(user)"
                          type="button"
                          class="btn btn-outline-warning btn-sm"
                          (click)="removeAdmin(user)"
                          [disabled]="actionLoading"
                        >
                          <i class="bi bi-shield-lock me-1"></i>
                          Remove admin
                        </button>

                        <button
                          *ngIf="!isSuperUser(user)"
                          type="button"
                          class="btn btn-outline-danger btn-sm"
                          (click)="deleteUser(user)"
                          [disabled]="actionLoading"
                        >
                          <i class="bi bi-trash me-1"></i>
                          Delete
                        </button>

                        <span *ngIf="isSuperUser(user)" class="text-body-secondary small">
                          Superuser accounts are managed by the system.
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </section>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .users-table-wrap {
        overflow-x: auto;
      }

      .users-table {
        min-width: 46rem;
      }

      .users-table th,
      .users-table td {
        vertical-align: middle;
      }

      .users-table thead th {
        color: var(--bs-secondary-color);
        font-size: 0.875rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .users-table tbody tr + tr td {
        border-top-color: rgba(15, 23, 42, 0.08);
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
      }

      .user-avatar {
        width: 2.5rem;
        height: 2.5rem;
        flex: 0 0 auto;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--bs-primary-rgb), 0.1);
        color: var(--bs-primary);
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .user-copy {
        min-width: 0;
      }

      .users-table .badge {
        border-width: 1px;
        font-weight: 600;
      }

      .users-table td:last-child {
        min-width: 12rem;
      }

      .users-table td:last-child .btn {
        white-space: nowrap;
      }

      .empty-state {
        padding: 2.5rem 1.25rem;
      }

      .alert {
        border-radius: 1rem;
      }

      @media (max-width: 575.98px) {
        .users-table {
          min-width: 42rem;
        }

        .user-avatar {
          width: 2.25rem;
          height: 2.25rem;
        }
      }
    `,
  ],
})
export class ManageUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    const request$ = this.resolveObservable([
      { methodName: 'getUsers' },
      { methodName: 'getAllUsers' },
      { methodName: 'loadUsers' },
      { methodName: 'fetchUsers' },
    ]);
    if (!request$) {
      this.users = [];
      this.loading = false;
      this.errorMessage = 'Unable to load users right now.';
      return;
    }

    request$.subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.users = response;
        } else if (response && Array.isArray(response.results)) {
          this.users = response.results;
        } else if (response && Array.isArray(response.data)) {
          this.users = response.data;
        } else {
          this.users = [];
        }
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.loading = false;
        this.errorMessage = 'Unable to load users right now.';
      },
    });
  }

  setAsAdmin(user: AdminUser): void {
    this.updateAdminStatus(user, true);
  }

  removeAdmin(user: AdminUser): void {
    this.updateAdminStatus(user, false);
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`Are you sure you want to delete ${this.getDisplayName(user)}? This action cannot be undone.`)) {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userId = user.id ?? user.pk ?? user.user_id;
    if (!userId) {
      this.actionLoading = false;
      this.errorMessage = 'Unable to identify user for deletion.';
      return;
    }

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMessage = `User ${this.getDisplayName(user)} has been deleted.`;
        this.loadUsers();
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage = 'Unable to delete user. Make sure you have the necessary permissions.';
      }
    });
  }

  getRoleBadge(user: AdminUser): string {
    if (this.isSuperUser(user)) {
      return 'bg-dark-subtle text-dark border border-dark-subtle';
    }

    if (this.isAdminUser(user)) {
      return 'bg-primary-subtle text-primary border border-primary-subtle';
    }

    return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }

  getRoleLabel(user: AdminUser): string {
    if (this.isSuperUser(user)) {
      return 'Superuser';
    }

    if (this.isAdminUser(user)) {
      return 'Admin';
    }

    return 'User';
  }

  trackByUser = (_: number, user: AdminUser): number | string => {
    return user.id ?? user.pk ?? user.user_id ?? user.username ?? user.email ?? _;
  };

  getDisplayName(user: AdminUser): string {
    return user.username || this.getFallbackName(user);
  }

  getSecondaryLabel(user: AdminUser): string {
    if (this.isSuperUser(user)) {
      return 'System account';
    }

    if (this.isAdminUser(user)) {
      return 'Elevated access';
    }

    return 'Standard account';
  }

  isAdminUser(user: AdminUser): boolean {
    const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
    return Boolean(role === 'admin' || role === 'administrator' || user?.is_staff || user?.isStaff || user?.is_admin || user?.isAdmin);
  }

  isSuperUser(user: AdminUser): boolean {
    const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
    return Boolean(user?.is_superuser || user?.isSuperuser || role === 'superuser');
  }

  getInitials(user: AdminUser): string {
    const name = this.getDisplayName(user);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  private getFallbackName(user: AdminUser): string {
    const composedName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (composedName) {
      return composedName;
    }

    return user.name || user.email || 'Unnamed user';
  }

  private updateAdminStatus(user: AdminUser, makeAdmin: boolean): void {
    this.actionLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const target = user.id ?? user.pk ?? user.user_id ?? user.username ?? user.email;
    const request$ = makeAdmin
      ? this.resolveObservable([
          { methodName: 'setAsAdmin', args: [user] },
          { methodName: 'setAsAdmin', args: [target] },
          { methodName: 'makeAdmin', args: [user] },
          { methodName: 'makeAdmin', args: [target] },
          { methodName: 'promoteToAdmin', args: [user] },
          { methodName: 'promoteToAdmin', args: [target] },
          { methodName: 'updateUserRole', args: [target, true] },
          { methodName: 'updateUserRole', args: [user, true] },
          { methodName: 'toggleAdmin', args: [target, true] },
          { methodName: 'toggleAdmin', args: [user, true] },
        ])
      : this.resolveObservable([
          { methodName: 'removeAdmin', args: [user] },
          { methodName: 'removeAdmin', args: [target] },
          { methodName: 'removeAdminPrivilege', args: [user] },
          { methodName: 'removeAdminPrivilege', args: [target] },
          { methodName: 'demoteAdmin', args: [user] },
          { methodName: 'demoteAdmin', args: [target] },
          { methodName: 'updateUserRole', args: [target, false] },
          { methodName: 'updateUserRole', args: [user, false] },
          { methodName: 'toggleAdmin', args: [target, false] },
          { methodName: 'toggleAdmin', args: [user, false] },
        ]);

    if (!request$) {
      this.actionLoading = false;
      this.errorMessage = makeAdmin
        ? 'Unable to grant admin access right now.'
        : 'Unable to remove admin access right now.';
      return;
    }

    request$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMessage = makeAdmin
          ? this.getDisplayName(user) + ' has been granted admin access.'
          : this.getDisplayName(user) + ' is no longer an admin.';
        this.loadUsers();
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage = makeAdmin
          ? 'Unable to grant admin access right now.'
          : 'Unable to remove admin access right now.';
      },
    });
  }

  private resolveObservable(
    candidates: Array<{
      methodName: string;
      args?: unknown[];
    }>
  ): any {
    const service = this.authService as any;

    for (const candidate of candidates) {
      const method = service?.[candidate.methodName];
      if (typeof method !== 'function') {
        continue;
      }

      try {
        const result = method.apply(service, candidate.args ?? []);
        if (result && typeof result.subscribe === 'function') {
          return result;
        }
      } catch {
        continue;
      }
    }

    return null;
  }
}
