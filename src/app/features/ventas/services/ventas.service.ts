import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import {
    VentaResumen,
    VentaResponse,
    VentaRequest,
} from '../models/venta.models';

@Injectable({ providedIn: 'root' })
export class VentasService {

    private readonly http    = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/api/v1/ventas`;

    getVentas(estado?: string): Observable<ApiResponse<VentaResumen[]>> {
        const params: Record<string, string> = {};
        if (estado) params['estado'] = estado;
        return this.http.get<ApiResponse<VentaResumen[]>>(this.baseUrl, { params });
    }

    getVentaById(id: number): Observable<ApiResponse<VentaResponse>> {
        return this.http.get<ApiResponse<VentaResponse>>(`${this.baseUrl}/${id}`);
    }

    crearVenta(request: VentaRequest): Observable<ApiResponse<VentaResponse>> {
        return this.http.post<ApiResponse<VentaResponse>>(this.baseUrl, request);
    }

    anularVenta(id: number, motivo?: string): Observable<ApiResponse<VentaResponse>> {
        const url = `${this.baseUrl}/${id}/anular`;
        return this.http.patch<ApiResponse<VentaResponse>>(url, null, {
            params: motivo ? { motivo } : {}
        });
    }

    descargarPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${id}/pdf`, {
            responseType: 'blob'
        });
    }

    abrirPdfEnNuevaPestana(id: number): void {
        this.descargarPdf(id).subscribe(blob => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        });
    }

    forzarDescargaPdf(id: number, nombre: string): void {
        this.descargarPdf(id).subscribe(blob => {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = nombre;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}
