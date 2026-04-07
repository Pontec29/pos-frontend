import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ExternalApiData } from '../../shared/domains/external-api-data.model';
import { ApiResponse } from '../../shared/domains/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EntityLookupService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/v1/common/lookup`;

    lookup(docType: string, docNumber: string): Observable<ExternalApiData> {
        return this.http.get<ApiResponse<ExternalApiData>>(`${this.apiUrl}?docType=${docType}&docNumber=${docNumber}`)
            .pipe(
                map(response => response.data)
            );
    }
}
