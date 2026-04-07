import { Component, ViewEncapsulation, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule, ConfirmDialog } from 'primeng/confirmdialog';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, ConfirmDialogModule],
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AppConfirmDialog {
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
