import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';

/**
 * Interface para el detalle de un item valorizado.
 */
export interface ItemValorizado {
    stockId: number;
    almacenId: number;
    almacenNombre: string;
    productoId: number;
    productoSku: string;
    productoNombre: string;
    loteId: number | null;
    codigoLote: string | null;
    fechaVencimiento: string | null;
    cantidad: number;
    costoPromedio: number;
    valorTotal: number;
}

/**
 * Interface para la respuesta del inventario valorizado.
 */
export interface InventarioValorizadoResponse {
    valorTotal: number;
    totalProductos: number;
    totalItems: number;
    detalle: ItemValorizado[];
}

@Injectable({
    providedIn: 'root'
})
export class InventarioValorizadoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/stock`;

    /**
     * Obtiene el inventario valorizado general (todos los almacenes).
     */
    obtenerValorizado(): Observable<ApiResponse<InventarioValorizadoResponse>> {
        return this.http.get<ApiResponse<InventarioValorizadoResponse>>(
            `${this.apiUrl}/inventario-valorizado`
        );
    }

    /**
     * Obtiene el inventario valorizado de un almacén específico.
     */
    obtenerValorizadoPorAlmacen(almacenId: number): Observable<ApiResponse<InventarioValorizadoResponse>> {
        return this.http.get<ApiResponse<InventarioValorizadoResponse>>(
            `${this.apiUrl}/inventario-valorizado/almacen/${almacenId}`
        );
    }
}
