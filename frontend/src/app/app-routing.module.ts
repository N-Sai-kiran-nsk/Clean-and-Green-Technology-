import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule) },
  { path: 'dashboard', canActivate: [AuthGuard], loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'issues', canActivate: [AuthGuard], loadChildren: () => import('./modules/issues/issues.module').then(m => m.IssuesModule) },
  { path: 'admin', canActivate: [AdminGuard], loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule) },
  { path: 'settings', canActivate: [AuthGuard], loadChildren: () => import('./modules/settings/settings.module').then(m => m.SettingsModule) },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
