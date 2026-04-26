import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { AppButton } from '@shared/ui/button';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { VentasService } from '@ventas/services/ventas.service';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { MessageService, MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { VentaResumen, EstadoVenta } from '@ventas/models/venta.models';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { TableLazyLoadEvent } from 'primeng/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-ventas',
  imports: [
    CommonModule,
    AppButton,
    FormsModule,
    TagModule,
    MenuModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FILTER_MODULES,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './lista-ventas.html',
  styleUrl: './lista-ventas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListaVentas implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  // ! FILTROS
  readonly searchText = signal('');
  readonly selectedStatus = signal<string | null>(null);
  readonly selectedMonth = signal<Date | null>(null);
  readonly rows = signal(10);
  readonly first = signal(0);
  readonly sortField = signal<string>('fEmision');
  readonly sortOrder = signal<number>(-1);

  // ! DATOS
  readonly ventasSource = signal<VentaResumen[]>([]);
  readonly ventas = signal<VentaResumen[]>([]);
  readonly totalRecords = signal(0);
  public selectedVentas: VentaResumen[] = [];
  readonly selectedVentaForMenu = signal<VentaResumen | null>(null);

  // ! CARGA Y ERRORES
  readonly cargando = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // ! CONFIGURACIÓN
  readonly statusOptions = [
    { label: 'EMITIDO', value: 'EMITIDO' },
    { label: 'ANULADO', value: 'ANULADO' },
    { label: 'PENDIENTE', value: 'PENDIENTE' }
  ];

  menuItems: MenuItem[] = [
    {
      label: 'Ver detalle',
      icon: 'pi pi-eye',
      command: () => {
        const venta = this.selectedVentaForMenu();
        if (venta) this.verDetalle(venta);
      }
    },
    {
      label: 'Imprimir',
      icon: 'pi pi-print',
      command: () => {
        const venta = this.selectedVentaForMenu();
        if (venta) this.imprimirPdf(venta);
      }
    },
    {
      label: 'Descargar PDF',
      icon: 'pi pi-download',
      command: () => {
        const venta = this.selectedVentaForMenu();
        if (venta) this.descargarPdf(venta);
      }
    },
    {
      separator: true
    },
    {
      label: 'Anular',
      icon: 'pi pi-times',
      command: () => {
        const venta = this.selectedVentaForMenu();
        if (venta) this.anularVenta(venta);
      }
    }
  ];

  ngOnInit(): void {
    this.cargarVentas(true);
  }

  onSearchChange(value: string) {
    this.searchText.set(value);
    this.first.set(0);
    this.cargarVentas(false);
  }

  onStatusChange(value: string | null) {
    this.selectedStatus.set(value);
    this.first.set(0);
    this.cargarVentas(true);
  }

  onMonthChange(value: Date | null) {
    this.selectedMonth.set(value);
    this.first.set(0);
    this.cargarVentas(false);
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    if (event.first != null) this.first.set(event.first);
    if (event.rows != null) this.rows.set(event.rows);
    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder ?? 1);
    }
    this.cargarVentas(false);
  }

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.cargarVentas(false);
  }

  hasError(): boolean {
    return this.errorMessage() !== null;
  }

  getSeverity(estado: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (estado) {
      case 'EMITIDO': return 'success';
      case 'ANULADO': return 'danger';
      case 'PENDIENTE': return 'warn';
      default: return 'info';
    }
  }

  cargarVentas(refetch = true) {
    this.cargando.set(true);
    this.errorMessage.set(null);

    if (!refetch) {
      this.applyViewState(this.ventasSource());
      this.cargando.set(false);
      return;
    }

    const estado = this.selectedStatus() ?? undefined;

    this.debugLog('cargarVentas:start', {
      estado,
      searchText: this.searchText(),
      selectedMonth: this.selectedMonth(),
      first: this.first(),
      rows: this.rows(),
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
    });

    this.ventasService
      .getVentas(estado || undefined)
      .pipe(
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            const msg = response?.message || 'Error al cargar ventas';
            this.errorMessage.set(msg);
            this.ventasSource.set([]);
            this.ventas.set([]);
            this.totalRecords.set(0);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: msg,
            });
            this.debugWarn('cargarVentas:backend_error', response);
            return;
          }

          const raw = Array.isArray(response.data) ? response.data : [];
          const { valid, invalid } = this.validateVentas(raw);

          this.ventasSource.set(valid);
          this.applyViewState(valid);

          if (invalid.length > 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Datos incompletos',
              detail: `Se omitieron ${invalid.length} venta(s) por datos inválidos.`,
            });
            this.debugWarn('cargarVentas:invalid_rows', invalid);
          }

          this.debugLog('cargarVentas:success', {
            received: raw.length,
            valid: valid.length,
            invalid: invalid.length,
            shown: this.ventas().length,
            totalRecords: this.totalRecords(),
          });
        },
        error: (err: any) => {
          const msg =
            err?.name === 'TimeoutError'
              ? 'Tiempo de espera agotado al cargar ventas.'
              : err?.message || 'Error al cargar ventas';
          this.errorMessage.set(msg);
          this.ventasSource.set([]);
          this.ventas.set([]);
          this.totalRecords.set(0);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          this.debugError('cargarVentas:network_error', err);
        },
      });
  }

  applyViewState(data: VentaResumen[]) {
    let filtered = [...data];
    const search = this.searchText().toLowerCase();

    if (search) {
      filtered = filtered.filter(v =>
        (v.clienteNombre && v.clienteNombre.toLowerCase().includes(search)) ||
        (v.clienteNumeroDocumento && v.clienteNumeroDocumento.includes(search)) ||
        (v.numero && v.numero.includes(search))
      );
    }

    const month = this.selectedMonth();
    if (month) {
      filtered = filtered.filter(v => {
        const d = new Date(v.fEmision);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
    }

    const field = this.sortField();
    const order = this.sortOrder();

    if (field) {
      filtered.sort((a: any, b: any) => {
        let valA = a[field];
        let valB = b[field];

        if (valA === valB) return 0;
        if (valA == null) return order;
        if (valB == null) return -order;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }

        return valA < valB ? -order : order;
      });
    }

    this.totalRecords.set(filtered.length);
    const start = this.first();
    const end = start + this.rows();
    this.ventas.set(filtered.slice(start, end));
  }

  validateVentas(data: any[]): { valid: VentaResumen[], invalid: any[] } {
    const valid: VentaResumen[] = [];
    const invalid: any[] = [];
    for (const item of data) {
      if (item && item.id) {
        valid.push(item as VentaResumen);
      } else {
        invalid.push(item);
      }
    }
    return { valid, invalid };
  }

  onNuevaVenta() {
    this.router.navigate(['/ventas/facturacion']);
  }

  verDetalle(venta: VentaResumen) {
    this.router.navigate(['/ventas/ver', venta.id]);
  }

  imprimirPdf(venta: VentaResumen) {
    this.ventasService.abrirPdfEnNuevaPestana(venta.id);
  }

  descargarPdf(venta: VentaResumen) {
    this.ventasService.forzarDescargaPdf(venta.id, `Venta_${venta.numero || venta.id}.pdf`);
  }

  anularVenta(venta: VentaResumen) {
    this.messageService.add({ severity: 'warn', summary: 'Anulación', detail: `Se anulará la venta #${venta.id}` });
    this.ventasService.anularVenta(venta.id, 'Anulación solicitada por el usuario').subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Venta anulada correctamente' });
          this.cargarVentas(true);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo anular' });
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al anular' });
      }
    });
  }

  debugLog(msg: string, data?: any) {
    console.log(`[ListaVentas] ${msg}`, data);
  }

  debugWarn(msg: string, data?: any) {
    console.warn(`[ListaVentas] ${msg}`, data);
  }

  debugError(msg: string, data?: any) {
    console.error(`[ListaVentas] ${msg}`, data);
  }
}
