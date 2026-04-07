import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';

export interface CorrelativoPreview {
    serie: string;
    numeroSiguiente: string;
    documentoFormateado: string;
}

/**
 * Servicio para consultar correlativos (numeración automática).
 * Reutilizable desde cualquier pantalla que necesite previsualizar documentos.
 */
@Injectable({
    providedIn: 'root'
})
export class CorrelativoService {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/correlativos`;

    /**
     * Previsualiza el siguiente número de documento.
     * No consume el número, solo lo muestra.
     */
    previsualizarSiguiente(
        modulo: string,
        tipoDocumento: string,
        almacenId?: number,
        sucursalId?: number
    ): Observable<CorrelativoPreview> {
        let params = new HttpParams()
            .set('modulo', modulo)
            .set('tipoDocumento', tipoDocumento);

        if (almacenId != null) {
            params = params.set('almacenId', almacenId.toString());
        }
        if (sucursalId != null) {
            params = params.set('sucursalId', sucursalId.toString());
        }

        return this.http
            .get<ApiResponse<CorrelativoPreview>>(`${this.apiUrl}/siguiente`, { params })
            .pipe(map(res => res.data));
    }
}
