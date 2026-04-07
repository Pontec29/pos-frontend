import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { AppConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog.component';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { PaginatorState } from 'primeng/paginator';
import { TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, timeout } from 'rxjs/operators';
import { Proveedor } from './domain/proveedor.interface';
import { ProveedorService } from './services/proveedor.service';
import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';
@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AppButton,
        AppConfirmDialog,
        ModalForm,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        TagModule,
        TooltipModule,
        MenuModule
    ],
    providers: [ConfirmationService],
    templateUrl: './proveedores.html',
    styleUrl: './proveedores.scss'
})
export default class Proveedores implements OnInit {
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly proveedorService = inject(ProveedorService);

    proveedores = signal<Proveedor[]>([]);
    loading = signal<boolean>(true);
    totalRecords = signal<number>(0);
    errorMessage = signal<string | null>(null);

    isEmpty = computed(() => !this.loading() && !this.errorMessage() && this.totalRecords() === 0);
    hasError = computed(() => !this.loading() && Boolean(this.errorMessage()));

    searchText = signal<string>('');
    selectedStatus = signal<boolean | null>(null);
    rows = signal<number>(10);
    first = signal<number>(0);
    sortField = signal<string | null>(null);
    sortOrder = signal<number>(1);

    selectedProveedores = signal<Proveedor[]>([]);

    selectedProveedor = signal<Proveedor | null>(null);
    visible = signal(false);
    isOpenEdit = signal(false);
    modalData = signal<ModalData<Proveedor> | null>(null);

    statusOptions = [
        { label: 'Todos', value: null },
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false }
    ];

    menuItems: MenuItem[] = [];
    selectedProveedorForMenu = signal<Proveedor | null>(null);

    ngOnInit(): void {
        this.initializeMenu();
        this.loadProveedores();
    }

    initializeMenu(): void {
        this.menuItems = [
            {
                label: 'Ver Detalle',
                icon: 'pi pi-eye',
                command: () => {
                    const proveedor = this.selectedProveedorForMenu();
                    if (proveedor) this.onViewProveedor(proveedor);
                }
            },
            {
                label: 'Editar',
                icon: 'pi pi-pencil',
                command: () => {
                    const proveedor = this.selectedProveedorForMenu();
                    if (proveedor) this.editProveedor(proveedor);
                }
            },
            {
                separator: true
            },
            {
                label: 'Eliminar',
                icon: 'pi pi-trash',
                styleClass: 'text-red-500',
                command: () => {
                    const proveedor = this.selectedProveedorForMenu();
                    if (proveedor) this.deleteProveedor(proveedor);
                }
            }
        ];
    }

    openNew(): void {
        this.selectedProveedor.set(null);
        this.visible.set(true);
        this.isOpenEdit.set(false);
        this.modalData.set({ view: 'proveedor', mode: 'create' });
    }

    editProveedor(proveedor: Proveedor): void {
        this.selectedProveedor.set(proveedor);
        this.visible.set(true);
        this.isOpenEdit.set(true);
        this.modalData.set({ view: 'proveedor', mode: 'update', dataUpdate: proveedor });
    }

    deleteProveedor(proveedor: Proveedor): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el proveedor "${proveedor.RAZONSOCIAL || proveedor.NOMBRE_PROVEEDOR}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'danger',
            accept: () => {
                this.proveedorService.delete(proveedor.ID_PROVEEDOR).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Proveedor eliminado correctamente',
                                life: 3000
                            });
                            this.loadProveedores();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'No se pudo eliminar el proveedor',
                                life: 3000
                            });
                        }
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.message || 'No se pudo eliminar el proveedor',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    onCancelDialog(): void {
        this.visible.set(false);
        this.selectedProveedor.set(null);
        this.modalData.set(null);
    }

    onModalClosed(event: { saved: boolean; result?: unknown }): void {
        this.visible.set(false);
        this.selectedProveedor.set(null);
        this.modalData.set(null);
        if (event.saved) {
            this.loadProveedores();
        }
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        if (event.sortField) {
            this.sortField.set(event.sortField as string);
            this.sortOrder.set(event.sortOrder ?? 1);
            this.loadProveedores();
        }
    }

    onPageChange(event: PaginatorState): void {
        this.first.set(event.first ?? 0);
        this.rows.set(event.rows ?? 10);
        this.loadProveedores();
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
        this.first.set(0);
        this.loadProveedores();
    }

    onStatusChange(value: boolean | null): void {
        this.selectedStatus.set(value);
        this.first.set(0);
        this.loadProveedores();
    }

    onViewProveedor(proveedor: Proveedor): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Proveedor',
            detail: proveedor.RAZONSOCIAL || proveedor.NOMBRE_PROVEEDOR || `Proveedor #${proveedor.ID_PROVEEDOR}`,
            life: 2500
        });
    }

    loadProveedores(): void {
        this.loading.set(true);
        this.errorMessage.set(null);

        this.proveedorService
            .getAll()
            .pipe(timeout(15000), finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (!res.success) {
                        this.errorMessage.set(res.message || 'No se pudieron cargar los proveedores.');
                        this.proveedores.set([]);
                        this.totalRecords.set(0);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.message || 'No se pudieron cargar los proveedores.'
                        });
                        return;
                    }

                    let filtered = [...res.data];

                    if (this.searchText()) {
                        const search = this.searchText().toLowerCase();
                        filtered = filtered.filter((p) => {
                            const haystack =
                                `${p.ID_PROVEEDOR} ${p.RUC} ${p.RAZONSOCIAL} ${p.NOMBRE_PROVEEDOR} ${p.CODIGO || ''} ${p.EMAIL || ''} ${p.TELEFONO || ''} ${p.DIRECCION || ''}`.toLowerCase();
                            return haystack.includes(search);
                        });
                    }

                    if (this.selectedStatus() !== null) {
                        filtered = filtered.filter((p) => Boolean(p.ACTIVO) === this.selectedStatus());
                    }

                    const field = this.sortField();
                    const order = this.sortOrder();
                    if (field) {
                        filtered.sort((a, b) => {
                            const v1 = (a as any)[field];
                            const v2 = (b as any)[field];

                            if (v1 == null && v2 != null) return -1;
                            if (v1 != null && v2 == null) return 1;
                            if (v1 == null && v2 == null) return 0;

                            if (v1 != null && v2 != null && v1 < v2) return -1 * order;
                            if (v1 != null && v2 != null && v1 > v2) return 1 * order;
                            return 0;
                        });
                    }

                    this.totalRecords.set(filtered.length);

                    const start = this.first();
                    const end = start + this.rows();
                    this.proveedores.set(filtered.slice(start, end));
                },
                error: (err) => {
                    const msg =
                        err?.name === 'TimeoutError'
                            ? 'Tiempo de espera agotado al cargar los proveedores.'
                            : err?.message || 'Error al cargar proveedores';
                    this.errorMessage.set(msg);
                    this.proveedores.set([]);
                    this.totalRecords.set(0);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: msg
                    });
                }
            });
    }
}
