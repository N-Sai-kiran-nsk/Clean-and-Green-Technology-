import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ManageIssuesComponent } from './manage-issues/manage-issues.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { DepartmentsComponent } from './departments/departments.component';

const routes: Routes = [
  { path: 'manage-issues', component: ManageIssuesComponent },
  { path: 'manage-users', component: ManageUsersComponent },
  { path: 'departments', component: DepartmentsComponent },
  { path: '', redirectTo: 'manage-issues', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ManageIssuesComponent,
    ManageUsersComponent,
    DepartmentsComponent
  ]
})
export class AdminModule { }
