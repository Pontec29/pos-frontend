import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { FilterAdvanceProductos } from '@ventas/venta-rapida/domains/venta-rapida.interface';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-filter-advance-producto',
  imports: [CommonModule, AppButton, FormsModule, InputNumberModule],
  templateUrl: './filter-advance-producto.html',
  styleUrl: './filter-advance-producto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterAdvanceProducto {
  // ! OUTPUTS
  closed = output<boolean>();
  payload = output<FilterAdvanceProductos>();

  // ! INPUTS
  search = input<string>();

  // ! STATE
  filters: FilterAdvanceProductos = {};

  onClose() {
    this.closed.emit(true);
  }

  onOverlayClick() {
    this.onClose();
  }

  onApply() {
    this.payload.emit(this.filters);
    this.onClose();
  }
}
