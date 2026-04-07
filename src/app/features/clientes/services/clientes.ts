import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment.development';
import { ApiResponse } from '@shared/domains/api-response.model';
import { Cliente, ClienteFormDto, type ClienteTable } from '../models/cliente.model';

/**
 * Servicio para gestionar clientes vía API REST.
 * Utiliza la interfaz global ApiResponse<T> para todas las respuestas.
 */
@Injectable({
  providedIn: 'root',
})
export class ClientesService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/ventas/clientes`;

  /** Obtiene la lista completa de clientes */
  getAll(): Observable<ApiResponse<ClienteTable[]>> {
    return this.http.get<ApiResponse<ClienteTable[]>>(this.apiUrl);
  }

  /** Obtiene un cliente por ID */
  getById(id: number): Observable<ApiResponse<Cliente>> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
  }

  /** Crea un nuevo cliente */
  create(dto: ClienteFormDto): Observable<ApiResponse<Cliente>> {
    return this.http.post<ApiResponse<Cliente>>(this.apiUrl, dto);
  }

  /** Actualiza un cliente existente */
  update(id: number, dto: ClienteFormDto): Observable<ApiResponse<Cliente>> {
    return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, dto);
  }

  /** Cambia el estado activo/inactivo de un cliente */
  toggleStatus(id: number, activo: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/status`, null, {
      params: { active: activo.toString() }
    });
  }
}
