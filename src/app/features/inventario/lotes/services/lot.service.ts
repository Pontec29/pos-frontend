import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Lot } from '../../../../core/models/inventory.model';
import { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class LotService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/lots`;

    /**
     * Obtener lotes de un producto
     */
    getByProduct(productId: number): Observable<ApiResponse<Lot[]>> {
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/product/${productId}`);
    }

    /**
     * Obtener lotes activos de un producto
     */
    getActiveByProduct(productId: number): Observable<ApiResponse<Lot[]>> {
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/product/${productId}/active`);
    }

    /**
     * Obtener lotes activos por sucursal
     */
    getActiveByBranch(branchId: number): Observable<ApiResponse<Lot[]>> {
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/branch/${branchId}/active`);
    }

    /**
     * Obtener lotes vencidos
     */
    getExpiredLots(): Observable<ApiResponse<Lot[]>> {
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/expired`);
    }

    /**
     * Obtener lotes próximos a vencer
     */
    getLotsNearExpiration(daysAhead?: number): Observable<ApiResponse<Lot[]>> {
        let params = new HttpParams();
        if (daysAhead) {
            params = params.set('daysAhead', daysAhead.toString());
        }
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/near-expiration`, { params });
    }

    /**
     * Obtener lotes próximos a vencer por sucursal
     */
    getLotsToExpireByBranch(branchId: number, daysAhead?: number): Observable<ApiResponse<Lot[]>> {
        let params = new HttpParams();
        if (daysAhead) {
            params = params.set('daysAhead', daysAhead.toString());
        }
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/branch/${branchId}/near-expiration`, { params });
    }

    /**
     * Obtener lotes disponibles ordenados por FIFO
     */
    getAvailableLotsFifo(productId: number, branchId: number): Observable<ApiResponse<Lot[]>> {
        return this.http.get<ApiResponse<Lot[]>>(`${this.apiUrl}/product/${productId}/branch/${branchId}/fifo`);
    }
}
