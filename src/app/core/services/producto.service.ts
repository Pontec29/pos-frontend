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
}
