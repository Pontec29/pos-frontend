import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentTypeBasic, type Role } from '../../core/models/document-type.models';
import type { ApiResponse } from '@shared/domains/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/v1/shared';

  private documentTypesCache$?: Observable<ApiResponse<DocumentTypeBasic[]>>;

  /**
   * Gets basic document types for select dropdowns
   * Cached for performance to avoid repeated calls
   */
  getDocumentTypesBasic(): Observable<ApiResponse<DocumentTypeBasic[]>> {
    if (!this.documentTypesCache$) {
      this.documentTypesCache$ = this.http.get<ApiResponse<DocumentTypeBasic[]>>(
        `${this.apiUrl}/document-types-basic`
      ).pipe(
        tap(response => {
          if (!response.success) {
            console.warn('Document types API returned error:', response.message);
          }
        }),
        shareReplay(1)
      );
    }

    return this.documentTypesCache$;
  }

  /**
   * Clears the cached document types data
   * Useful when admin updates document type settings
   */
  clearDocumentTypesCache(): void {
    this.documentTypesCache$ = undefined;
  }

  /**
   * Gets document type validation info by code
   */
  getDocumentTypeByCode(code: string): Observable<DocumentTypeBasic | undefined> {
    return new Observable(subscriber => {
      this.getDocumentTypesBasic().subscribe({
        next: (response) => {
          const docType = response.success ?
            response.data.find(dt => dt.code === code) :
            undefined;
          subscriber.next(docType);
          subscriber.complete();
        },
        error: (error) => subscriber.error(error)
      });
    });
  }

  private rolesCache$?: Observable<ApiResponse<Role[]>>;

  /**
   * Gets active roles for select dropdowns
   * Cached for performance to avoid repeated calls
   */
  getRoles(): Observable<ApiResponse<Role[]>> {
    if (!this.rolesCache$) {
      this.rolesCache$ = this.http.get<ApiResponse<Role[]>>(
        `${environment.apiUrl}/api/v1/auth/roles`
      ).pipe(
        tap(response => {
          if (!response.success) {
            console.warn('Roles API returned error:', response.message);
          }
        }),
        shareReplay(1)
      );
    }

    return this.rolesCache$;
  }

  /**
   * Clears the cached roles data
   * Useful when admin updates roles
   */
  clearRolesCache(): void {
    this.rolesCache$ = undefined;
  }

}
