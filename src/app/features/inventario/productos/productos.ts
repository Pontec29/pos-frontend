import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ProductoService } from './services/producto.service';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { Producto } from './domain/productos.interface';
import { Router } from '@angular/router';
import { PaginatorState } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { TableLazyLoadEvent } from 'primeng/table';
import { finalize, timeout } from 'rxjs/operators';
import { CurrencyFormatPipe } from '@shared/pipe/currencyFormat.pipe';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FILTER_MODULES,
    AppButton,
    ModalConfirmacionComponent,
    CurrencyFormatPipe,
    TagModule,
    TooltipModule,
    MenuModule
  ],
  providers: [ConfirmationService],
  templateUrl: './productos.html',
  styleUrl: './productos.scss'
})
export default class ProductosPage implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private productoService = inject(ProductoService);

  productos = signal<Producto[]>([]);
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

  selectedProductos: Producto[] = [];

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ];

  menuItems: MenuItem[] = [];
  selectedProductoForMenu = signal<Producto | null>(null);

  ngOnInit() {
    this.initializeMenu();
    this.loadProductos();
  }

  openNew() {
    this.router.navigate(['/inventario/producto/nuevo']);
  }

  onViewProducto(producto: Producto): void {
    this.editProducto(producto);
  }

  editProducto(producto: Producto) {
    if (producto.ID_PRODUCTO) {
      this.router.navigate(['/inventario/producto/editar', producto.ID_PRODUCTO]);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin ID',
        detail: 'Este producto no tiene un ID válido para la edición.'
      });
    }
  }

  deleteProducto(producto: Producto) {
    this.confirmationService.confirm({
      message: `¿Está seguro de desactivar el producto "${producto.NOMBRE}"?`,
      header: 'Confirmar Acción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'danger',
      accept: () => {
        this.productoService.updateStatus(producto.ID_PRODUCTO, false).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadProductos();
              this.messageService.add({
                severity: 'success',
                summary: 'Exitoso',
                detail: 'Producto desactivado correctamente',
                life: 3000
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'No se pudo desactivar el producto',
                life: 3000
              });
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo desactivar el producto',
              life: 3000
            });
          }
        });
      }
    });
  }

  loadProductos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productoService
      .getAll(undefined)
      .pipe(timeout(15000), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.errorMessage.set(res.message || 'No se pudieron cargar los productos.');
            this.productos.set([]);
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
            filtered = filtered.filter(p => {
              const haystack = `${p.ID_PRODUCTO} ${p.SKU} ${p.NOMBRE} ${p.CODIGO_BARRAS} ${p.CATEGORIA_NOMBRE} ${p.MARCA_NOMBRE}`.toLowerCase();
              return haystack.includes(search);
            });
          }

          if (this.selectedStatus() !== null) {
            filtered = filtered.filter(p => Boolean(p.ACTIVO) === this.selectedStatus());
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
          this.productos.set(filtered.slice(start, end));
        },
        error: (err: any) => {
          const msg = err?.name === 'TimeoutError'
            ? 'Tiempo de espera agotado al cargar los productos.'
            : (err?.message || 'Error al cargar productos');
          this.errorMessage.set(msg);
          this.productos.set([]);
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
      this.loadProductos();
    }
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.loadProductos();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.first.set(0);
    this.loadProductos();
  }

  onStatusChange(value: boolean | null): void {
    this.selectedStatus.set(value);
    this.first.set(0);
    this.loadProductos();
  }

  getActivoSeverity(activo: boolean | null | undefined): 'success' | 'danger' | 'warn' | 'info' {
    if (activo === true) return 'success';
    if (activo === false) return 'danger';
    return 'info';
  }

  private initializeMenu(): void {
    this.menuItems = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => {
          const producto = this.selectedProductoForMenu();
          if (producto) this.onViewProducto(producto);
        }
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
          const producto = this.selectedProductoForMenu();
          if (producto) this.editProducto(producto);
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
          const producto = this.selectedProductoForMenu();
          if (producto) this.deleteProducto(producto);
        }
      }
    ];
  }
}
