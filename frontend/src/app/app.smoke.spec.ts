import { Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  it('should expose the expected application title', () => {
    const authService = {} as AuthService;
    const router = {} as Router;
    const component = new AppComponent(authService, router);

    expect(component.title).toBe('Civic Issue Reporting System');
  });
});
