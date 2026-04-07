import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { map, Observable, Subject, throwError } from 'rxjs';
import { MarcaListar, MarcaUpSert } from '../domain/marca.interface';
import { MarcaDTO, MarcaUpSertDTO } from '../domain/marca.dto';
import { MarcaAdapter } from '../domain/marca.adapter';

@Injectable({
  providedIn: 'root',
})
export class MarcaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/inv/marcas`;

  private readonly refreshSubject = new Subject<MarcaListar[]>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAll(activo?: boolean): Observable<ApiResponse<MarcaListar[]>> {
    const params = activo === undefined ? undefined : { activo: String(activo) };
    return this.http.get<ApiResponse<MarcaDTO[]>>(`${this.apiUrl}`, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data.map(dto => MarcaAdapter.adapt(dto))
      }))
    );
  }

  create(request: MarcaUpSert): Observable<ApiResponseSuccess> {
    const dto = MarcaAdapter.adaptToUpSert(request);
    return this.http.post<ApiResponseSuccess>(`${this.apiUrl}`, dto);
  }

  update(request: MarcaUpSert, id: number): Observable<ApiResponseSuccess> {
    const dto = MarcaAdapter.adaptToUpSert(request);
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
    const message = error?.error?.message || error?.message || 'Error no controlado en el servicio de marcas';
    return throwError(() => new Error(message));
  }
}
