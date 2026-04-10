import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { NuevoIngresoService } from './services/nuevo-ingreso.service';
import { MovimientoResumenIngreso } from './modelo/nuevo-ingreso.model';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionService } from '@shared/ui/modal-confirmacion/modal-confirmacion.service';

@Component({
  selector: 'app-nuevo-ingreso',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    TooltipModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    AppButton
  ],
  providers: [MessageService],
  templateUrl: './nuevo-ingreso.html',
  styleUrl: './nuevo-ingreso.scss'
})
export default class NuevoIngreso implements OnInit {

  private readonly router = inject(Router);
  private readonly ingresoService = inject(NuevoIngresoService);
  private readonly messageService = inject(MessageService);
  private readonly confirmDialog = inject(ModalConfirmacionService);

  readonly entradas = signal<MovimientoResumenIngreso[]>([]);
  readonly cargando = signal(false);

  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.cargando.set(true);
    this.ingresoService.listarEntradas().subscribe({
      next: (res) => {
        this.entradas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.entradas.set([]);
        this.cargando.set(false);
      }
    });
  }

  nuevoIngreso() {
    this.router.navigate(['/inventario/nuevo-ingreso/nuevo']);
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
              this.messageService.add({
                severity: 'success',
                summary: 'Procesado',
                detail: `Nota ${item.documentoFormateado} procesada exitosamente`
              });
              this.cargarEntradas();
            } else {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
            }
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el movimiento' });
          }
        });
      }
    );
  }

  /**
   * Anula un movimiento (reversa stock si estaba procesado)
   */
  anularMovimiento(item: MovimientoResumenIngreso) {
    this.confirmDialog.confirm(
      'delete',
      `¿Anular la nota ${item.documentoFormateado}? ${item.estado === 'PROCESADO' ? 'Se revertirá el stock.' : ''}`,
      () => {
        this.ingresoService.anular(item.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Anulado',
                detail: `Nota ${item.documentoFormateado} anulada`
              });
              this.cargarEntradas();
            } else {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
            }
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al anular el movimiento' });
          }
        });
      }
    );
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
