import { NgModule } from '@angular/core';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IssueListComponent } from './issue-list/issue-list.component';
import { IssueDetailComponent } from './issue-detail/issue-detail.component';
import { ReportIssueComponent } from './report-issue/report-issue.component';

const routes: Routes = [
  { path: 'list', component: IssueListComponent },
  { path: 'detail/:id', component: IssueDetailComponent },
  { path: 'report', component: ReportIssueComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IssueListComponent,
    IssueDetailComponent,
    ReportIssueComponent
  ]
})
export class IssuesModule { }
