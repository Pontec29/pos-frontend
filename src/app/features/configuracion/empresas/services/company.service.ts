import { Injectable, inject, Signal, isSignal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, httpResource } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { ApiResponse } from '@shared/domains/api-response.model';

import type { Empresa } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/companies`;

  //! Renombando nuevos endpints
  // Obtiene una empresa por ID (Resource-based)
  getEmpresaPorId(tenantId: number | Signal<number | null>) {
    return httpResource<ApiResponse<Empresa>>(() => {
      const id = isSignal(tenantId) ? tenantId() : tenantId;
      return id ? `${this.apiUrl}/${id}` : undefined;
    });
  }

  // LIsta de empresas para la tabla
  getEmpresas(activo?: boolean): Observable<ApiResponse<Empresa[]>> {
    let params = new HttpParams();
    if (activo !== undefined && activo !== null) {
      params = params.set('activo', String(activo));
    }
    return this.http.get<ApiResponse<Empresa[]>>(`${this.apiUrl}`, { params });
  }

  crearEmpresa(empresa: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
    return this.http.post<ApiResponse<Empresa>>(`${this.apiUrl}`, empresa);
  }

  actualizarEmpresa(tenantId: number, empresa: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
    return this.http.put<ApiResponse<Empresa>>(`${this.apiUrl}/${tenantId}`, empresa);
  }

}
