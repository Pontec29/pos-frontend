import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, input, signal, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MetodoPago, VentaPagoRequest, VentaCuotaRequest } from '@ventas/venta-rapida/domains/pago.interface';
import { DatePickerModule } from 'primeng/datepicker';
import { VentaRapidaService } from '../../services/venta-rapida.service';

@Component({
  selector: 'app-sidebar-cobro',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerModule, MultiSelectModule, InputNumberModule, ButtonModule, DatePickerModule],
  templateUrl: './sidebar-cobro.html',
  styleUrl: './sidebar-cobro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarCobro implements OnInit {
  private readonly ventaService = inject(VentaRapidaService);

  total = input.required<number>();
  closed = output<boolean>();
  confirmed = output<any>();

  visible = signal<boolean>(true);
  
  // Condición de pago (Contado / Crédito)
  condicion = signal<'CONTADO' | 'CRÉDITO'>('CONTADO');

  // Catálogo de métodos
  metodosCatalogo = signal<MetodoPago[]>([]);
  
  // Métodos seleccionados (Chips)
  selectedMetodos = signal<MetodoPago[]>([]);
  
  // Cuotas (para Crédito)
  cuotas = signal<VentaCuotaRequest[]>([]);

  // Montos por método (id -> monto)
  montosMap = signal<Record<number, number>>({});
  referenciasMap = signal<Record<number, string>>({});

  // Cálculos reactivos
  totalPagado = computed(() => {
    return Object.values(this.montosMap()).reduce((sum, m) => sum + m, 0);
  });

  pendiente = computed(() => {
    const p = this.total() - this.totalPagado();
    return p > 0 ? p : 0;
  });

  vuelto = computed(() => {
    const v = this.totalPagado() - this.total();
    return v > 0 ? v : 0;
  });

  ngOnInit() {
    this.loadMetodos();
  }

  loadMetodos() {
    this.ventaService.getMetodosPago().subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.metodosCatalogo.set(list);
        
        // Seleccionar Efectivo por defecto si existe
        const efectivo = list.find((m: any) => m.codigo === 'EFECTIVO');
        if (efectivo) {
          this.selectedMetodos.set([efectivo]);
          this.montosMap.update(map => ({ ...map, [efectivo.id]: this.total() }));
        }
      }
    });
  }

  onSelectionChange(event: any) {
    const nuevosSeleccionados = event.value as MetodoPago[];
    const mapActual = { ...this.montosMap() };
    const refsActual = { ...this.referenciasMap() };
    
    // Si un método ya no está, quitarlo
    Object.keys(mapActual).forEach(idKey => {
      const id = Number(idKey);
      if (!nuevosSeleccionados.find(m => m.id === id)) {
        delete mapActual[id];
        delete refsActual[id];
      }
    });

    // Si hay un método nuevo, inicializar
    nuevosSeleccionados.forEach(m => {
      if (mapActual[m.id] === undefined) {
        mapActual[m.id] = nuevosSeleccionados.length === 1 ? this.total() : 0;
        refsActual[m.id] = '';
      }
    });

    this.montosMap.set(mapActual);
    this.referenciasMap.set(refsActual);
  }

  updateMonto(metodoId: number, monto: number) {
    this.montosMap.update(map => ({
      ...map,
      [metodoId]: monto
    }));
  }

  updateReferencia(metodoId: number, ref: string) {
    this.referenciasMap.update(map => ({
      ...map,
      [metodoId]: ref
    }));
  }

  // --- Lógica de Cuotas ---
  agregarCuota() {
    const nuevaCuota: VentaCuotaRequest = {
      monto: 0,
      fechaVencimiento: new Date()
    };
    this.cuotas.update(c => [...c, nuevaCuota]);
  }

  eliminarCuota(index: number) {
    this.cuotas.update(c => c.filter((_, i) => i !== index));
  }

  generarCuotaUnica() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    this.cuotas.set([{
      monto: this.total(),
      fechaVencimiento: fecha
    }]);
  }

  updateCuotaMonto(index: number, monto: number) {
    this.cuotas.update(c => {
      const copy = [...c];
      copy[index] = { ...copy[index], monto };
      return copy;
    });
  }

  updateCuotaFecha(index: number, fecha: Date) {
    this.cuotas.update(c => {
      const copy = [...c];
      copy[index] = { ...copy[index], fechaVencimiento: fecha };
      return copy;
    });
  }

  onAceptar() {
    if (this.condicion() === 'CONTADO') {
      const pagos: VentaPagoRequest[] = this.selectedMetodos().map(m => ({
        metodoPagoId: m.id,
        monto: this.montosMap()[m.id] || 0,
        referencia: this.referenciasMap()[m.id] || ''
      }));
      this.confirmed.emit({ condicion: 'CONTADO', pagos });
    } else {
      this.confirmed.emit({ 
        condicion: 'CRÉDITO', 
        cuotas: this.cuotas() 
      });
    }
    this.onClose();
  }

  onClose() {
    this.visible.set(false);
    this.closed.emit(true);
  }
}
