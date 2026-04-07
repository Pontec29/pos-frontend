import { Injectable, inject, signal, computed } from '@angular/core';
import { IndexedDbService } from '@shared/services/indexed-db.service';
import { JerarquiaSucursal, JerarquiaAlmacen } from '../../core/models/auth.models';

/**
 * Servicio que gestiona el contexto operativo actual:
 * sucursal y almacén seleccionados.
 * Persiste la selección en IndexedDB para uso global.
 */
@Injectable({
    providedIn: 'root'
})
export class ContextoOperativoService {

    private readonly dbService = inject(IndexedDbService);
    private readonly SUCURSAL_KEY = 'contexto_sucursal';
    private readonly ALMACEN_KEY = 'contexto_almacen';

    /** Jerarquía completa cargada desde la sesión */
    readonly jerarquia = signal<JerarquiaSucursal[]>([]);

    /** Sucursal seleccionada */
    readonly selectedSucursal = signal<JerarquiaSucursal | null>(null);

    /** Almacén seleccionado */
    readonly selectedAlmacen = signal<JerarquiaAlmacen | null>(null);

    /** Almacenes disponibles según la sucursal seleccionada */
    readonly almacenesDisponibles = computed(() => {
        const sucursal = this.selectedSucursal();
        return sucursal?.almacenes ?? [];
    });

    /** IDs para uso en peticiones HTTP */
    readonly sucursalId = computed(() => this.selectedSucursal()?.sucursalId ?? null);
    readonly almacenId = computed(() => this.selectedAlmacen()?.almacenId ?? null);

    /**
     * Inicializa el servicio cargando jerarquía y restaurando selección previa.
     */
    async init(jerarquia: JerarquiaSucursal[]): Promise<void> {
        this.jerarquia.set(jerarquia);

        const savedSucursalId = await this.dbService.get<number>(this.SUCURSAL_KEY);
        const savedAlmacenId = await this.dbService.get<number>(this.ALMACEN_KEY);

        // Restaurar sucursal guardada o seleccionar la primera
        let sucursal = jerarquia.find(s => s.sucursalId === savedSucursalId) ?? null;
        if (!sucursal && jerarquia.length > 0) {
            sucursal = jerarquia[0];
        }

        if (sucursal) {
            this.selectedSucursal.set(sucursal);

            // Restaurar almacén guardado o seleccionar el principal / primero
            let almacen = sucursal.almacenes.find(a => a.almacenId === savedAlmacenId) ?? null;
            if (!almacen && sucursal.almacenes.length > 0) {
                almacen = sucursal.almacenes.find(a => a.esPrincipal) ?? sucursal.almacenes[0];
            }

            if (almacen) {
                this.selectedAlmacen.set(almacen);
            }

            await this.persistir();
        }
    }

    /**
     * Cambia la sucursal seleccionada y auto-selecciona el almacén principal.
     */
    async cambiarSucursal(sucursal: JerarquiaSucursal): Promise<void> {
        this.selectedSucursal.set(sucursal);

        // Auto-seleccionar almacén principal o primero disponible
        const almacen = sucursal.almacenes.find(a => a.esPrincipal) ?? sucursal.almacenes[0] ?? null;
        this.selectedAlmacen.set(almacen);

        await this.persistir();
    }

    /**
     * Cambia el almacén seleccionado.
     */
    async cambiarAlmacen(almacen: JerarquiaAlmacen): Promise<void> {
        this.selectedAlmacen.set(almacen);
        await this.persistir();
    }

    /**
     * Persiste la selección actual en IndexedDB.
     */
    private async persistir(): Promise<void> {
        const sucId = this.selectedSucursal()?.sucursalId;
        const almId = this.selectedAlmacen()?.almacenId;

        if (sucId != null) {
            await this.dbService.set(this.SUCURSAL_KEY, sucId);
        }
        if (almId != null) {
            await this.dbService.set(this.ALMACEN_KEY, almId);
        }
    }

    /**
     * Limpia el contexto (para logout).
     */
    async limpiar(): Promise<void> {
        this.selectedSucursal.set(null);
        this.selectedAlmacen.set(null);
        this.jerarquia.set([]);
        await this.dbService.remove(this.SUCURSAL_KEY);
        await this.dbService.remove(this.ALMACEN_KEY);
    }
}
