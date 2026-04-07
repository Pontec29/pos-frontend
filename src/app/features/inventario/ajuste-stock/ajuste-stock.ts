import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PRIMENG_FORM_MODULES } from '../../../shared/ui/prime-imports';
import { AppButton } from '../../../shared/ui/button';
import { SucursalService } from '../../configuracion/sucursales/services/sucursal.service';
import { ProductoService } from '@inventario/productos/services/producto.service';

@Component({
    selector: 'app-ajuste-stock',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        BreadcrumbModule,
        SelectButtonModule,
        AutoCompleteModule,
        ...PRIMENG_FORM_MODULES,
    ],
    providers: [MessageService],
    template: ``,
    styles: ``
})
export default class AjusteStockPage implements OnInit {
    private fb = inject(FormBuilder);
    private productoService = inject(ProductoService);
    private sucursalService = inject(SucursalService);
    private messageService = inject(MessageService);

    loading = false;
    branches: any[] = [];
    // products: Product[] = [];
    // filteredProducts: Product[] = [];

    selectedProductStock: number | null = null;
    selectedProductPrice: number | null = null;
    currentStockLabel: string = '---';

    adjustmentForm = this.fb.group({
        branchId: [null as number | null, [Validators.required]],
        // product: [null as Product | null, [Validators.required]],
        type: ['INGRESO', [Validators.required]],
        quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
        reason: ['', [Validators.required, Validators.maxLength(250)]]
    });

    movementTypes = [
        { label: 'Ingreso Manual', value: 'INGRESO' },
        { label: 'Salida / Merma', value: 'SALIDA' }
    ];

    ngOnInit() {
        this.loadDependencies();

        // Listen to changes to fetch current stock
        this.adjustmentForm.get('product')?.valueChanges.subscribe(p => {
            this.checkCurrentStock();
            if (p && typeof p === 'object' && 'salePrice' in p) {
                // this.selectedProductPrice = p.salePrice;
            }
        });

        this.adjustmentForm.get('branchId')?.valueChanges.subscribe(() => {
            this.checkCurrentStock();
        });
    }

    loadDependencies() {
        // this.loading = true;
        // combineLatest([
        //     this.sucursalService.getAll(),
        //     this.productoService.getAll()
        // ]).subscribe({
        //     next: ([branchesData, productsData]) => {
        //         if (branchesData.success) {
        //             this.branches = branchesData.data.map(b => ({ label: b.name, value: b.id }));
        //             if (this.branches.length > 0) {
        //                 this.adjustmentForm.patchValue({ branchId: this.branches[0].value });
        //             }
        //         }
        //         if (productsData.success) {
        //             this.products = productsData.data;
        //         }
        //         this.loading = false;
        //     },
        //     error: () => {
        //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
        //         this.loading = false;
        //     }
        // });
    }

    filterProducts(event: any) {
        const query = event.query.toLowerCase();
        // this.filteredProducts = this.products.filter(p =>
        //     p.name.toLowerCase().includes(query) ||
        //     p.code.toLowerCase().includes(query) ||
        //     (p.sku && p.sku.toLowerCase().includes(query))
        // );
    }

    checkCurrentStock() {
        // const productId = (this.adjustmentForm.get('product')?.value as Product)?.id;
        const branchId = this.adjustmentForm.get('branchId')?.value;

        // if (productId && branchId) {

        // } else {
        //     this.currentStockLabel = '---';
        // }
    }

    onSave() {
        if (this.adjustmentForm.invalid) {
            this.adjustmentForm.markAllAsTouched();
            return;
        }

        const formValue = this.adjustmentForm.getRawValue();
        // const product = formValue.product as Product;
        let finalQuantity = formValue.quantity || 0;

        if (formValue.type === 'SALIDA') {
            finalQuantity = finalQuantity * -1;
        }

        // const adjustment = {
        //     productId: product.id,
        //     branchId: formValue.branchId!,
        //     quantity: finalQuantity,
        //     reason: formValue.reason || 'Ajuste manual'
        // };

        this.loading = true;
    }
}
