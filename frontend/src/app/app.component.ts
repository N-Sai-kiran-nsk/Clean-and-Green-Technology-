import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { UserProfile } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Civic Issue Reporting System';
  user: UserProfile | null = null;
  isAuthenticated = false;
  isDarkMode = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user: UserProfile | null) => {
      this.user = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });
    this.checkAuth();
    // Check saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
      this.toggleTheme(true);
    }
    // Keep in sync when Settings page changes the theme
    window.addEventListener('storage', () => {
      const dark = localStorage.getItem('theme') === 'dark';
      if (dark !== this.isDarkMode) {
        this.isDarkMode = dark;
      }
    });
  }

  toggleTheme(forceDark?: boolean): void {
    this.isDarkMode = forceDark !== undefined ? forceDark : !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  checkAuth(): void {
    this.user = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
