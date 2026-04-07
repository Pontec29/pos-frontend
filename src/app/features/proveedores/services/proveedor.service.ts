import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, map, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { Proveedor, ProveedorCrear } from '../domain/proveedor.interface';
import { ProveedorDTO } from '../domain/proveedor.dto';
import { ProveedorAdapter } from '../domain/proveedor.adapter';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {

  private apiUrl = `${environment.apiUrl}/api/v1/compras/proveedores`;
  private http = inject(HttpClient);

  private readonly refreshSubject = new Subject<Proveedor[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

    getAll(): Observable<ApiResponse<Proveedor[]>> {
        return this.http.get<ApiResponse<ProveedorDTO[]>>(`${this.apiUrl}/todos`).pipe(
          map((res) => ({
            ...res,
            data: res.data.map(dto => ProveedorAdapter.adapt(dto))
          }))
        );
    }

    create(request: ProveedorCrear): Observable<ApiResponseSuccess> {
      return this.http.post<ApiResponseSuccess>(`${this.apiUrl}`, ProveedorAdapter.adaptToCreate(request)).pipe(
        catchError(this.handleHttpError.bind(this))
      );
    }

    update(request: ProveedorCrear, id: number): Observable<ApiResponseSuccess> {
      return this.http.put<ApiResponseSuccess>(`${this.apiUrl}/${id}`, ProveedorAdapter.adaptToCreate(request)).pipe(
        catchError(this.handleHttpError.bind(this))
      );
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
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
    const message = error?.error?.message || error?.message || 'Error no controlado en el servicio de proveedores';
    return throwError(() => new Error(message));
  }
}
