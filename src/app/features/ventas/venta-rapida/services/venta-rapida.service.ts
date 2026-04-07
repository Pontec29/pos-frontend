import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VentaRapidaService {
  private readonly apiUrl = `${environment.apiUrl}/pos`;
  private readonly http = inject(HttpClient);

  getAll() {}
}
