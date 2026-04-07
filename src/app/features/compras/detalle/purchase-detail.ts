import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // Router added
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api'; // ConfirmationService added
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // ConfirmDialogModule added
// import { PurchaseService } from '../services/purchase.service';
import { Purchase } from '../../../core/models/purchases.model';
import { AppButton } from '../../../shared/ui/button';

@Component({
    selector: 'app-purchase-detail',
    standalone: true,
    imports: [
        CommonModule,
        BreadcrumbModule,
        TableModule,
        TagModule,
        ButtonModule,
        ToastModule,
        AppButton,
        ConfirmDialogModule // added
    ],
    providers: [MessageService, ConfirmationService], // ConfirmationService added
    templateUrl: './purchase-detail.html',
    styleUrl: './purchase-detail.scss'
})
export default class PurchaseDetailPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router); // Router injected
    // private purchaseService = inject(PurchaseService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService); // ConfirmationService injected

    purchaseId: number | null = null;
    purchase: Purchase | null = null;
    loading = false;
    items = [
        { label: 'Compras', routerLink: '/compras' },
        { label: 'Detalle' }
    ];

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.purchaseId = +id;
                this.loadPurchase(this.purchaseId);
            }
        });
    }

    loadPurchase(id: number) {
        this.loading = true;
        // this.purchaseService.getById(id).subscribe({
        //     next: (res) => {
        //         if (res.success && res.data) {
        //             this.purchase = res.data;
        //             this.items = [
        //                 { label: 'Compras', routerLink: '/compras' },
        //                 { label: `Orden #${this.purchase.fullDocumentNumber || this.purchase.number || id}` }
        //             ];
        //         } else {
        //             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Compra no encontrada' });
        //         }
        //         this.loading = false;
        //     },
        //     error: () => {
        //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar la compra' });
        //         this.loading = false;
        //     }
        // });
    }

    // New methods for actions
    processPurchase() {
        if (!this.purchase) return;

        // this.confirmationService.confirm({
        //     message: '¿Está seguro de procesar esta compra? Se actualizará el stock y costos. Esta acción no se puede deshacer.',
        //     header: 'Confirmar Procesamiento',
        //     icon: 'pi pi-exclamation-triangle',
        //     accept: () => {
        //         this.loading = true;
        //         this.purchaseService.processPurchase(this.purchase!.id).subscribe({
        //             next: (res) => {
        //                 if (res.success) {
        //                     this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Compra procesada correctamente' });
        //                     this.loadPurchase(this.purchase!.id);
        //                 } else {
        //                     this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
        //                 }
        //                 this.loading = false;
        //             },
        //             error: () => {
        //                 this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la compra' });
        //                 this.loading = false;
        //             }
        //         });
        //     }
        // });
    }

    cancelPurchase() {
        if (!this.purchase) return;

        // this.confirmationService.confirm({
        //     message: '¿Está seguro de anular esta compra?',
        //     header: 'Confirmar Anulación',
        //     icon: 'pi pi-times-circle',
        //     acceptButtonStyleClass: 'p-button-danger',
        //     accept: () => {
        //         this.loading = true;
        //         this.purchaseService.cancelPurchase(this.purchase!.id).subscribe({
        //             next: (res) => {
        //                 if (res.success) {
        //                     this.messageService.add({ severity: 'success', summary: 'Anulado', detail: 'Compra anulada' });
        //                     this.loadPurchase(this.purchase!.id);
        //                 } else {
        //                     this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
        //                 }
        //                 this.loading = false;
        //             },
        //             error: () => {
        //                 this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al anular la compra' });
        //                 this.loading = false;
        //             }
        //         });
        //     }
        // });
    }

    goBack() {
        this.router.navigate(['/compras']);
    }
}
