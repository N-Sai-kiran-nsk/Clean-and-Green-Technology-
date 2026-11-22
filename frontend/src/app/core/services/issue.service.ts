import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IssueQuery {
  status?: string;
  priority?: string;
  search?: string;
  department?: number | string;
  category?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

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
  reported_by: number | object | null;
  assigned_to?: number | object | null;
  assigned_at?: string;
  assigned_by?: number | object | null;
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

  getIssues(query: IssueQuery = {}): Observable<any> {
    const raw: IssueQuery | string = query;
    const normalized: IssueQuery = typeof raw === 'string' ? { priority: raw } : (raw ?? {});

    let params = new HttpParams();
    const keys: Array<[keyof IssueQuery, string]> = [
      ['status', 'status'],
      ['priority', 'priority'],
      ['search', 'search'],
      ['department', 'department'],
      ['category', 'category'],
      ['ordering', 'ordering'],
      ['page', 'page'],
      ['pageSize', 'page_size'],
    ];

    keys.forEach(([key, param]) => {
      const value = normalized[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(param, String(value));
      }
    });

    return this.http.get<any>(`${this.apiUrl}/`, { params });
  }

  getIssue(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}/`);
  }

  createIssue(data: any, photos: File[] = [], legacyPhoto?: File | null): Observable<Issue> {
    const hasPhotoArray = Array.isArray(photos);
    const photoList: File[] = hasPhotoArray ? photos : [];
    const legacy = hasPhotoArray ? (legacyPhoto ?? null) : ((photos as unknown as File) ?? null);

    if (photoList.length > 0 || legacy) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      photoList.forEach(photo => formData.append('photos', photo, photo.name));
      if (legacy) {
        formData.append('photo', legacy, legacy.name);
      }
      return this.http.post<Issue>(`${this.apiUrl}/`, formData);
    }
    return this.http.post<Issue>(`${this.apiUrl}/`, data);
  }

  assignIssue(id: number, assignedTo: number | null): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/${id}/assign/`, { assigned_to: assignedTo });
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

  uploadAttachment(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/${id}/upload_attachment/`, formData);
  }
}
