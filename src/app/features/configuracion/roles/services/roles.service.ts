import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleDTO } from '../domain/role.dto';
import { Role } from '../domain/role.interface';
import { RoleAdapter } from '../domain/role.adapter';
import { ApiResponse } from '@shared/domains/api-response.model';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/auth/roles`;

    /**
     * Obtiene la lista de roles como recurso reactivo
     */
    getRolesResource(trigger: Signal<any>) {
        return httpResource<Role[]>(() => {
            trigger(); // Escuchamos el trigger para recargar
            return { url: this.apiUrl };
        }, {
            parse: (res) => RoleAdapter.adaptList((res as ApiResponse<RoleDTO[]>).data)
        });
    }

    getRoles(): Observable<ApiResponse<RoleDTO[]>> {
        return this.http.get<ApiResponse<RoleDTO[]>>(this.apiUrl);
    }

    createRole(role: Partial<Role>): Observable<ApiResponse<RoleDTO>> {
        return this.http.post<ApiResponse<RoleDTO>>(this.apiUrl, role);
    }

    updateRole(id: number, role: Partial<Role>): Observable<ApiResponse<RoleDTO>> {
        return this.http.put<ApiResponse<RoleDTO>>(`${this.apiUrl}/${id}`, role);
    }

    deleteRole(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
