import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Subject, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { Producto, ProductoUpSert, ProductoView } from '../domain/productos.interface';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { ProductoDTO, ProductoViewDTO } from '../domain/productos.dto';
import { ProductoAdapter } from '../domain/productos.adapter';

@Injectable({
    providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/api/v1/inv/productos`;
  private http = inject(HttpClient);

  private readonly refreshSubject = new Subject<Producto[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAll(active?: boolean): Observable<ApiResponse<Producto[]>> {
    const params = active === undefined ? undefined : { activo: String(active) };
    return this.http.get<ApiResponse<ProductoDTO[]>>(`${this.apiUrl}`, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data.map(dto => ProductoAdapter.adapt(dto))
      }))
    );
  }

  getById(id: number): Observable<ApiResponse<ProductoView>> {
      return this.http.get<ApiResponse<ProductoViewDTO>>(`${this.apiUrl}/${id}`).pipe(
        map((res) => ({
          ...res,
          data: ProductoAdapter.adaptToView(res.data)
        }))
      );
  }

  create(request: ProductoUpSert): Observable<ApiResponseSuccess> {
    return this.http.post<ApiResponseSuccess>(`${this.apiUrl}`, ProductoAdapter.adaptToUpSert(request)).pipe(
      catchError(this.handleHttpError.bind(this))
    );
  }

  update(id: number, request: ProductoUpSert): Observable<ApiResponseSuccess> {
      return this.http.put<ApiResponseSuccess>(`${this.apiUrl}/${id}`, ProductoAdapter.adaptToUpSert(request)).pipe(
        catchError(this.handleHttpError.bind(this))
      );
  }

  delete(id: number): Observable<ApiResponse<void>> {
      return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, active: boolean): Observable<ApiResponse<void>> {
    // El backend maneja el cambio de estado inactivo mediante el verbo PATCH (soft delete) en el endpoint "/{id}"
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}`, {});
  }

  getByBarcode(barcode: string): Observable<ApiResponse<ProductoView>> {
    return this.http.get<ApiResponse<ProductoViewDTO>>(`${this.apiUrl}/codigo-barras/${barcode}`).pipe(
      map((res) => ({
        ...res,
        data: ProductoAdapter.adaptToView(res.data)
      }))
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
