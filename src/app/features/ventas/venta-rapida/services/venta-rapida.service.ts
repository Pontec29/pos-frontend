import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VentaRapidaService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/ven/ventas`;
  private readonly metodosUrl = `${environment.apiUrl}/api/v1/mto/metodos-pago`;
  private readonly http = inject(HttpClient);

  getMetodosPago() {
    return this.http.get<any>(this.metodosUrl);
  }

  crearVenta(venta: any) {
    return this.http.post<any>(this.apiUrl, venta);
  }
}
