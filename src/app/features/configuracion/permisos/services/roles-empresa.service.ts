import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { ApiResponse } from '@shared/domains/api-response.model';
import { Role } from '@core/models/document-type.models';
import { RoleDTO } from '../models/role.dto';
import { RoleAdapter } from '../models/role.adapter';

@Injectable({
  providedIn: 'root'
})
export class RolesEmpresaService {
  private http = inject(HttpClient);

  listByEmpresa(empresaId: number): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<RoleDTO[]>>(
      `${environment.apiUrl}/api/v1/auth/roles/company/${empresaId}`
    ).pipe(
      map(res => ({
        ...res,
        data: res.success ? res.data.map(dto => RoleAdapter.adapt(dto)) : []
      }))
    );
  }
}
