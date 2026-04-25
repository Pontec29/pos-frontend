import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/domains/api-response.model';
import { ResponseAfectacionIgvDto, ResponseBancosDto, ResponseBuscarDniOrucDto, ResponseContactoDto, ResponseEmpresaAsignadaDto, ResponseMetodoPagoDto, ResponseMonedaDto, ResponseTipoDocumentoDto, ResponseUbigeoDto } from '@shared/domains/general.dto';
import { from, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { IndexedDbService } from './indexed-db.service';


@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  private apiUrl = `${environment.apiUrl}/api/v1`;
  private http = inject(HttpClient);
  private dbService = inject(IndexedDbService);

  private readonly EMPRESAS_ASIGNADAS_KEY = 'empresas_asignadas';
  private cacheEmpresasAsignadas$?: Observable<ApiResponse<ResponseEmpresaAsignadaDto[]>>;

  // ! BUSCAR POR DNI O RUC 1:DNI 6:RUC
  public buscarPorDniOruc(tipoDoc: string, numeroDocumento: string): Observable<ApiResponse<ResponseBuscarDniOrucDto>> {
    return this.http.get<ApiResponse<ResponseBuscarDniOrucDto>>(`${this.apiUrl}/mto/consulta?tipoDocumento=${tipoDoc}&numeroDocumento=${numeroDocumento}`);
  }

  // ! LISTAR MONEDAS
  public getAllMonedas(): Observable<ApiResponse<ResponseMonedaDto[]>> {
    return this.http.get<ApiResponse<ResponseMonedaDto[]>>(`${this.apiUrl}/mto/monedas`);
  }

  // ! LISTAR BANCOS
  public getAllBancos(): Observable<ApiResponse<ResponseBancosDto[]>> {
    return this.http.get<ApiResponse<ResponseBancosDto[]>>(`${this.apiUrl}/mto/bancos`);
  }

  // ! LISTAR TIPOS DE DOCUMENTOS
  public getAllTiposDocumentos(): Observable<ApiResponse<ResponseTipoDocumentoDto[]>> {
    return this.http.get<ApiResponse<ResponseTipoDocumentoDto[]>>(`${this.apiUrl}/mto/tipos-documento`);
  }

  // ! LISTAR UBIGEOS
  public getAllUbigeos(request?: string): Observable<ApiResponse<ResponseUbigeoDto[]>> {
    const query = request ? `?term=${request}` : '';
    return this.http.get<ApiResponse<ResponseUbigeoDto[]>>(`${this.apiUrl}/mto/ubigeos${query}`);
  }

  // ! LISTAR AFECTACIÓN IGV
  public getAllAfectacionesIgv(): Observable<ApiResponse<ResponseAfectacionIgvDto[]>> {
    return this.http.get<ApiResponse<ResponseAfectacionIgvDto[]>>(`${this.apiUrl}/conf/afectaciones`);
  }

  // ! BUSCAR CONTACTOS (clientes/proveedores) - ejemplo: /api/v1/mto/contactos/search?term=...&tipo=c
  public buscarContactos(term: string, tipo?: string): Observable<ApiResponse<ResponseContactoDto[]>> {
    let params = new HttpParams().set('term', term);
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<ApiResponse<ResponseContactoDto[]>>(`${this.apiUrl}/mto/contactos/search`, { params });
  }

  // ! LISTAR MÉTODOS DE PAGO
  public getAllMetodosPago(): Observable<ApiResponse<ResponseMetodoPagoDto[]>> {
    return this.http.get<ApiResponse<ResponseMetodoPagoDto[]>>(`${this.apiUrl}/mto/metodos-pago`);
  }

  // ! LISTAR EMPRESAS ASIGNADAS AL USUARIO ACTUAL- p-select
  public getEmpresasAsignadas(): Observable<ApiResponse<ResponseEmpresaAsignadaDto[]>> {
    if (this.cacheEmpresasAsignadas$) {
      return this.cacheEmpresasAsignadas$;
    }

    // 1. Intentar cargar de IndexedDB
    this.cacheEmpresasAsignadas$ = from(this.dbService.get<ResponseEmpresaAsignadaDto[]>(this.EMPRESAS_ASIGNADAS_KEY)).pipe(
      switchMap(cachedData => {
        if (cachedData) {
          // Si hay en cache, lo devolvemos envuelto en ApiResponse
          return of({ success: true, message: 'Cargado de cache', data: cachedData });
        }
        // 2. Si no hay, ir al API
        return this.http.get<ApiResponse<ResponseEmpresaAsignadaDto[]>>(`${this.apiUrl}/companies/asignadas`).pipe(
          tap(res => {
            if (res.success && res.data) {
              this.dbService.set(this.EMPRESAS_ASIGNADAS_KEY, res.data);
            }
          })
        );
      }),
      shareReplay(1)
    );

    return this.cacheEmpresasAsignadas$;
  }

  public clearCache(): void {
    this.cacheEmpresasAsignadas$ = undefined;
    this.dbService.remove(this.EMPRESAS_ASIGNADAS_KEY);
  }

  // ! LISTAR TODAS LAS EMPRESAS BÁSICAS (Para selects o listados simplificados)
  public getEmpresasBasicas(): Observable<ApiResponse<{ tenantId: number; razonSocial: string; ruc: string; direccion: string }[]>> {
    return this.http.get<ApiResponse<{ tenantId: number; razonSocial: string; ruc: string; direccion: string }[]>>(`${this.apiUrl}/companies/basicas`);
  }
}
