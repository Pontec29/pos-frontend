import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { map, Observable, tap, from, switchMap, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IndexedDbService } from '../../../shared/services/indexed-db.service';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private http = inject(HttpClient);
    private dbService = inject(IndexedDbService);
    private apiUrl = `${environment.apiUrl}/api/v1/sidebar`;
    private readonly SIDEBAR_CACHE_KEY = 'sidebar_menu';

    // Signal exposed to components
    menuItems = signal<MenuItem[]>([]);

    // Flag para evitar múltiples cargas
    private isLoaded = false;

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'X-Tenant-ID': '1' // TODO: Get from AuthService/Session
        });
    }

    /**
     * Carga el menú desde caché (IndexedDB) o desde la API si no existe.
     * Solo hace petición HTTP si no hay caché.
     */
    loadMenu(): Observable<MenuItem[]> {
        // Si ya está cargado en memoria, retornar directamente
        if (this.isLoaded && this.menuItems().length > 0) {
            return of(this.menuItems());
        }

        // Intentar cargar desde caché primero
        return from(this.dbService.get<MenuItem[]>(this.SIDEBAR_CACHE_KEY)).pipe(
            switchMap(cached => {
                if (cached && cached.length > 0) {
                    // Usar datos cacheados
                    this.menuItems.set(cached);
                    this.isLoaded = true;
                    return of(cached);
                }

                // No hay caché, hacer petición a la API
                return this.fetchMenuFromApi();
            })
        );
    }

    /**
     * Fuerza la recarga del menú desde la API.
     * Usar después del login o cuando cambie la empresa.
     */
    refreshMenu(): Observable<MenuItem[]> {
        this.isLoaded = false;
        return this.fetchMenuFromApi();
    }

    /**
     * Limpia el caché del sidebar.
     * Usar en logout.
     */
    async clearCache(): Promise<void> {
        this.menuItems.set([]);
        this.isLoaded = false;
        await this.dbService.remove(this.SIDEBAR_CACHE_KEY);
    }

    /**
     * Fetch desde la API y guardar en caché
     */
    private fetchMenuFromApi(): Observable<MenuItem[]> {
        return this.http.get<{ success: boolean; data: any[] }>(this.apiUrl, { headers: this.getHeaders() })
            .pipe(
                map(response => this.transformToMenuItem(response.data)),
                tap(items => {
                    this.menuItems.set(items);
                    this.isLoaded = true;
                    // Guardar en caché (fire and forget)
                    this.dbService.set(this.SIDEBAR_CACHE_KEY, items);
                })
            );
    }

    private transformToMenuItem(data: any[]): MenuItem[] {
        return data.map(item => ({
            id: item.id?.toString(),
            label: item.label,
            icon: item.icon,
            routerLink: item.routerLink,
            items: item.items ? this.transformToMenuItem(item.items) : undefined
        }));
    }
}
