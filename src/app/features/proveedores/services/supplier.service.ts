import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Supplier, SupplierRequest } from '../../../core/models/purchases.model';
import { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/purchases/suppliers`;

    /**
     * Listar todos los proveedores activos
     */
    getAll(): Observable<ApiResponse<Supplier[]>> {
        return this.http.get<ApiResponse<Supplier[]>>(this.apiUrl);
    }

    /**
     * Buscar proveedores por nombre o RUC
     */
    search(query: string): Observable<ApiResponse<Supplier[]>> {
        const params = new HttpParams().set('q', query);
        return this.http.get<ApiResponse<Supplier[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener proveedor por ID
     */
    getById(id: number): Observable<ApiResponse<Supplier>> {
        return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Obtener proveedor por número de documento
     */
    getByDocumentNumber(documentNumber: string): Observable<ApiResponse<Supplier>> {
        return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/by-document/${documentNumber}`);
    }

    /**
     * Crear nuevo proveedor
     */
    create(supplier: SupplierRequest): Observable<ApiResponse<Supplier>> {
        return this.http.post<ApiResponse<Supplier>>(this.apiUrl, supplier);
    }

    /**
     * Actualizar proveedor
     */
    update(id: number, supplier: SupplierRequest): Observable<ApiResponse<Supplier>> {
        return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`, supplier);
    }

    /**
     * Eliminar proveedor (soft delete)
     */
    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}
