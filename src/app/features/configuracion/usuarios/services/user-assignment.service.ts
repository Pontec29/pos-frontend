import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import {
  UserAssignment,
  CreateAssignmentRequest
} from '../components/user-assignments/user-assignments';

@Injectable({
  providedIn: 'root'
})
export class UserAssignmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/auth/users`;

  getUserAssignments(userId: number): Observable<ApiResponse<UserAssignment[]>> {
    const url = `${environment.apiUrl}/api/v1/user-company/list/${userId}`;
    return this.http.get<ApiResponse<UserAssignment[]>>(url);
  }

  assignUserToCompany(userId: number, companyId: number, roleId: number, defaultCompany: boolean = false): Observable<ApiResponse<UserAssignment>> {
    const url = `${environment.apiUrl}/api/v1/user-company/assign/${userId}/${companyId}/${roleId}`;
    return this.http.post<ApiResponse<UserAssignment>>(url, {}, {
      params: {
        default: defaultCompany.toString()
      }
    });
  }

  updateAssignment(assignmentId: number, assignment: Partial<CreateAssignmentRequest>): Observable<ApiResponse<UserAssignment>> {
    return this.http.put<ApiResponse<UserAssignment>>(`${this.apiUrl}/assignments/${assignmentId}`, assignment);
  }

  removeUserCompany(userId: number, companyId: number): Observable<ApiResponse<void>> {
    const url = `${environment.apiUrl}/api/v1/user-company/assign/${userId}/${companyId}`;
    return this.http.delete<ApiResponse<void>>(url);
  }

  activateAssignment(assignmentId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/assignments/${assignmentId}/activate`, {});
  }

  deactivateAssignment(assignmentId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/assignments/${assignmentId}/deactivate`, {});
  }
}
