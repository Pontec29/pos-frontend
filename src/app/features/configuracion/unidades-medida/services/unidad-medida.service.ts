import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, Subject, throwError, map } from 'rxjs';
import { environment } from '@environments/environment';
import { UnidadMedidaListar } from '../domain/unidad-medida.interface';
import { ApiResponse } from '@shared/domains/api-response.model';
import { UnidadMedidaDTO } from '../domain/unidad-medida.dto';
import { UnidadMedidaAdapter } from '../domain/unidad-medida.adapter';

@Injectable({
    providedIn: 'root'
})
export class UnidadMedidaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/inv/maestros/unidades`;

  private readonly refreshSubject = new Subject<UnidadMedidaListar[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAll(): Observable<ApiResponse<UnidadMedidaListar[]>> {
    return this.http.get<ApiResponse<UnidadMedidaDTO[]>>(`${this.apiUrl}`).pipe(
      map((res) => ({
        ...res,
        data: res.data.map(dto => UnidadMedidaAdapter.adapt(dto))
      }))
    );
  }

  getCatalogoSunat(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/catalogo-sunat`);
  }

  private notifyChange() {
    this.getAll().subscribe({
      next: (res) => {
        if (res.data) {
          this.refreshSubject.next(res.data);
        }
      },
      error: (err) => this.handleHttpError(err),
    });
  }

  create(dto: Partial<UnidadMedidaDTO>): Observable<ApiResponse<UnidadMedidaDTO>> {
    return this.http.post<ApiResponse<UnidadMedidaDTO>>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<UnidadMedidaDTO>): Observable<ApiResponse<UnidadMedidaDTO>> {
    return this.http.put<ApiResponse<UnidadMedidaDTO>>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}`, {});
  }

  private handleHttpError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'Error no controlado';
    return throwError(() => new Error(message));
  }
}
