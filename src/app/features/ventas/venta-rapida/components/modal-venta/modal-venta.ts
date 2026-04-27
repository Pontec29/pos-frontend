import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, input, signal, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MetodoPago, VentaPagoRequest } from '@ventas/venta-rapida/domains/pago.interface';
import { VentaRapidaService } from '../../services/venta-rapida.service';

@Component({
  selector: 'app-modal-venta',
  standalone: true,
  imports: [CommonModule, AppButton, FormsModule, InputNumberModule, InputTextModule, SelectModule],
  templateUrl: './modal-venta.html',
  styleUrl: './modal-venta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVenta implements OnInit {
  private readonly ventaService = inject(VentaRapidaService);

  total = input.required<number>();
  cart = input.required<any[]>();

  closed = output<boolean>();
  confirmed = output<any>();

  // Estado de métodos de pago
  metodosPago = signal<MetodoPago[]>([]);
  pagos = signal<VentaPagoRequest[]>([]);

  // Formulario de pago actual
  selectedMetodo = signal<MetodoPago | null>(null);
  montoInput = signal<number>(0);
  referenciaInput = signal<string>('');

  // Cálculos reactivos
  totalPagado = computed(() => {
    return this.pagos().reduce((sum, p) => sum + p.monto, 0);
  });

  saldoPendiente = computed(() => {
    const saldo = this.total() - this.totalPagado();
    return saldo > 0 ? saldo : 0;
  });

  vuelto = computed(() => {
    const v = this.totalPagado() - this.total();
    return v > 0 ? v : 0;
  });

  canFinalize = computed(() => {
    return this.totalPagado() >= this.total() && this.pagos().length > 0;
  });

  ngOnInit() {
    this.loadMetodos();
    this.montoInput.set(this.total());
  }

  loadMetodos() {
    this.ventaService.getMetodosPago().subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.metodosPago.set(list);
        if (list.length > 0) {
          this.selectedMetodo.set(list.find((m: any) => m.codigo === 'EFECTIVO') || list[0]);
        }
      }
    });
  }

  agregarPago() {
    const metodo = this.selectedMetodo();
    const monto = this.montoInput();

    if (!metodo || monto <= 0) return;

    const nuevoPago: VentaPagoRequest = {
      metodoPagoId: metodo.id,
      monto: monto,
      referencia: this.referenciaInput()
    };

    this.pagos.update(p => [...p, nuevoPago]);

    // Resetear para el siguiente pago
    this.montoInput.set(this.saldoPendiente());
    this.referenciaInput.set('');
  }

  quitarPago(index: number) {
    this.pagos.update(p => p.filter((_, i) => i !== index));
    this.montoInput.set(this.saldoPendiente());
  }

  getMetodoNombre(id: number): string {
    return this.metodosPago().find(m => m.id === id)?.tipo || 'Otro';
  }

  onFinalizar() {
    if (!this.canFinalize()) return;

    const ventaPayload = {
      pagos: this.pagos()
    };

    this.confirmed.emit(ventaPayload);
  }

  onClose() {
    this.closed.emit(true);
  }
}
