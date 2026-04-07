import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeNode, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { LoadingSpinner } from '@shared/ui/loading-spinner/loading-spinner';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { ModuloEmpresaService, ModuloSyncRequest } from './services/modulo-empresa.service';
import { Modulo } from './domain/modulo.interface';
import { CompanyService } from '../empresas/services/company.service';

@Component({
    selector: 'app-menu-empresa',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CheckboxModule,
        ToggleSwitchModule,
        ...PRIMENG_TABLE_MODULES,
        AppButton,
        LoadingSpinner,
        ErrorState
    ],
    providers: [MessageService],
    templateUrl: './menu-empresa.html',
    styleUrl: './menu-empresa.scss'
})
export default class MenuEmpresaPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly moduloService = inject(ModuloEmpresaService);
    private readonly companyService = inject(CompanyService);
    private readonly messageService = inject(MessageService);

    // Estado Base
    empresaId = signal<number | null>(null);
    private initialIds: number[] = [];
    private syncTrigger = signal<ModuloSyncRequest | null>(null);

    // Recursos Reactivos (100% Declarativos delegados al servicio)
    empresaResource = this.companyService.getEmpresaPorId(this.empresaId);
    modulosResource = this.moduloService.obtenerArbolModulos(this.empresaId);
    syncResource = this.moduloService.sincronizarModulos(this.empresaId, this.syncTrigger);

    // Signals Computados para la UI (Aplanamiento de estado)
    // @ts-ignore
    empresaNombre = computed(() => this.empresaResource.value()?.data?.razonSocial || '...');
    modulos = computed(() => this.convertirATreeNodes(this.modulosResource.value() || []));
    loading = computed(() => this.modulosResource.isLoading() || this.empresaResource.isLoading());
    guardando = computed(() => this.syncResource.isLoading());
    error = computed(() => (this.modulosResource.error() || this.empresaResource.error()) ? 'Error en la carga' : null);

    // Selección
    moduloSeleccionado = signal<TreeNode | null>(null);

    // Búsqueda y Filtros
    searchTerm = signal('');
    activeFilter = signal<'todos' | 'habilitados' | 'reportes'>('todos');

    // Módulos filtrados (computado)
    modulosFiltrados = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const filter = this.activeFilter();
        const allNodes = this.modulos();

        let filtered = allNodes;

        if (filter === 'habilitados') {
            filtered = filtered.filter(n => this.isNodoHabilitado(n));
        }

        if (term) {
            filtered = filtered.filter(n => this.matchNodoRecursive(n, term));
        }

        return filtered;
    });

    constructor() {
        // Auto-selección del primer módulo al terminar de cargar
        effect(() => {
            const nodes = this.modulos();
            if (nodes.length > 0 && !this.moduloSeleccionado()) {
                this.moduloSeleccionado.set(nodes[0]);
                this.initialIds = this.recolectarIdsSeleccionados(nodes);
            }
        });

        // Manejo declarativo del guardado
        effect(() => {
            const status = this.syncResource.status();
            const trigger = this.syncTrigger();

            if (status === 'resolved' && trigger) {
                this.messageService.add({
                    severity: 'success', summary: 'Éxito',
                    detail: 'Módulos actualizados correctamente', life: 3000
                });
                // Actualizamos IDs iniciales para detectar nuevos cambios
                this.initialIds = this.recolectarIdsSeleccionados(this.modulos());
                this.syncTrigger.set(null);
            }

            if (status === 'error' && trigger) {
                const err = this.syncResource.error() as any;
                const mensaje = err?.error?.message || 'No se pudieron guardar los cambios';
                this.messageService.add({
                    severity: 'error', summary: 'Error',
                    detail: mensaje, life: 5000
                });
                this.syncTrigger.set(null);
            }
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.empresaId.set(id ? Number(id) : null);
    }

    refrescar(): void {
        this.modulosResource.reload();
        this.empresaResource.reload();
    }

    private convertirATreeNodes(modulos: Modulo[]): TreeNode[] {
        return modulos.map(modulo => ({
            data: {
                id: modulo.id,
                etiqueta: modulo.etiqueta,
                icono: modulo.icono,
                ruta: modulo.ruta || '-',
                seleccionado: modulo.seleccionado
            },
            expanded: true,
            children: modulo.hijos ? this.convertirATreeNodes(modulo.hijos) : []
        }));
    }

    toggleSeleccion(nodo: TreeNode): void {
        if (nodo.data) {
            if (nodo.data.seleccionado) {
                this.seleccionarPadres(nodo);
            } else {
                this.deseleccionarHijos(nodo);
            }
        }
    }

    private seleccionarPadres(nodo: TreeNode): void {
        // Lógica de padres se maneja al recolectar antes de guardar
    }

    private deseleccionarHijos(nodo: TreeNode): void {
        if (nodo.children) {
            for (const hijo of nodo.children) {
                if (hijo.data) {
                    hijo.data.seleccionado = false;
                }
                this.deseleccionarHijos(hijo);
            }
        }
    }

    // Helpers para UI
    isNodoHabilitado(nodo: TreeNode): boolean {
        if (nodo.data?.seleccionado) return true;
        if (nodo.children) {
            return nodo.children.some(h => this.isNodoHabilitado(h));
        }
        return false;
    }

    matchNodoRecursive(nodo: TreeNode, term: string): boolean {
        const labelMatch = (nodo.data?.etiqueta || '').toLowerCase().includes(term);
        const routeMatch = (nodo.data?.ruta || '').toLowerCase().includes(term);
        if (labelMatch || routeMatch) return true;
        if (nodo.children) {
            return nodo.children.some(h => this.matchNodoRecursive(h, term));
        }
        return false;
    }

    seleccionarModulo(nodo: TreeNode): void {
        this.moduloSeleccionado.set(nodo);
    }

    toggleAll(modulo: TreeNode, valor: boolean): void {
        if (modulo.children) {
            modulo.children.forEach(h => {
                if (h.data) h.data.seleccionado = valor;
                this.toggleAll(h, valor);
            });
        }
    }

    guardarCambios(): void {
        const id = this.empresaId();
        if (!id) return;

        const idsSeleccionados = this.recolectarIdsSeleccionados(this.modulos());
        
        const idsAgregar = idsSeleccionados.filter(id => !this.initialIds.includes(id));
        const idsEliminar = this.initialIds.filter(id => !idsSeleccionados.includes(id));

        if (idsAgregar.length === 0 && idsEliminar.length === 0) {
            this.messageService.add({
                severity: 'info',
                summary: 'Sin cambios',
                detail: 'No hay cambios para guardar', life: 3000
            });
            return;
        }

        // Disparamos el trigger para iniciar la sincronización vía httpResource
        this.syncTrigger.set({ idsAgregar, idsEliminar });
    }

    private recolectarIdsSeleccionados(nodos: TreeNode[]): number[] {
        const ids: number[] = [];
        const recolectar = (nodoList: TreeNode[]) => {
            for (const nodo of nodoList) {
                if (nodo.data?.seleccionado) ids.push(nodo.data.id);
                if (nodo.children) recolectar(nodo.children);
            }
        };
        recolectar(nodos);
        this.agregarPadresDeSeleccionados(nodos, ids);
        return [...new Set(ids)];
    }

    private agregarPadresDeSeleccionados(nodos: TreeNode[], ids: number[]): void {
        const tieneHijoSeleccionado = (nodo: TreeNode): boolean => {
            if (nodo.data?.seleccionado) return true;
            if (nodo.children) return nodo.children.some(hijo => tieneHijoSeleccionado(hijo));
            return false;
        };

        const marcarPadres = (nodoList: TreeNode[]) => {
            for (const nodo of nodoList) {
                if (nodo.children && nodo.children.length > 0) {
                    if (tieneHijoSeleccionado(nodo) && nodo.data) {
                        ids.push(nodo.data.id);
                    }
                    marcarPadres(nodo.children);
                }
            }
        };
        marcarPadres(nodos);
    }

    volver(): void {
        this.router.navigate(['/configuracion/empresas']);
    }
}
