import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { AppButton } from '@shared/ui/button';

@Component({
  selector: 'app-modal-venta',
  imports: [CommonModule, AppButton],
  templateUrl: './modal-venta.html',
  styleUrl: './modal-venta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVenta {
  closed = output<boolean>();

  onClose() {
    this.closed.emit(true);
  }

  onOverlayClick() {
    this.onClose();
  }
}
