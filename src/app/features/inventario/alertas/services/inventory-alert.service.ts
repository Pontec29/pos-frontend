import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { InventoryAlert } from '@core/models/inventory.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryAlertService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/inventory/alerts`;

    /**
     * Obtener alertas pendientes
     */
    getPendingAlerts(): Observable<ApiResponse<InventoryAlert[]>> {
        return this.http.get<ApiResponse<InventoryAlert[]>>(this.apiUrl);
    }

    /**
     * Obtener alertas pendientes por sucursal
     */
    getPendingAlertsByBranch(branchId: number): Observable<ApiResponse<InventoryAlert[]>> {
        return this.http.get<ApiResponse<InventoryAlert[]>>(`${this.apiUrl}/branch/${branchId}`);
    }

    /**
     * Obtener alertas pendientes por tipo
     */
    getAlertsByType(alertType: string): Observable<ApiResponse<InventoryAlert[]>> {
        return this.http.get<ApiResponse<InventoryAlert[]>>(`${this.apiUrl}/type/${alertType}`);
    }

    /**
     * Contar alertas pendientes
     */
    countPendingAlerts(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/count`);
    }

    /**
     * Contar alertas pendientes por sucursal
     */
    countPendingAlertsByBranch(branchId: number): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/count/branch/${branchId}`);
    }

    /**
     * Marcar alerta como leída
     */
    markAsRead(alertId: number): Observable<ApiResponse<InventoryAlert>> {
        return this.http.put<ApiResponse<InventoryAlert>>(`${this.apiUrl}/${alertId}/read`, {});
    }

    /**
     * Marcar alerta como resuelta
     */
    markAsResolved(alertId: number): Observable<ApiResponse<InventoryAlert>> {
        return this.http.put<ApiResponse<InventoryAlert>>(`${this.apiUrl}/${alertId}/resolve`, {});
    }
}
