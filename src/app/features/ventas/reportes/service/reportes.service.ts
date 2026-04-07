import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesVentasService {

  private readonly apiUrl = `${environment.apiUrl}/reportes-ventas`;
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get(`${this.apiUrl}/all`);
  }

}
