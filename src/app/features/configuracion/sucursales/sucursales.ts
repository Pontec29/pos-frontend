import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


import { AppButton } from '@shared/ui/button';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';


import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';
import { SucursalService } from './services/sucursal.service';
import { Sucursal, CreateSucursalDTO } from './domain/sucursal.type';
import { SucursalAdapter } from './domain/sucursal.adapter';

@Component({
    selector: 'app-sucursales',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        TagModule,
        TooltipModule,
        ConfirmDialogModule,
        AppButton,
        ModalForm
    ],


    providers: [ConfirmationService],
    templateUrl: './sucursales.html',
    styleUrl: './sucursales.scss'
})
export default class Sucursales implements OnInit {
    private readonly messageService = inject(MessageService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly sucursalService = inject(SucursalService);


    // Signals de datos
    sucursales = signal<Sucursal[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Signals de diálogo
    visible = signal(false);
    modalData = signal<ModalData<Sucursal> | null>(null);

    // Filtros
    searchQuery = signal('');
    statusOptions = [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' }
    ];
    selectedStatus = signal<string | null>(null);

    // Computed: sucursales filtradas
    filteredSucursales = computed(() => {
        let items = this.sucursales();
        const query = this.searchQuery().toLowerCase().trim();
        const status = this.selectedStatus();

        if (query) {
            items = items.filter(s =>
                s.nombre.toLowerCase().includes(query) ||
                s.direccion.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query)
            );
        }

        if (status) {
            const isActive = status === 'Activo';
            items = items.filter(s => s.activo === isActive);
        }

        return items;
    });

    // Paginación
    rows = signal(10);
    first = signal(0);

    ngOnInit() {
        this.loadSucursales();
    }

    loadSucursales() {
        this.loading.set(true);
        this.error.set(null);

        this.sucursalService.getAll().subscribe({
            next: (res) => {
                if (res.success) {
                    this.sucursales.set(res.data);
                } else {
                    this.error.set(res.message || 'Error al cargar sucursales');
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar sucursales:', err);
                this.error.set('Error al conectar con el servidor');
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las sucursales',
                    life: 3000
                });
            }
        });
    }

    openNew() {
        this.modalData.set({ view: 'sucursal', mode: 'create' });
        this.visible.set(true);
    }

    editSucursal(sucursal: Sucursal) {
        this.modalData.set({ view: 'sucursal', mode: 'update', dataUpdate: sucursal });
        this.visible.set(true);
    }

    deleteSucursal(sucursal: Sucursal) {
        this.confirmDialog.confirm('delete', sucursal.nombre, () => {
            this.sucursalService.delete(sucursal.id).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.sucursales.update(values => values.filter(v => v.id !== sucursal.id));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Sucursal eliminada correctamente',
                            life: 3000
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'No se pudo eliminar la sucursal',
                            life: 3000
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al eliminar sucursal:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar la sucursal',
                        life: 3000
                    });
                }
            });
        });
    }


    onModalClosed(event: { saved: boolean; result?: unknown }) {
        this.visible.set(false);
        this.modalData.set(null);
        if (event.saved) {
            this.loadSucursales();
        }
    }

    onPageChange(event: { first?: number; rows?: number }) {
        this.first.set(event.first ?? 0);
        this.rows.set(event.rows ?? 10);
    }
}
