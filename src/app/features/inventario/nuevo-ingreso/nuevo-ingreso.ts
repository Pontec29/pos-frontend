import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorState, PaginatorModule } from 'primeng/paginator';
import { NuevoIngresoService } from './services/nuevo-ingreso.service';
import { MovimientoResumenIngreso } from './modelo/nuevo-ingreso.model';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionService } from '@shared/ui/modal-confirmacion/modal-confirmacion.service';
import { DialogModule } from 'primeng/dialog';
import { ModalMotivoComponent } from '@shared/ui/modal-motivo/modal-motivo.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@shared/services/alert.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-nuevo-ingreso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    ...PRIMENG_FILTER_MODULES,
    AppButton,
    DialogModule,
    ModalMotivoComponent
  ],
  providers: [],
  templateUrl: './nuevo-ingreso.html',
  styleUrl: './nuevo-ingreso.scss'
})
export default class NuevoIngreso implements OnInit {

  private readonly router = inject(Router);
  private readonly ingresoService = inject(NuevoIngresoService);
  private readonly alertService = inject(AlertService);
  private readonly confirmDialog = inject(ModalConfirmacionService);

  // Pagination & Search
  first = signal(0);
  rows2 = signal(10);
  searchValue = signal('');

  // Estado
  readonly entradas = signal<MovimientoResumenIngreso[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // Anulación
  readonly mostrarModalAnulacion = signal(false);
  movimientoAAnular = signal<MovimientoResumenIngreso | null>(null);

  // Computed
  filtered = computed(() => {
    const q = this.searchValue().toLowerCase().trim();
    let data = this.entradas();

    if (!q) return data;
    return data.filter(item =>
      [
        item.documentoFormateado,
        item.almacenDestinoNombre,
        item.estado
      ]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q))
    );
  });

  paged = computed(() => {
    const list = this.filtered();
    const start = this.first();
    const end = start + this.rows2();
    return list.slice(start, end);
  });


  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.cargando.set(true);
    this.error.set(null);
    this.ingresoService.listarEntradas().subscribe({
      next: (res) => {
        this.entradas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.entradas.set([]);
        this.error.set('No se pudieron cargar las notas de ingreso');
        this.cargando.set(false);
      }
    });
  }

  onRefresh() {
    this.cargarEntradas();
  }

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows2.set(event.rows ?? 10);
  }

  nuevoIngreso() {
    this.router.navigate(['/inventario/nuevo-ingreso/nuevo']);
  }

  verDetalle(item: MovimientoResumenIngreso) {
    this.router.navigate(['/inventario/nuevo-ingreso/ver', item.id]);
  }

  /**
   * Procesa un movimiento en BORRADOR → PROCESADO (actualiza stock + kardex)
   */
  procesarMovimiento(item: MovimientoResumenIngreso) {
    this.confirmDialog.confirmCustom(
      {
        title: 'Procesar Movimiento',
        message: `¿Procesar la nota ${item.documentoFormateado}? Esto actualizará el stock y el kardex.`,
        icon: 'pi pi-check-circle',
        acceptLabel: 'Procesar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'success'
      },
      () => {
        this.ingresoService.procesar(item.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.success(`Nota ${item.documentoFormateado} procesada exitosamente`, 'Procesado');
              this.cargarEntradas();
            } else {
              this.alertService.error(res.message);
            }
          },
          error: () => {
            this.alertService.error('Error al procesar el movimiento');
          }
        });
      }
    );
  }

  /**
   * Abre el modal para ingresar el motivo de anulación
   */
  anularMovimiento(item: MovimientoResumenIngreso) {
    this.movimientoAAnular.set(item);
    this.mostrarModalAnulacion.set(true);
  }

  /**
   * Ejecuta la anulación con el motivo ingresado
   */
  confirmarAnulacion(motivo: string) {
    const item = this.movimientoAAnular();
    if (!item) return;

    this.ingresoService.anular(item.id, motivo).subscribe({
        next: (res) => {
            if (res.success) {
                this.alertService.success(`Nota ${item.documentoFormateado} anulada correctamente`, 'Anulado');
                this.mostrarModalAnulacion.set(false);
                this.cargarEntradas();
            } else {
                this.alertService.error(res.message);
            }
        },
        error: () => {
            this.alertService.error('Error al anular el movimiento');
        }
    });
  }

  getSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'PROCESADO': return 'success';
      case 'BORRADOR': return 'warn';
      case 'ANULADO': return 'danger';
      default: return 'info';
    }
  }
}
