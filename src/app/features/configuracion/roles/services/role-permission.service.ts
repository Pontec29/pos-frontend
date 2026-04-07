import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '@shared/domains/api-response.model';


export interface RolePermission {
    id?: number;
    roleId: number;
    empresaModuloId: number;
    active: boolean;
}

export interface RoleMatrix {
    moduloId: number;
    empresaModuloId: number;
    label: string;
    icon: string;
    ruta: string;
    orden: number;
    rolesAccess: { [roleId: number]: boolean };
    items: RoleMatrix[];
}

@Injectable({
    providedIn: 'root'
})
export class RolePermissionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1/auth/role-modules`;

    getPermissionMatrix(tenantId: number, roleIds: number[]): Observable<ApiResponse<RoleMatrix[]>> {
        return this.http.get<ApiResponse<RoleMatrix[]>>(`${this.apiUrl}/matrix`, {
            params: {
                tenantId: tenantId.toString(),
                roleIds: roleIds.join(',')
            }
        });
    }

    upsert(permission: Partial<RolePermission>): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(this.apiUrl, null, {
            params: {
                roleId: permission.roleId!.toString(),
                empresaModuloId: permission.empresaModuloId!.toString(),
                activo: permission.active?.toString() || 'false'
            }
        });
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
