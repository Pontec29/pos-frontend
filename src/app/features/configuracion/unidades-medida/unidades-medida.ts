import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';
import { UnidadMedidaService } from './services/unidad-medida.service';
import { UnidadMedidaListar } from './domain/unidad-medida.interface';
import { Tag } from "primeng/tag";
import { AlertService } from '@shared/services/alert.service';

@Component({
    selector: 'app-unidades-medida',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        AppButton,
        ModalConfirmacionComponent,
        ModalForm,
        Tag
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './unidades-medida.html',
    styleUrl: './unidades-medida.scss'
})
export default class UnidadesMedida implements OnInit {
    private confirmationService = inject(ConfirmationService);
    private unidadMedidaService = inject(UnidadMedidaService);
    private alertService = inject(AlertService);

    // Signals
    unidades = signal<UnidadMedidaListar[]>([]);
    visible = signal(false);
    loading = signal(false);
    error = signal<string | null>(null);
    modalData = signal<ModalData<UnidadMedidaListar> | null>(null);

    // Filtros
    searchQuery = signal('');
    statusOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];
    selectedStatus = signal<boolean | null>(null);

    filtered = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        const status = this.selectedStatus();
        let data = this.unidades();

        if (status !== null) {
            data = data.filter(u => u.ACTIVO === status);
        }

        if (!q) return data;

        return data.filter(u =>
            [u.ID_UNIDAD_MEDIDA.toString(), u.CODIGO_SUNAT, u.DESCRIPCION_SUNAT, u.Abreviatura, u.NOMBRE_COMERCIAL]
                .some(v => v?.toLowerCase().includes(q))
        );
    });

    paged = computed(() => {
        const list = this.filtered();
        const start = this.first();
        const end = start + this.rows();
        return list.slice(start, end);
    });

    // Paginación
    rows = signal(10);
    first = signal(0);

    ngOnInit() {
        this.loadUnidades();
    }

    loadUnidades() {
        this.loading.set(true);
        this.error.set(null);

        this.unidadMedidaService.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.unidades.set(response.data);
                } else {
                    this.error.set(response.message || 'Error al cargar unidades de medida');
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar unidades de medida:', err);
                this.error.set('Error al conectar con el servidor');
                this.loading.set(false);
                this.alertService.error('No se pudieron cargar las unidades de medida');
            }
        });
    }

    openNew() {
        this.modalData.set({ view: 'unidad-medida', mode: 'create' });
        this.visible.set(true);
    }

    editUnidad(unidad: UnidadMedidaListar) {
        this.modalData.set({ view: 'unidad-medida', mode: 'update', dataUpdate: unidad });
        this.visible.set(true);
    }

    deleteUnidad(unidad: UnidadMedidaListar) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la unidad de medida "${unidad.NOMBRE_COMERCIAL}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'danger',
            accept: () => {
                this.unidadMedidaService.delete(unidad.ID_UNIDAD_MEDIDA).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.unidades.update(values => values.filter(val => val.ID_UNIDAD_MEDIDA !== unidad.ID_UNIDAD_MEDIDA));
                            this.alertService.success('Unidad de medida eliminada correctamente');
                        } else {
                            this.alertService.error(response.message || 'No se pudo eliminar la unidad de medida');
                        }
                    },
                    error: (err) => {
                        console.error('Error al eliminar unidad de medida:', err);
                        this.alertService.error('No se pudo eliminar la unidad de medida');
                    }
                });
            }
        });
    }

    onModalClosed(event: { saved: boolean; result?: any }) {
        this.visible.set(false);
        this.modalData.set(null);
        if (event.saved) {
            this.loadUnidades();
            const msg = event.result?.message || 'Operación realizada correctamente';
            this.alertService.success(msg);
        }
    }

    onPageChange(event: any) {
        this.first.set(event.first);
        this.rows.set(event.rows);
    }
}
