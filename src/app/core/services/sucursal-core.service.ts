import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { SucursalDTO, SucursalOption } from '../../features/configuracion/sucursales/models/sucursal.type';

/**
 * Servicio compartido para consultar sucursales.
 * Usado por cualquier módulo que necesite un select de sucursales.
 */
@Injectable({
    providedIn: 'root'
})
export class SucursalCoreService {

    private readonly apiUrl = `${environment.apiUrl}/api/v1/auth/sucursales`;
    private readonly http = inject(HttpClient);

    /** Obtiene las sucursales activas (para selects) */
    getActivas(): Observable<ApiResponse<SucursalOption[]>> {
        return this.http.get<ApiResponse<SucursalDTO[]>>(this.apiUrl).pipe(
            map((res) => ({
                ...res,
                data: res.data.map(dto => ({
                    id: dto.id,
                    nombre: dto.nombre
                }))
            }))
        );
    }

    /** Obtiene todas las sucursales (incluidas inactivas) */
    getAll(): Observable<ApiResponse<SucursalDTO[]>> {
        return this.http.get<ApiResponse<SucursalDTO[]>>(`${this.apiUrl}/todas`);
    }

    /** Obtiene una sucursal por su ID */
    getById(id: number): Observable<ApiResponse<SucursalDTO>> {
        return this.http.get<ApiResponse<SucursalDTO>>(`${this.apiUrl}/${id}`);
    }
}
