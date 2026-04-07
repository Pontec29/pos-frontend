import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { PharmacologicalAction, PharmacologicalActionRequest } from '@core/models/inventory.model';

@Injectable({
    providedIn: 'root'
})
export class PharmacologicalActionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/pharmacological-actions`;

    /**
     * Listar todas las acciones farmacológicas activas
     */
    getAll(): Observable<ApiResponse<PharmacologicalAction[]>> {
        return this.http.get<ApiResponse<PharmacologicalAction[]>>(this.apiUrl);
    }

    /**
     * Obtener acción farmacológica por ID
     */
    getById(id: number): Observable<ApiResponse<PharmacologicalAction>> {
        return this.http.get<ApiResponse<PharmacologicalAction>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nueva acción farmacológica
     */
    create(action: PharmacologicalActionRequest): Observable<ApiResponse<PharmacologicalAction>> {
        return this.http.post<ApiResponse<PharmacologicalAction>>(this.apiUrl, action);
    }

    /**
     * Actualizar acción farmacológica
     */
    update(id: number, action: PharmacologicalActionRequest): Observable<ApiResponse<PharmacologicalAction>> {
        return this.http.put<ApiResponse<PharmacologicalAction>>(`${this.apiUrl}/${id}`, action);
    }

    /**
     * Eliminar acción farmacológica (soft delete)
     */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
