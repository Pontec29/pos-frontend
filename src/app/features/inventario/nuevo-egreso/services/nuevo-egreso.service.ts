import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { MovimientoSalidaPayload, MovimientoResumen } from '../modelo/nuevo-egreso.model';

/**
 * Servicio para gestión de notas de salida de inventario.
 */
@Injectable({
    providedIn: 'root'
})
export class NuevoEgresoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/movimientos`;

    /**
     * Lista todas las notas de salida
     */
    listarSalidas(): Observable<ApiResponse<MovimientoResumen[]>> {
        return this.http.get<ApiResponse<MovimientoResumen[]>>(`${this.apiUrl}/tipo/SALIDA`);
    }

    /**
     * Registra una nueva nota de salida
     */
    registrarSalida(payload: MovimientoSalidaPayload): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/salida`, payload);
    }
}
