import { Component, EventEmitter, Output, input, signal, model, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { AppButton } from '../button';

@Component({
  selector: 'app-modal-motivo',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, TextareaModule, AppButton],
  templateUrl: './modal-motivo.component.html',
  styleUrl: './modal-motivo.component.scss'
})
export class ModalMotivoComponent {
  readonly visible = model<boolean>(false);
  readonly title = input<string>('Confirmar Acción');
  readonly message = input<string>('¿Está seguro de realizar esta acción?');
  readonly warning = input<string>('');
  readonly placeholder = input<string>('Ingrese el motivo...');
  readonly confirmLabel = input<string>('Confirmar');
  readonly confirmIcon = input<string>('pi pi-check');
  readonly confirmClass = input<string>('p-button-danger');

  @Output() onConfirm = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();

  readonly motivo = signal('');

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.motivo.set('');
      }
    });
  }

  confirmar() {
    if (!this.motivo().trim()) return;
    this.onConfirm.emit(this.motivo());
    this.visible.set(false);
  }

  cancelar() {
    this.onCancel.emit();
    this.visible.set(false);
  }
}
