import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, output, signal } from '@angular/core';
import { CajaService } from '../../../service/caja.service';
import { MessageService } from 'primeng/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AppButton } from '@shared/ui/button';
import { ApiResponse } from '@shared/domains/api-response.model';
import { Arqueos, Denominaciones } from '@caja/domain/caja.interface';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface ArqueoFila extends Arqueos {
  VALOR: number;
  TOTAL: number;
}

@Component({
  selector: 'app-arqueo-caja',
  imports: [CommonModule, AppButton, ProgressSpinnerModule],
  templateUrl: './arqueo-caja.html',
  styleUrl: './arqueo-caja.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArqueoCaja implements OnInit, OnDestroy {
  private readonly cajaService = inject(CajaService);
  private readonly messageService = inject(MessageService);
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  listarDenominacion = toSignal(
    this.cajaService.getAllDenominaciones().pipe(
      catchError((err) => {
        console.error(err);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: err.message || 'No se pudieron cargar las denominaciones',
        });
        return of({ success: false, message: '', data: [] } as ApiResponse<Denominaciones[]>);
      })
    ),
    { initialValue: { success: true, message: '', data: [] } as ApiResponse<Denominaciones[]> }
  );

  cantidades = signal<Record<number, number>>({});
  errores = signal<Record<number, string>>({});

  denominaciones = computed(() =>
    [...(this.listarDenominacion().data ?? [])].sort((a, b) => b.VALOR - a.VALOR)
  );

  filas = computed<ArqueoFila[]>(() =>
    this.denominaciones().map((d) => {
      const cantidad = this.cantidades()[d.ID_DENOMINACION] ?? 0;
      return {
        ID_DENOMINACION: d.ID_DENOMINACION,
        CANTIDAD: cantidad,
        VALOR: d.VALOR,
        TOTAL: d.VALOR * cantidad
      };
    })
  );

  montoFinalCalculado = computed(() =>
    this.filas().reduce((acc, fila) => acc + fila.TOTAL, 0)
  );

  canSubmit = computed(() => {
    const tieneCantidades = this.filas().some((fila) => fila.CANTIDAD > 0);
    const tieneErrores = Object.keys(this.errores()).length > 0;
    return tieneCantidades && !tieneErrores;
  });
  isEntering = signal(true);

  arqueo = output<Arqueos[]>();
  montoFinal = output<number>();

  ngOnInit() {
    this.transitionTimer = setTimeout(() => {
      this.isEntering.set(false);
      this.transitionTimer = null;
    }, 260);
  }

  ngOnDestroy() {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  onCantidadInput(denominacionId: number, rawValue: string) {
    const value = rawValue.trim();
    if (value === '') {
      this.setCantidad(denominacionId, 0);
      this.clearError(denominacionId);
      return;
    }

    if (!/^\d+$/.test(value)) {
      this.setError(denominacionId, 'Ingrese solo números enteros positivos');
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      this.setError(denominacionId, 'La cantidad debe ser positiva');
      return;
    }

    this.setCantidad(denominacionId, parsed);
    this.clearError(denominacionId);
  }

  enviarDenominacion() {
    if (!this.canSubmit()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Ingrese al menos una denominación válida'
      });
      return;
    }

    const resultado = this.filas()
      .filter((fila) => fila.CANTIDAD > 0)
      .map((fila) => ({
        ID_DENOMINACION: fila.ID_DENOMINACION,
        CANTIDAD: fila.CANTIDAD
      }));

    this.arqueo.emit(resultado);
    this.montoFinal.emit(this.montoFinalCalculado());
  }

  cancelar() {
    this.cantidades.set({});
    this.errores.set({});
    this.arqueo.emit([]);
    this.montoFinal.emit(0);
  }

  getError(denominacionId: number): string | null {
    return this.errores()[denominacionId] ?? null;
  }

  private setCantidad(denominacionId: number, cantidad: number) {
    this.cantidades.update((current) => ({
      ...current,
      [denominacionId]: cantidad
    }));
  }

  private setError(denominacionId: number, message: string) {
    this.errores.update((current) => ({
      ...current,
      [denominacionId]: message
    }));
  }

  private clearError(denominacionId: number) {
    this.errores.update((current) => {
      if (!(denominacionId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[denominacionId];
      return next;
    });
  }
}
