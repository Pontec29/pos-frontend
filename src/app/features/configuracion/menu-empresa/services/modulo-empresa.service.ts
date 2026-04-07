import { Injectable, inject, Signal, isSignal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Modulo } from '../domain/modulo.interface';
import { ModuloAdapter } from '../domain/modulo.adapter';

export interface ModuloSyncRequest {
    idsAgregar: number[];
    idsEliminar: number[];
}

@Injectable({
    providedIn: 'root'
})
export class ModuloEmpresaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/v1/companies`;

    /**
     * Obtiene el recurso del árbol de módulos de una empresa
     */
    obtenerArbolModulos(empresaId: number | Signal<number | null>) {
        return httpResource<Modulo[]>(() => {
            const id = isSignal(empresaId) ? empresaId() : empresaId;
            return id ? `${this.apiUrl}/${id}/modules-tree` : undefined;
        }, {
            parse: (res: any) => ModuloAdapter.adaptarLista(res.data)
        });
    }

    /**
     * Sincroniza módulos de una empresa (Recurso Reactivo)
     */
    sincronizarModulos(empresaId: Signal<number | null>, trigger: Signal<ModuloSyncRequest | null>) {
        return httpResource<void>(() => {
            const id = empresaId();
            const body = trigger();
            if (!id || !body) return undefined;

            return {
                url: `${this.apiUrl}/${id}/modules`,
                method: 'PATCH',
                body: body
            };
        });
    }
}
