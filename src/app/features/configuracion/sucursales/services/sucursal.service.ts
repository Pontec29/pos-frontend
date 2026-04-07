import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { Sucursal, SucursalDTO, CreateSucursalDTO } from '../domain/sucursal.type';
import { SucursalAdapter } from '../domain/sucursal.adapter';

@Injectable({
    providedIn: 'root'
})
export class SucursalService {

    private readonly apiUrl = `${environment.apiUrl}/api/v1/auth/sucursales`;
    private readonly http = inject(HttpClient);

    /** Obtiene las sucursales activas */
    getActivas(): Observable<ApiResponse<Sucursal[]>> {
        return this.http.get<ApiResponse<SucursalDTO[]>>(this.apiUrl).pipe(
            map((res) => ({
                ...res,
                data: res.data.map(dto => SucursalAdapter.toModel(dto))
            }))
        );
    }

    /** Obtiene todas las sucursales (incluidas inactivas) */
    getAll(): Observable<ApiResponse<Sucursal[]>> {
        return this.http.get<ApiResponse<SucursalDTO[]>>(`${this.apiUrl}/todas`).pipe(
            map((res) => ({
                ...res,
                data: res.data.map(dto => SucursalAdapter.toModel(dto))
            }))
        );
    }

    /** Obtiene una sucursal por su ID */
    getById(id: number): Observable<ApiResponse<Sucursal>> {
        return this.http.get<ApiResponse<SucursalDTO>>(`${this.apiUrl}/${id}`).pipe(
            map((res) => ({
                ...res,
                data: SucursalAdapter.toModel(res.data)
            }))
        );
    }

    /** Crea una nueva sucursal */
    create(dto: CreateSucursalDTO): Observable<ApiResponse<Sucursal>> {
        return this.http.post<ApiResponse<SucursalDTO>>(this.apiUrl, dto).pipe(
            map((res) => ({
                ...res,
                data: SucursalAdapter.toModel(res.data)
            }))
        );
    }

    /** Actualiza una sucursal existente */
    update(id: number, dto: CreateSucursalDTO): Observable<ApiResponse<Sucursal>> {
        return this.http.put<ApiResponse<SucursalDTO>>(`${this.apiUrl}/${id}`, dto).pipe(
            map((res) => ({
                ...res,
                data: SucursalAdapter.toModel(res.data)
            }))
        );
    }

    /** Elimina una sucursal (soft delete con PATCH) */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}`, {});
    }
}
