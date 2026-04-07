import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, tap, map, EMPTY } from 'rxjs';
import { ApiResponse } from '@shared/domains/api-response.model';
import { IndexedDbService } from '@shared/services/indexed-db.service';
import { SidebarService } from '../../../layout/sidebar/services/sidebar.service';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse, UserCompany } from '@core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http          = inject(HttpClient);
  private readonly dbService     = inject(IndexedDbService);
  private readonly sidebarService = inject(SidebarService);
  private readonly apiUrl        = `${environment.apiUrl}/api/v1/auth`;
  private readonly AUTH_KEY      = 'auth_session';

  private readonly _session = signal<LoginResponse | null>(null);

  // ! SOLO LECTURA
  readonly session      = this._session.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._session());
  readonly estadoCaja   = computed(() => this._session()?.estadoCaja   ?? null);
  readonly sesionId     = computed(() => this._session()?.sesionId     ?? null);
  readonly cajaAbierta  = computed(() => this._session()?.estadoCaja === 'ABIERTA');
  readonly username     = computed(() => this._session()?.username     ?? null);
  readonly userRole     = computed(() => this._session()?.role         ?? null);

  private persistSession(data: LoginResponse): Observable<LoginResponse> {
    return from(this.dbService.set(this.AUTH_KEY, data)).pipe(
      tap(() => this._session.set(data)),
      map(() => data)
    );
  }

  cargarSesion(): Observable<void> {
    return from(this.dbService.get<LoginResponse>(this.AUTH_KEY)).pipe(
      tap(session => this._session.set(session ?? null)),
      map(() => void 0)
    );
  }

  getSession(): Observable<LoginResponse | null> {
    return from(this.dbService.get<LoginResponse>(this.AUTH_KEY)).pipe(
      tap(session => this._session.set(session ?? null)),
      map(session => session ?? null)
    );
  }

  //! Por discutir si será correo o usuario en el payload
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    const payload = {
      username: credentials.email || credentials.username,
      password: credentials.password
    };

    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, payload).pipe(
      switchMap(response =>
        this.persistSession(response.data).pipe(
          switchMap(() => this.sidebarService.refreshMenu()),
          map(() => response)
        )
      )
    );
  }

  //! Corregir en el futuro: existen dos métodos, solo debe haber uno
  getMyCompanies(): Observable<ApiResponse<UserCompany[]>> {
    return this.http.get<ApiResponse<UserCompany[]>>(`${this.apiUrl}/mis-empresas`);
  }

  switchCompany(targetTenantId: number): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.apiUrl}/cambiar-empresa`,
      { targetTenantId }
    ).pipe(
      switchMap(response =>
        this.persistSession(response.data).pipe(
          switchMap(() => this.sidebarService.refreshMenu()),
          map(() => response)
        )
      )
    );
  }

  logout(): Observable<void> {
    return from(this.sidebarService.clearCache()).pipe(
      switchMap(() => from(this.dbService.remove(this.AUTH_KEY))),
      tap(() => this._session.set(null))
    );
  }

  actualizarSesion(partial: Partial<LoginResponse>): Observable<void> {
    const current = this._session();
    if (!current) return EMPTY;

    const updated: LoginResponse = { ...current, ...partial };
    return from(this.dbService.set(this.AUTH_KEY, updated)).pipe(
      tap(() => this._session.set(updated)),
      map(() => void 0)
    );
  }
}
