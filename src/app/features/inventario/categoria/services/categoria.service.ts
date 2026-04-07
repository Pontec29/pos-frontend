import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { map, Observable, Subject, throwError } from 'rxjs';
import { CategoriaDTO } from '../domain/categoria.dto';
import { Categoria, CategoriaUpSert } from '../domain/categoria.interface';
import { CategoriaAdapter } from '../domain/categoria.adapter';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/inventario/categorias`;

  private readonly refreshSubject = new Subject<Categoria[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAll(activo?: boolean): Observable<ApiResponse<Categoria[]>> {
    const params = activo === undefined ? undefined : { activo: String(activo) };
    return this.http.get<ApiResponse<CategoriaDTO[]>>(`${this.apiUrl}`, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data.map(dto => CategoriaAdapter.adapt(dto))
      }))
    );
  }

  create(request: CategoriaUpSert): Observable<ApiResponseSuccess> {
    const dto = CategoriaAdapter.adaptToUpSert(request);
    return this.http.post<ApiResponseSuccess>(`${this.apiUrl}`, dto);
  }

  update(request: CategoriaUpSert, id: number): Observable<ApiResponseSuccess> {
    const dto = CategoriaAdapter.adaptToUpSert(request);
    return this.http.put<ApiResponseSuccess>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponseSuccess> {
    return this.http.patch<ApiResponseSuccess>(`${this.apiUrl}/${id}`, null);
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

  private handleHttpError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'Error no controlado en el servicio de categorias';
    return throwError(() => new Error(message));
  }
}
