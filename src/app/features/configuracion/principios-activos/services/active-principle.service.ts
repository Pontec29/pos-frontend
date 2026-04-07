import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActivePrinciple, ActivePrincipleRequest } from '../../../../core/models/inventory.model';
import { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ActivePrincipleService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/active-principles`;

    /**
     * Listar todos los principios activos
     */
    getAll(): Observable<ApiResponse<ActivePrinciple[]>> {
        return this.http.get<ApiResponse<ActivePrinciple[]>>(this.apiUrl);
    }

    /**
     * Buscar principios activos por nombre
     */
    search(name: string): Observable<ApiResponse<ActivePrinciple[]>> {
        const params = new HttpParams().set('name', name);
        return this.http.get<ApiResponse<ActivePrinciple[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener principio activo por ID
     */
    getById(id: number): Observable<ApiResponse<ActivePrinciple>> {
        return this.http.get<ApiResponse<ActivePrinciple>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nuevo principio activo
     */
    create(principle: ActivePrincipleRequest): Observable<ApiResponse<ActivePrinciple>> {
        return this.http.post<ApiResponse<ActivePrinciple>>(this.apiUrl, principle);
    }

    /**
     * Actualizar principio activo
     */
    update(id: number, principle: ActivePrincipleRequest): Observable<ApiResponse<ActivePrinciple>> {
        return this.http.put<ApiResponse<ActivePrinciple>>(`${this.apiUrl}/${id}`, principle);
    }

    /**
     * Eliminar principio activo (soft delete)
     */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
