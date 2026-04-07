import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CargoDTO } from '../domain/cargo.dto';
import { Cargo } from '../domain/cargo.interface';
import { CargoAdapter } from '../domain/cargo.adapter';
import { ApiResponse } from '@shared/domains/api-response.model';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CargosService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/rrhh/cargos`;

    /**
     * Obtiene la lista de cargos como recurso reactivo
     */
    getCargosResource(trigger: Signal<any>) {
        return httpResource<Cargo[]>(() => {
            trigger(); // Escuchamos el trigger para recargar
            return { url: this.apiUrl };
        }, {
            parse: (res) => CargoAdapter.adaptList((res as ApiResponse<CargoDTO[]>).data)
        });
    }

    getCargos(): Observable<ApiResponse<CargoDTO[]>> {
        return this.http.get<ApiResponse<CargoDTO[]>>(this.apiUrl);
    }

    createCargo(cargo: Partial<Cargo>): Observable<ApiResponse<CargoDTO>> {
        return this.http.post<ApiResponse<CargoDTO>>(this.apiUrl, cargo);
    }

    updateCargo(id: number, cargo: Partial<Cargo>): Observable<ApiResponse<CargoDTO>> {
        return this.http.put<ApiResponse<CargoDTO>>(`${this.apiUrl}/${id}`, cargo);
    }
}
