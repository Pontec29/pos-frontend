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


import { AlmacenFormDialog } from './components/almacen-form-dialog';
import { AlmacenService } from './services/almacen.service';
import { Almacen, CreateAlmacenDTO } from './domain/almacen.type';
import { AlmacenAdapter } from './domain/almacen.adapter';

@Component({
    selector: 'app-almacenes',
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
        AlmacenFormDialog
    ],

    providers: [ConfirmationService],
    templateUrl: './almacenes.html',
    styleUrl: './almacenes.scss'
})
export default class Almacenes implements OnInit {
    private readonly messageService = inject(MessageService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly almacenService = inject(AlmacenService);


    // Signals de datos
    almacenes = signal<Almacen[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Signals de diálogo
    visible = signal(false);
    selectedAlmacen = signal<Almacen | null>(null);

    // Filtros
    searchQuery = signal('');
    statusOptions = [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' }
    ];
    selectedStatus = signal<string | null>(null);

    // Computed: almacenes filtrados
    filteredAlmacenes = computed(() => {
        let items = this.almacenes();
        const query = this.searchQuery().toLowerCase().trim();
        const status = this.selectedStatus();

        if (query) {
            items = items.filter(a =>
                a.nombre.toLowerCase().includes(query) ||
                a.codigoSunat.toLowerCase().includes(query)
            );
        }

        if (status) {
            const isActive = status === 'Activo';
            items = items.filter(a => a.activo === isActive);
        }

        return items;
    });

    // Paginación
    rows = signal(10);
    first = signal(0);

    ngOnInit() {
        this.loadAlmacenes();
    }

    loadAlmacenes() {
        this.loading.set(true);
        this.error.set(null);

        this.almacenService.getAll().subscribe({
            next: (res) => {
                if (res.success) {
                    this.almacenes.set(res.data);
                } else {
                    this.error.set(res.message || 'Error al cargar almacenes');
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar almacenes:', err);
                this.error.set('Error al conectar con el servidor');
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los almacenes',
                    life: 3000
                });
            }
        });
    }

    openNew() {
        this.selectedAlmacen.set(null);
        this.visible.set(true);
    }

    editAlmacen(almacen: Almacen) {
        this.selectedAlmacen.set(almacen);
        this.visible.set(true);
    }

    deleteAlmacen(almacen: Almacen) {
        this.confirmDialog.confirm('delete', almacen.nombre, () => {
            this.almacenService.delete(almacen.id).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.almacenes.update(values => values.filter(v => v.id !== almacen.id));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Almacén eliminado correctamente',
                            life: 3000
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'No se pudo eliminar el almacén',
                            life: 3000
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al eliminar almacén:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo eliminar el almacén',
                        life: 3000
                    });
                }
            });
        });
    }


    onSaveAlmacen(formValue: Record<string, unknown>) {
        const dto: CreateAlmacenDTO = AlmacenAdapter.toCreateDTO(formValue);
        const id = formValue['id'] as number | null;

        if (id) {
            this.almacenService.update(id, dto).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Almacén actualizado correctamente',
                            life: 3000
                        });
                        this.loadAlmacenes();
                        this.visible.set(false);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al actualizar el almacén',
                            life: 3000
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al actualizar almacén:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el almacén',
                        life: 3000
                    });
                }
            });
        } else {
            this.almacenService.create(dto).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Almacén creado correctamente',
                            life: 3000
                        });
                        this.loadAlmacenes();
                        this.visible.set(false);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al crear el almacén',
                            life: 3000
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al crear almacén:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo crear el almacén',
                        life: 3000
                    });
                }
            });
        }
    }

    onCancelDialog() {
        this.visible.set(false);
        this.selectedAlmacen.set(null);
    }

    onPageChange(event: { first?: number; rows?: number }) {
        this.first.set(event.first ?? 0);
        this.rows.set(event.rows ?? 10);
    }
}

