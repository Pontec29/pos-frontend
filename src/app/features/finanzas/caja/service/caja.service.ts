import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiResponse, ApiResponseSuccess } from '@shared/domains/api-response.model';
import { CajaAdapter } from '../domain/caja.adapter';
import {
  CajaAbiertaCerradaDTO,
  CajaSesionesListarDTO,
  ConsultarEstadoSesionDTO,
  DenominacionesDTO,
} from '../domain/caja.dto';
import {
  AperturaCajaRegistro,
  CrearCaja,
  CierreCajaRegistro,
  Denominaciones,
  CajaAbiertaCerrada,
  ConsultarEstadoSesion,
  CajaSesionesListar,
} from '../domain/caja.interface';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/caja`;
  private readonly http = inject(HttpClient);

  getAllDenominaciones(): Observable<ApiResponse<Denominaciones[]>> {
    return this.http
      .get<ApiResponse<DenominacionesDTO[]>>(`${this.apiUrl}/maestros/denominaciones/1`)
      .pipe(
        map((res) => ({
          ...res,
          data: res.data.map((item) => CajaAdapter.adaptDenominacion(item)),
        })),
      );
  }

  getCajaAbierta(
    ESTADO?: boolean,
    EN_USO?: boolean,
  ): Observable<ApiResponse<CajaAbiertaCerrada[]>> {
    let params = new HttpParams();
    if (ESTADO !== undefined) params = params.append('activo', ESTADO.toString());
    if (EN_USO !== undefined) params = params.append('enUso', EN_USO.toString());
    return this.http
      .get<ApiResponse<CajaAbiertaCerradaDTO[]>>(`${this.apiUrl}/cajas`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: res.data.map((item) => CajaAdapter.adaptCajaAbiertaCerrada(item)),
        })),
      );
  }

  getAllCajaSesiones(): Observable<ApiResponse<CajaSesionesListar[]>> {
    return this.http
      .get<ApiResponse<CajaSesionesListarDTO[]>>(`${this.apiUrl}/sesiones/mis-sesiones`)
      .pipe(
        map((res) => ({
          ...res,
          data: res.data.map((item) => CajaAdapter.adaptCajaSesionesListar(item)),
        })),
      );
  }

  getAllConsultarCajaAbierta(): Observable<ApiResponse<ConsultarEstadoSesion>> {
    return this.http
      .get<ApiResponse<ConsultarEstadoSesionDTO>>(`${this.apiUrl}/sesiones/status`)
      .pipe(
        map((res) => ({
          ...res,
          data: CajaAdapter.adaptConsultarEstadoSesion(res.data),
        })),
      );
  }

  abrirCaja(payload: AperturaCajaRegistro): Observable<ApiResponseSuccess> {
    return this.http
      .post<ApiResponseSuccess>(
        `${this.apiUrl}/sesiones/abrir`,
        CajaAdapter.adaptAperturaCaja(payload),
      )
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  cerrarCaja(payload: CierreCajaRegistro): Observable<ApiResponseSuccess> {
    return this.http
      .post<ApiResponseSuccess>(
        `${this.apiUrl}/sesiones/cerrar`,
        CajaAdapter.adaptCierreCaja(payload),
      )
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  createCaja(payload: CrearCaja): Observable<ApiResponseSuccess> {
    return this.http
      .post<ApiResponseSuccess>(`${this.apiUrl}/cajas`, CajaAdapter.adaptCrearCaja(payload))
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  private handleHttpError(error: any): Observable<never> {
    const message =
      error?.error?.message ||
      error?.message ||
      'Error no controlado en el servicio de proveedores';
    return throwError(() => new Error(message));
  }
}
