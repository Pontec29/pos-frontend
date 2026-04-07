import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Kardex } from '../../../core/models/inventory.model';
import { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class KardexService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/kardex`;

    /**
     * Obtener kardex de un producto
     */
    getByProduct(productId: number): Observable<ApiResponse<Kardex[]>> {
        return this.http.get<ApiResponse<Kardex[]>>(`${this.apiUrl}/product/${productId}`);
    }

    /**
     * Obtener kardex de un producto por sucursal
     */
    getByProductAndBranch(productId: number, branchId: number): Observable<ApiResponse<Kardex[]>> {
        return this.http.get<ApiResponse<Kardex[]>>(`${this.apiUrl}/product/${productId}/branch/${branchId}`);
    }

    /**
     * Obtener kardex por rango de fechas
     */
    getByProductAndDateRange(productId: number, startDate: string, endDate: string): Observable<ApiResponse<Kardex[]>> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<ApiResponse<Kardex[]>>(`${this.apiUrl}/product/${productId}/date-range`, { params });
    }

    /**
     * Obtener reporte de kardex por sucursal y rango de fechas
     */
    getKardexReport(branchId: number, startDate: string, endDate: string): Observable<ApiResponse<Kardex[]>> {
        const params = new HttpParams()
            .set('branchId', branchId.toString())
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<ApiResponse<Kardex[]>>(`${this.apiUrl}/report`, { params });
    }
}
