import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppButton } from '@shared/ui/button';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { Compra } from './domain/compras.interface';
import { ComprasService } from './service/compras.service';
import { MessageService, MenuItem } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { TableLazyLoadEvent } from 'primeng/table';
import { finalize, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-compras',
  imports: [
    CommonModule,
    FormsModule,
    AppButton,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FILTER_MODULES,
    TagModule,
    TooltipModule,
    MenuModule
  ],
  templateUrl: './compras.html',
  styleUrl: './compras.scss',
})
export default class Compras implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  private readonly compraService = inject(ComprasService);

  compras = signal<Compra[]>([]);
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

  selectedCompras = signal<Compra[]>([]);

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ];

  menuItems: MenuItem[] = [];
  selectedCompraForMenu = signal<Compra | null>(null);

  ngOnInit(): void {
    this.initializeMenu();
    this.loadCompras();
  }

  initializeMenu(): void {
    this.menuItems = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => {
          const compra = this.selectedCompraForMenu();
          if (compra) this.onViewCompra(compra);
        }
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
          const compra = this.selectedCompraForMenu();
          if (compra) this.onEditCompra(compra);
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
          const compra = this.selectedCompraForMenu();
          if (compra) this.onDeleteCompra(compra);
        }
      }
    ];
  }

  loadCompras(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.compraService
      .getAll(undefined)
      .pipe(timeout(15000), finalize(() => this.loading.set(false)))
      .subscribe({
      next: (res) => {
        if (!res.success) {
          this.errorMessage.set(res.message || 'No se pudo cargar las compras.');
          this.compras.set([]);
          this.totalRecords.set(0);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message
          });
          return;
        }

        let filtered = [...res.data];

        if (this.searchText()) {
          const search = this.searchText().toLowerCase();
          filtered = filtered.filter(c => {
            const haystack = `${c.ID_COMPRA} ${c.PROVEEDOR} ${c.EMPRESA} ${c.ID_TIPO_COMPROBANTE} ${c.SERIE} ${c.NUMERO}`.toLowerCase();
            return haystack.includes(search);
          });
        }

        if (this.selectedStatus() !== null) {
          filtered = filtered.filter(c => Boolean(c.ESTADO) === this.selectedStatus());
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
        this.compras.set(filtered.slice(start, end));
      },
      error: (err) => {
        const msg = err?.name === 'TimeoutError'
          ? 'Tiempo de espera agotado al cargar las compras.'
          : (err?.message || 'Error al cargar compras');
        this.errorMessage.set(msg);
        this.compras.set([]);
        this.totalRecords.set(0);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg
        });
      }
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder ?? 1);
      this.loadCompras();
    }
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.loadCompras();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.first.set(0);
    this.loadCompras();
  }

  onStatusChange(value: boolean | null): void {
    this.selectedStatus.set(value);
    this.first.set(0);
    this.loadCompras();
  }

  onEditCompra(compra: Compra): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Editar',
      detail: `Editar compra #${compra.ID_COMPRA}`
    });
  }

  onDeleteCompra(compra: Compra): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Eliminar',
      detail: `Compra #${compra.ID_COMPRA} eliminada`
    });
  }

  onViewCompra(compra: Compra): void {
    this.router.navigate(['/compras', compra.ID_COMPRA]);
  }

  getEstadoSeverity(estadoDescripcion: string | null | undefined): 'success' | 'danger' | 'warn' | 'info' {
    const value = (estadoDescripcion || '').toUpperCase();
    if (value === 'PROCESADO') return 'success';
    if (value === 'ANULADO' || value === 'INACTIVO') return 'danger';
    if (value === 'REGISTRADO') return 'info';
    return 'warn';
  }

  openNew() {
    this.router.navigate(['/compras/nueva']);
  }
}
