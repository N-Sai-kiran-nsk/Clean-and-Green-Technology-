import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  reported_by: number;
  assigned_to?: number;
  department?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachments?: any[];
  comments?: any[];
  upvotes_count?: number;
  has_upvoted?: boolean;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private get apiUrl() { return `${environment.apiUrl}/issues`; }

  constructor(private http: HttpClient) { }

  getIssues(status?: string, priority?: string): Observable<any> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);

    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  getIssue(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}/`);
  }

  createIssue(data: any): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/`, data);
  }

  updateIssue(id: number, data: any): Observable<Issue> {
    return this.http.patch<Issue>(`${this.apiUrl}/${id}/`, data);
  }

  deleteIssue(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }

  updateStatus(id: number, status: string): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/${id}/update_status/`, { status });
  }

  addComment(id: number, text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/add_comment/`, { text });
  }

  toggleUpvote(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/toggle_upvote/`, {});
  }
}
