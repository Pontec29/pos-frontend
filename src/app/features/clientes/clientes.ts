import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { PaginatorState } from 'primeng/paginator';
import { TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, timeout } from 'rxjs/operators';

import { ClienteFormDialog } from './components/cliente-form-dialog';
import { Cliente, ClienteFormDto, ClienteTable } from './models/cliente.model';
import { ClientesService } from './services/clientes';

@Component({
    selector: 'app-clientes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AppButton,
        ModalConfirmacionComponent,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        TooltipModule,
        TagModule,
        ClienteFormDialog,
        MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './clientes.html',
    styleUrl: './clientes.scss'
})
export default class ClientesPage implements OnInit {
    private readonly clientesService = inject(ClientesService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    clientes = signal<ClienteTable[]>([]);
    loading = signal<boolean>(true);
    totalRecords = signal<number>(0);
    errorMessage = signal<string | null>(null);

    hasError = computed(() => !this.loading() && Boolean(this.errorMessage()));

    searchText = signal<string>('');
    selectedStatus = signal<boolean | null>(null);
    rows = signal<number>(10);
    first = signal<number>(0);
    sortField = signal<string | null>(null);
    sortOrder = signal<number>(1);

    selectedClientes: Cliente[] = [];

     selectedCliente = signal<ClienteTable | null>(null);
    visible = signal(false);

    statusOptions: Array<{ label: string; value: boolean | null }> = [
        { label: 'Todos', value: null },
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false }
    ];

    menuItems: MenuItem[] = [];
    selectedClienteForMenu = signal<ClienteTable | null>(null);

    ngOnInit(): void {
        this.initializeMenu();
        this.loadClientes();
    }

    initializeMenu(): void {
        this.menuItems = [
            {
                label: 'Ver Detalle',
                icon: 'pi pi-eye',
                command: () => {
                    const cliente = this.selectedClienteForMenu();
                    if (cliente) this.onViewCliente(cliente);
                }
            },
            {
                label: 'Editar',
                icon: 'pi pi-pencil',
                command: () => {
                    const cliente = this.selectedClienteForMenu();
                    if (cliente) this.editCliente(cliente);
                }
            },
            { separator: true },
            {
                label: 'Cambiar Estado',
                icon: 'pi pi-trash',
                styleClass: 'text-red-500',
                command: () => {
                    const cliente = this.selectedClienteForMenu();
                    if (cliente) this.onToggleStatus(cliente);
                }
            }
        ];
    }

    openNew(): void {
        this.selectedCliente.set(null);
        this.visible.set(true);
    }

    editCliente(cliente: ClienteTable): void {
        this.selectedCliente.set(cliente);
        this.visible.set(true);
    }

    onSaveCliente(formValue: ClienteFormDto): void {
        const clienteActual = this.selectedCliente();
        const request$ = clienteActual
            ? this.clientesService.update(clienteActual.id, formValue)
            : this.clientesService.create(formValue);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: clienteActual ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente',
                    life: 3000
                });
                this.visible.set(false);
                this.selectedCliente.set(null);
                this.loadClientes();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.message || (clienteActual ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente'),
                    life: 3000
                });
            }
        });
    }

    onCancelDialog(): void {
        this.visible.set(false);
        this.selectedCliente.set(null);
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        if (event.sortField) {
            this.sortField.set(event.sortField as string);
            this.sortOrder.set(event.sortOrder ?? 1);
            this.loadClientes();
        }
    }

    onPageChange(event: PaginatorState): void {
        this.first.set(event.first ?? 0);
        this.rows.set(event.rows ?? 10);
        this.loadClientes();
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
        this.first.set(0);
        this.loadClientes();
    }

    onStatusChange(value: boolean | null): void {
        this.selectedStatus.set(value);
        this.first.set(0);
        this.loadClientes();
    }

    onViewCliente(cliente: ClienteTable): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Cliente',
            detail: cliente.razonSocial || `Cliente #${cliente.id}`,
            life: 2500
        });
    }

    onToggleStatus(cliente: ClienteTable): void {
        const nextStatus = !cliente.activo;
        const verb = nextStatus ? 'activar' : 'desactivar';

        this.confirmationService.confirm({
            message: `¿Está seguro de ${verb} el cliente "${cliente.razonSocial}"?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'danger',
            accept: () => {
                this.clientesService.toggleStatus(cliente.id, nextStatus).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: `Cliente ${nextStatus ? 'activado' : 'desactivado'} correctamente`,
                            life: 3000
                        });
                        this.loadClientes();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.message || `No se pudo ${verb} el cliente`,
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    loadClientes(): void {
        this.loading.set(true);
        this.errorMessage.set(null);

        this.clientesService
            .getAll()
            .pipe(timeout(15000), finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    let filtered = [...res.data || []];

                    if (this.searchText()) {
                        const search = this.searchText().toLowerCase();
                        filtered = filtered.filter((c) => {
                            const haystack = `${c.id} ${c.numeroDocumento} ${c.razonSocial} ${c.genero || ''}`.toLowerCase();
                            return haystack.includes(search);
                        });
                    }

                    if (this.selectedStatus() !== null) {
                        filtered = filtered.filter((c) => Boolean(c.activo) === this.selectedStatus());
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
                    this.clientes.set(filtered.slice(start, end));
                },
                error: (err) => {
                    const msg =
                        err?.name === 'TimeoutError'
                            ? 'Tiempo de espera agotado al cargar los clientes.'
                            : err?.message || 'Error al cargar clientes';
                    this.errorMessage.set(msg);
                    this.clientes.set([]);
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
