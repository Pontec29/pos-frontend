import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpleadoDTO, Empleado, EmpleadoAdapter } from '../domain/empleado.domain';
import { ApiResponse } from '@shared/domains/api-response.model';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/rrhh/empleados`;

    /**
     * Obtiene la lista de empleados como recurso reactivo
     */
    getEmpleadosResource(trigger: Signal<any>) {
        return httpResource<Empleado[]>(() => {
            trigger(); // Escuchamos el trigger para recargar
            return { url: this.apiUrl };
        }, {
            parse: (res) => EmpleadoAdapter.adaptList((res as ApiResponse<EmpleadoDTO[]>).data)
        });
    }

    getEmpleados(): Observable<ApiResponse<EmpleadoDTO[]>> {
        return this.http.get<ApiResponse<EmpleadoDTO[]>>(this.apiUrl);
    }

    getEmpleadoById(id: number): Observable<ApiResponse<EmpleadoDTO>> {
        return this.http.get<ApiResponse<EmpleadoDTO>>(`${this.apiUrl}/${id}`);
    }

    updateEmpleado(id: number, dto: Partial<EmpleadoDTO>): Observable<ApiResponse<EmpleadoDTO>> {
        return this.http.put<ApiResponse<EmpleadoDTO>>(`${this.apiUrl}/${id}`, dto);
    }

    createEmpleado(dto: Partial<EmpleadoDTO>): Observable<ApiResponse<EmpleadoDTO>> {
        return this.http.post<ApiResponse<EmpleadoDTO>>(this.apiUrl, dto);
    }
}
