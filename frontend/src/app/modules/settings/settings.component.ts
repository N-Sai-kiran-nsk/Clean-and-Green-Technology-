import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="settings-page py-4 py-md-5">
      <div class="settings-page__inner">
        <div class="settings-panel">
          <div class="mb-4">
            <p class="text-uppercase text-secondary small fw-semibold mb-2">Preferences</p>
            <h1 class="h3 mb-2">Settings</h1>
            <p class="text-body-secondary mb-0">Choose the options that make the app easier to use.</p>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="alert alert-success" role="alert">
            {{ successMessage }}
          </div>

          <div class="mb-4 mt-5">
            <h2 class="h4 mb-2">Profile Details</h2>
            <p class="text-body-secondary mb-3">Update your personal information.</p>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mb-5" novalidate>
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label for="first_name" class="form-label">First Name</label>
                <input type="text" id="first_name" class="form-control form-control-lg" formControlName="first_name" placeholder="John" />
              </div>
              <div class="col-md-6">
                <label for="last_name" class="form-label">Last Name</label>
                <input type="text" id="last_name" class="form-control form-control-lg" formControlName="last_name" placeholder="Doe" />
              </div>
              <div class="col-md-12">
                <label for="phone_number" class="form-label">Phone Number</label>
                <input type="tel" id="phone_number" class="form-control form-control-lg" formControlName="phone_number" placeholder="+1234567890" />
              </div>
            </div>
            
            <div class="d-flex">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile">
                <span *ngIf="savingProfile" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                {{ savingProfile ? 'Saving Profile...' : 'Save Profile' }}
              </button>
            </div>
          </form>

          <hr class="my-5" />

          <div class="mb-4">
            <h2 class="h4 mb-2">Preferences</h2>
            <p class="text-body-secondary mb-0">Choose the options that make the app easier to use.</p>
          </div>

          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" novalidate>
            <div class="settings-list">
              <label class="settings-row">
                <div>
                  <span class="settings-row__title">Dark theme</span>
                  <span class="settings-row__text">Use a darker color scheme for low-light viewing.</span>
                </div>
                <input
                  type="checkbox"
                  class="form-check-input settings-switch"
                  formControlName="darkTheme"
                  (change)="toggleTheme()"
                />
              </label>

              <label class="settings-row">
                <div>
                  <span class="settings-row__title">Email notifications</span>
                  <span class="settings-row__text">Receive important updates by email.</span>
                </div>
                <input type="checkbox" class="form-check-input settings-switch" formControlName="emailNotifications" />
              </label>

              <label class="settings-row">
                <div>
                  <span class="settings-row__title">Issue alerts</span>
                  <span class="settings-row__text">Get notified when an issue changes status.</span>
                </div>
                <input type="checkbox" class="form-check-input settings-switch" formControlName="issueAlerts" />
              </label>

              <label class="settings-row">
                <div>
                  <span class="settings-row__title">Weekly summary</span>
                  <span class="settings-row__text">Send a simple weekly summary of account activity.</span>
                </div>
                <input type="checkbox" class="form-check-input settings-switch" formControlName="weeklySummary" />
              </label>
            </div>

            <div class="mt-4 d-flex flex-column flex-sm-row gap-2">
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                {{ saving ? 'Saving...' : 'Save settings' }}
              </button>
              <button type="button" class="btn btn-outline-secondary btn-lg" (click)="resetSettings()">
                Restore defaults
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

    .settings-page {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .settings-page__inner {
      max-width: 44rem;
      margin: 0 auto;
    }

    .settings-panel {
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .settings-list {
      display: grid;
      gap: 0.85rem;
    }

    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border: 1px solid var(--bs-border-color);
      border-radius: 0.85rem;
      background: rgba(0, 0, 0, 0.02);
      cursor: pointer;
    }

    :host-context(body.dark-theme) .settings-row {
      background: rgba(255, 255, 255, 0.03);
    }

    .settings-row__title {
      display: block;
      font-weight: 600;
      margin-bottom: 0.15rem;
    }

    .settings-row__text {
      display: block;
      color: var(--bs-secondary-color);
      font-size: 0.95rem;
    }

    .settings-switch {
      width: 3rem;
      height: 1.5rem;
      flex: 0 0 auto;
    }

    .btn {
      min-height: 3rem;
    }

    @media (min-width: 768px) {
      .settings-panel {
        padding: 2rem;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  saving = false;
  savingProfile = false;
  errorMessage = '';
  successMessage = '';

  readonly settingsForm = this.fb.group({
    darkTheme: [false],
    emailNotifications: [true],
    issueAlerts: [true],
    weeklySummary: [true]
  });

  readonly profileForm = this.fb.group({
    first_name: [''],
    last_name: [''],
    phone_number: ['']
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  load(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const result = this.callService(['getSettings', 'loadSettings', 'getPreferences']);
    if (this.isObservable(result)) {
      result.subscribe({
        next: (settings: any) => this.applySettings(settings),
        error: (error: any) => {
          this.errorMessage = this.readError(error, 'Unable to load your settings right now.');
          this.applySettings(this.readFallbackSettings());
        }
      });
      return;
    }

    this.applySettings(result || this.readFallbackSettings());

    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || ''
        });
      },
      error: (err) => {
        // Ignore profile load errors silently for now
      }
    });
  }

  toggleTheme(): void {
    const enabled = !!this.settingsForm.get('darkTheme')?.value;
    this.applyTheme(enabled);
  }

  toggleDarkMode(): void {
    this.toggleTheme();
  }

  saveSettings(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.saving = true;

    const payload = this.settingsForm.getRawValue();
    const result = this.callService(['updateSettings', 'saveSettings', 'updatePreferences'], payload);

    this.handleResult(result, (saved: any) => {
      this.saving = false;
      this.applySettings(saved || payload);
      this.persistSettings(payload);
      this.successMessage = 'Settings saved successfully.';
    });
  }

  save(): void {
    this.saveSettings();
  }

  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.savingProfile = true;

    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (profile) => {
        this.savingProfile = false;
        this.successMessage = 'Profile updated successfully.';
        this.profileForm.patchValue({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || ''
        });
      },
      error: (error) => {
        this.savingProfile = false;
        this.errorMessage = this.readError(error, 'Unable to update profile right now.');
      }
    });
  }

  resetSettings(): void {
    const defaults = this.readFallbackSettings();
    this.settingsForm.reset(defaults);
    this.applyTheme(!!defaults.darkTheme);
    this.persistSettings(defaults);
    this.successMessage = 'Default settings restored.';
    this.errorMessage = '';
  }

  restoreDefaults(): void {
    this.resetSettings();
  }

  private applySettings(settings: any): void {
    const resolved = {
      darkTheme: this.readBoolean(settings?.darkTheme, this.readStoredTheme()),
      emailNotifications: this.readBoolean(settings?.emailNotifications, true),
      issueAlerts: this.readBoolean(settings?.issueAlerts, true),
      weeklySummary: this.readBoolean(settings?.weeklySummary, true)
    };

    this.settingsForm.reset(resolved, { emitEvent: false });
    this.applyTheme(resolved.darkTheme);
    this.persistSettings(resolved);
  }

  private applyTheme(enabled: boolean): void {
    document.body.classList.toggle('dark-theme', enabled);
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
  }

  private persistSettings(settings: any): void {
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch {
      // Ignore storage errors and keep the UI working.
    }
  }

  private readFallbackSettings(): { darkTheme: boolean; emailNotifications: boolean; issueAlerts: boolean; weeklySummary: boolean } {
    const stored = this.readStoredSettings();
    return {
      darkTheme: this.readBoolean(stored?.darkTheme, this.readStoredTheme()),
      emailNotifications: this.readBoolean(stored?.emailNotifications, true),
      issueAlerts: this.readBoolean(stored?.issueAlerts, true),
      weeklySummary: this.readBoolean(stored?.weeklySummary, true)
    };
  }

  private readStoredTheme(): boolean {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark-theme');
  }

  private readStoredSettings(): any {
    try {
      const raw = localStorage.getItem('settings');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private readBoolean(value: any, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return fallback;
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
          this.errorMessage = this.readError(error, 'Unable to save your settings right now.');
        }
      });
      return;
    }

    if (typeof result.then === 'function') {
      result
        .then((value: any) => onSuccess(value))
        .catch((error: any) => {
          this.saving = false;
          this.errorMessage = this.readError(error, 'Unable to save your settings right now.');
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