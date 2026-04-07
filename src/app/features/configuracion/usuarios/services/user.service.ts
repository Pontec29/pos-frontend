import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { User } from '../models/user.models';
import type { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1/users`;

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'X-Tenant-ID': '1'
        });
    }

    getUsers(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(this.apiUrl, { headers: this.getHeaders() });
    }

    getUserById(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    createUser(user: Partial<User>): Observable<ApiResponse<User>> {
        // Prepare user data for API
        const createData = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            documentType: user.documentType,
            documentNumber: user.documentNumber,
            phone: user.phone,
            password: user.password,
            active: user.active
        };
        return this.http.post<ApiResponse<User>>(this.apiUrl, createData, { headers: this.getHeaders() });
    }

    updateUser(id: number, user: Partial<User>): Observable<ApiResponse<User>> {
        // Prepare user data for API
        const updateData: any = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            documentType: user.documentType,
            documentNumber: user.documentNumber,
            phone: user.phone,
            active: user.active
        };

        // Only include password if it's provided and not empty
        if (user.password) {
            updateData.password = user.password;
        }

        return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, updateData, { headers: this.getHeaders() });
    }

    activateUser(id: number): Observable<ApiResponse<null>> {
        return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${id}/activate`, {}, { headers: this.getHeaders() });
    }

    deactivateUser(id: number): Observable<ApiResponse<null>> {
        return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${id}/deactivate`, {}, { headers: this.getHeaders() });
    }

    deleteUser(id: number): Observable<ApiResponse<null>> {
        return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}
