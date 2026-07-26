import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  contact_person: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private get apiUrl() { return `${environment.apiUrl}/departments`; }

  constructor(private http: HttpClient) { }

  getDepartments(): Observable<DepartmentResponse> {
    return this.http.get<DepartmentResponse>(`${this.apiUrl}/`);
  }

  getDepartment(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}/`);
  }

  createDepartment(department: any): Observable<Department> {
    return this.http.post<Department>(`${this.apiUrl}/`, department);
  }

  updateDepartment(id: number, department: any): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${id}/`, department);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  getActiveDepartments(): Observable<DepartmentResponse> {
    return this.http.get<DepartmentResponse>(`${this.apiUrl}/`, { params: { is_active: true } });
  }
}
