import { Component, ViewEncapsulation, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule, ConfirmDialog } from 'primeng/confirmdialog';

@Component({
    selector: 'app-modal-confirmacion',
    standalone: true,
    imports: [CommonModule, ConfirmDialogModule],
    templateUrl: './modal-confirmacion.component.html',
    styleUrl: './modal-confirmacion.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ModalConfirmacionComponent {
    @ViewChild('cd') confirmDialog?: ConfirmDialog;

    handleAccept() {
        // Ejecutar el callback accept de la confirmación actual
        if (this.confirmDialog && this.confirmDialog.confirmation) {
            this.confirmDialog.confirmation.accept?.();
            this.confirmDialog.hide();
        }
    }

    handleReject() {
        // Ejecutar el callback reject de la confirmación actual
        if (this.confirmDialog && this.confirmDialog.confirmation) {
            this.confirmDialog.confirmation.reject?.();
            this.confirmDialog.hide();
        }
    }
}
