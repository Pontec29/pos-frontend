import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';

/**
 * Item individual del Kardex aplanado.
 */
export interface KardexAuditoriaItem {
    id: number;
    fecha: string;
    tipoMovimiento: string;
    detalleMovimiento: string;
    codigoSunat: string;
    tipoOperacionDesc: string;
    documentoReferencia: string;
    productoId: number;
    productoSku: string;
    productoNombre: string;
    almacenId: number;
    almacenNombre: string;
    loteId: number | null;
    codigoLote: string | null;
    unidadAbreviatura: string | null;
    cantidad: number;
    costoUnitario: number;
    costoTotal: number;
    saldoCantidad: number;
    saldoCostoUnitario: number;
    saldoCostoTotal: number;
    esEntrada: boolean;
}

/**
 * Respuesta completa de auditoría de Kardex.
 */
export interface KardexAuditoriaCompleta {
    productoNombre: string;
    productoSku: string;
    almacenNombre: string;
    unidadMedida: string;
    totalRegistros: number;
    saldoFinalCantidad: number;
    saldoFinalCostoTotal: number;
    registros: KardexAuditoriaItem[];
}

@Injectable({
    providedIn: 'root'
})
export class KardexAuditoriaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/movimientos/kardex`;

    /**
     * Consulta auditoría de Kardex con filtros.
     */
    consultarKardex(
        productoId: number,
        almacenId: number,
        fechaInicio: string,
        fechaFin: string
    ): Observable<ApiResponse<KardexAuditoriaCompleta>> {
        const params = new HttpParams()
            .set('productoId', productoId.toString())
            .set('almacenId', almacenId.toString())
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<ApiResponse<KardexAuditoriaCompleta>>(
            `${this.apiUrl}/auditoria`, { params }
        );
    }
}
