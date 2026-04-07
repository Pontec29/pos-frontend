import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.development';

export interface ConsultaDocumentoData {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    nombreCompleto?: string;
    digitoVerificador?: string;
    razonSocial?: string;
    estado?: string;
    condicion?: string;
    direccion?: string;
    ubigeo?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    esAgenteRetencion?: boolean;
    esBuenContribuyente?: boolean;
    nombreComercial?: string;
}

export interface ConsultaDocumentoResponse {
    success: boolean;
    message: string;
    data: ConsultaDocumentoData;
}

@Injectable({
    providedIn: 'root'
})
export class SunatService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/mto/consulta`;

    /**
     * Consulta información de un documento (DNI o RUC)
     * @param tipoDocumento '1' para DNI, '6' para RUC
     * @param numeroDocumento Número de documento
     */
    consultarDocumento(tipoDocumento: '1' | '6' | string, numeroDocumento: string): Observable<ConsultaDocumentoResponse> {
        const params = new HttpParams()
            .set('tipoDocumento', tipoDocumento)
            .set('numeroDocumento', numeroDocumento);

        return this.http.get<ConsultaDocumentoResponse>(this.apiUrl, { params });
    }
}
