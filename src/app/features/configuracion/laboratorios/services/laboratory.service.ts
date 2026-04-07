import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { Laboratory, LaboratoryRequest } from '@core/models/inventory.model';

@Injectable({
    providedIn: 'root'
})
export class LaboratoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/laboratories`;

    /**
     * Listar todos los laboratorios activos
     */
    getAll(): Observable<ApiResponse<Laboratory[]>> {
        return this.http.get<ApiResponse<Laboratory[]>>(this.apiUrl);
    }

    /**
     * Obtener laboratorio por ID
     */
    getById(id: number): Observable<ApiResponse<Laboratory>> {
        return this.http.get<ApiResponse<Laboratory>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nuevo laboratorio
     */
    create(laboratory: LaboratoryRequest): Observable<ApiResponse<Laboratory>> {
        return this.http.post<ApiResponse<Laboratory>>(this.apiUrl, laboratory);
    }

    /**
     * Actualizar laboratorio
     */
    update(id: number, laboratory: LaboratoryRequest): Observable<ApiResponse<Laboratory>> {
        return this.http.put<ApiResponse<Laboratory>>(`${this.apiUrl}/${id}`, laboratory);
    }

    /**
     * Eliminar laboratorio (soft delete)
     */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
