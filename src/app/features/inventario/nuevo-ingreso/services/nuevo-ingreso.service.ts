import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { MovimientoEntradaPayload, MovimientoResumenIngreso } from '../modelo/nuevo-ingreso.model';

@Injectable({
    providedIn: 'root'
})
export class NuevoIngresoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/movimientos`;

    /**
     * Lista todas las notas de ingreso
     */
    listarEntradas(): Observable<ApiResponse<MovimientoResumenIngreso[]>> {
        return this.http.get<ApiResponse<MovimientoResumenIngreso[]>>(`${this.apiUrl}/tipo/ENTRADA`);
    }

    /**
     * Registra una nueva nota de ingreso (como BORRADOR)
     */
    registrarIngreso(payload: MovimientoEntradaPayload): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/entrada`, payload);
    }

    /**
     * Registra una nota de ingreso y la procesa directamente (stock + kardex)
     */
    registrarIngresoDirecto(payload: MovimientoEntradaPayload): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/entrada/directa`, payload);
    }

    /**
     * Procesa un movimiento en estado BORRADOR (actualiza stock y kardex)
     */
    procesar(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/procesar`, {});
    }

    /**
     * Anula un movimiento (reversa stock si estaba procesado)
     */
    anular(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/anular`, {});
    }
}
