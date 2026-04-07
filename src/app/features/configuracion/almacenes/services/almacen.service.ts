import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { Almacen, AlmacenDTO, CreateAlmacenDTO } from '../domain/almacen.type';
import { AlmacenAdapter } from '../domain/almacen.adapter';

@Injectable({
    providedIn: 'root'
})
export class AlmacenService {

    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/almacenes`;
    private readonly http = inject(HttpClient);

    /** Obtiene todos los almacenes */
    getAll(): Observable<ApiResponse<Almacen[]>> {
        return this.http.get<ApiResponse<AlmacenDTO[]>>(this.apiUrl).pipe(
            map((res) => ({
                ...res,
                data: res.data.map(dto => AlmacenAdapter.toModel(dto))
            }))
        );
    }

    /** Obtiene un almacén por su ID */
    getById(id: number): Observable<ApiResponse<Almacen>> {
        return this.http.get<ApiResponse<AlmacenDTO>>(`${this.apiUrl}/${id}`).pipe(
            map((res) => ({
                ...res,
                data: AlmacenAdapter.toModel(res.data)
            }))
        );
    }

    /** Crea un nuevo almacén */
    create(dto: CreateAlmacenDTO): Observable<ApiResponse<Almacen>> {
        return this.http.post<ApiResponse<AlmacenDTO>>(this.apiUrl, dto).pipe(
            map((res) => ({
                ...res,
                data: AlmacenAdapter.toModel(res.data)
            }))
        );
    }

    /** Actualiza un almacén existente */
    update(id: number, dto: CreateAlmacenDTO): Observable<ApiResponse<Almacen>> {
        return this.http.put<ApiResponse<AlmacenDTO>>(`${this.apiUrl}/${id}`, dto).pipe(
            map((res) => ({
                ...res,
                data: AlmacenAdapter.toModel(res.data)
            }))
        );
    }

    /** Elimina un almacén (soft delete) */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }

    /** Manejo centralizado de errores HTTP */
    private handleHttpError(error: unknown): Observable<never> {
        const err = error as { error?: { message?: string }; message?: string };
        const message = err?.error?.message || err?.message || 'Error no controlado en el servicio de almacenes';
        return throwError(() => new Error(message));
    }
}
