import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { ProductoBusqueda } from '../models/producto.model';

/**
 * Servicio global para operaciones de productos.
 * Reutilizable en inventario, ventas, compras, etc.
 */
@Injectable({
    providedIn: 'root'
})
export class ProductoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/inv/productos`;

    /**
     * Busca productos por nombre, SKU o código de barras.
     * Devuelve productos con sus presentaciones/unidades activas.
     */
    buscarProductos(term: string): Observable<ApiResponse<ProductoBusqueda[]>> {
        return this.http.get<ApiResponse<ProductoBusqueda[]>>(`${this.apiUrl}/buscar`, {
            params: { term }
        });
    }

    importar(file: File): Observable<ApiResponse<any[]>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<any[]>>(`${this.apiUrl}/importar`, formData);
    }

    descargarPlantilla(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/plantilla`, {
            responseType: 'blob'
        });
    }

    /**
     * Obtiene el stock de un producto en un almacén específico.
     */
    getStock(productoId: number, almacenId: number): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${environment.apiUrl}/api/v1/inv/stock/producto/${productoId}/almacen/${almacenId}`);
    }
}
