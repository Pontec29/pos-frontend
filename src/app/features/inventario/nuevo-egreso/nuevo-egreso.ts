import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorState, PaginatorModule } from 'primeng/paginator';
import { NuevoEgresoService } from './services/nuevo-egreso.service';
import { MovimientoResumen } from './modelo/nuevo-egreso.model';
import { ContextoOperativoService } from '../../../core/services/contexto-operativo.service';
import { AppButton } from "@shared/ui/button";
import { ModalMotivoComponent } from '@shared/ui/modal-motivo/modal-motivo.component';
import { DialogModule } from 'primeng/dialog';
import { AlertService } from '@shared/services/alert.service';
import { computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-nuevo-egreso',
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
        ModalMotivoComponent,
        DialogModule,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    templateUrl: './nuevo-egreso.html',
    styleUrl: './nuevo-egreso.scss'
})
export default class NuevoEgreso implements OnInit {

  private readonly router = inject(Router);
  private readonly egresoService = inject(NuevoEgresoService);
  private readonly alertService = inject(AlertService);
  private readonly confirmationService = inject(ConfirmationService);

  // Pagination & Search
  first = signal(0);
  rows2 = signal(10);
  searchValue = signal('');

  // Estado
  readonly salidas = signal<MovimientoResumen[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // Anulación
  readonly mostrarModalAnulacion = signal(false);
  movimientoAAnular = signal<MovimientoResumen | null>(null);

  // Computed
  filtered = computed(() => {
    const q = this.searchValue().toLowerCase().trim();
    let data = this.salidas();

    if (!q) return data;
    return data.filter(item =>
      [
        item.documentoFormateado,
        item.almacenOrigenNombre,
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
        this.cargarSalidas();
    }

  cargarSalidas() {
    this.cargando.set(true);
    this.error.set(null);
    this.egresoService.listarSalidas().subscribe({
      next: (res) => {
        this.salidas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.salidas.set([]);
        this.error.set('No se pudieron cargar las notas de salida');
        this.cargando.set(false);
      }
    });
  }

  onRefresh() {
    this.cargarSalidas();
  }

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows2.set(event.rows ?? 10);
  }

    nuevaSalida() {
        this.router.navigate(['/inventario/nuevo-egreso/nuevo']);
    }

    verDetalle(item: MovimientoResumen) {
        this.router.navigate(['/inventario/nuevo-egreso/ver', item.id]);
    }

    procesarMovimiento(item: MovimientoResumen) {
        this.confirmationService.confirm({
            message: `¿Está seguro que desea procesar la nota ${item.documentoFormateado}? Esta acción actualizará el stock de forma definitiva.`,
            header: 'Confirmar Procesamiento',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Procesar',
            rejectLabel: 'No, Cancelar',
            acceptButtonStyleClass: 'p-button-success',
            accept: () => {
                this.cargando.set(true);
                this.egresoService.procesar(item.id).subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.alertService.success('Nota procesada correctamente');
                            this.cargarSalidas();
                        } else {
                            this.alertService.error(res.message);
                            this.cargando.set(false);
                        }
                    },
                    error: (err) => {
                        this.alertService.error(err.error?.message || 'Fallo al procesar');
                        this.cargando.set(false);
                    }
                });
            }
        });
    }

  /**
   * Abre el modal para ingresar el motivo de anulación
   */
  anularMovimiento(item: MovimientoResumen) {
    this.movimientoAAnular.set(item);
    this.mostrarModalAnulacion.set(true);
  }

  /**
   * Ejecuta la anulación con el motivo ingresado
   */
  confirmarAnulacion(motivo: string) {
    const item = this.movimientoAAnular();
    if (!item) return;

    this.egresoService.anular(item.id, motivo).subscribe({
        next: (res) => {
            if (res.success) {
                this.alertService.success(`Nota ${item.documentoFormateado} anulada correctamente`, 'Anulado');
                this.mostrarModalAnulacion.set(false);
                this.cargarSalidas();
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
