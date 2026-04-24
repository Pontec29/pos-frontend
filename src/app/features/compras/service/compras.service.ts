import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';
import { Compra, CompraCrear, TipoOperacion, SunatAfectacionIgv } from '../domain/compras.interface';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { CompraDto } from '../domain/compras.dto';
import { ComprasAdapter } from '../domain/compras.adapter';

@Injectable({
  providedIn: 'root',
})
export class ComprasService {

  private apiUrl = `${environment.apiUrl}/api/v1/compras`;
  private http = inject(HttpClient);

  private readonly refreshSubject = new Subject<Compra[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAll(active?: boolean): Observable<ApiResponse<Compra[]>> {
    const params = active === undefined ? undefined : { activo: String(active) };
    return this.http.get<ApiResponse<CompraDto[]>>(`${this.apiUrl}`, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data.map(dto => ComprasAdapter.adapt(dto))
      }))
    );
  }

  getTiposOperacion(): Observable<ApiResponse<TipoOperacion[]>> {
    return this.http.get<ApiResponse<TipoOperacion[]>>(`${this.apiUrl}/catalogos/tipos-operacion`);
  }

  getAfectacionesIgv(): Observable<ApiResponse<SunatAfectacionIgv[]>> {
    return this.http.get<ApiResponse<SunatAfectacionIgv[]>>(`${this.apiUrl}/catalogos/afectaciones-igv`);
  }

  create(request: CompraCrear): Observable<ApiResponseSuccess> {
    return this.http.post<ApiResponseSuccess>(`${this.apiUrl}`, ComprasAdapter.adaptToCreate(request)).pipe(
      catchError(this.handleHttpError.bind(this))
    );
  }

  private notifyChange() {
    this.getAll().subscribe({
      next: (res) => {
        if (res.data) {
          this.refreshSubject.next(res.data);
        }
      },
      error: (err) => console.error('Error refreshing data', err),
    });
  }

  private handleHttpError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'Error no controlado en el servicio de productos';
    return throwError(() => new Error(message));
  }
}
