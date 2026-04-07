import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppButton } from '../../../shared/ui/button';
import { SupplierService } from '../../proveedores/services/supplier.service';
import { Supplier, PurchaseRequest } from '../../../core/models/purchases.model';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ProductoService } from '@inventario/productos/services/producto.service';

interface DetailLine {
    productId: number;
    productName: string;
    unitId?: number;
    quantity: number;
    unitCost: number;
    igvPercentage: number;
    lotCode?: string;
    expirationDate?: Date;
    subtotal: number;
    tax: number;
    total: number;
}

@Component({
    selector: 'app-compras-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AppButton,
        SelectModule,
        ToastModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        TableModule,
        ButtonModule,
        CardModule,
        DividerModule,
        AutoCompleteModule
    ],
    providers: [MessageService],
    templateUrl: './form.html',
    styleUrl: './form.scss'
})
export default class ComprasForm implements OnInit {
    private router = inject(Router);
    private messageService = inject(MessageService);
    // private purchaseService = inject(PurchaseService);
    private supplierService = inject(SupplierService);
    private productService = inject(ProductoService);

    loading = signal(false);
    saving = signal(false);
    suppliers = signal<Supplier[]>([]);
    filteredSuppliers = signal<Supplier[]>([]);
    products = signal<any[]>([]);
    filteredProducts = signal<any[]>([]);

    // Form fields
    selectedSupplier: Supplier | null = null;
    voucherTypeId = '01';
    series = '';
    number = '';
    issueDate: Date = new Date();
    dueDate: Date | null = null;
    currencyId = 'PEN';
    observations = '';

    // Líneas de detalle
    details = signal<DetailLine[]>([]);

    // Para agregar nueva línea
    newProduct: any = null;
    newQuantity = 1;
    newUnitCost = 0;
    newIgvPercentage = 18;
    newLotCode = '';
    newExpirationDate: Date | null = null;

    // Opciones
    voucherTypes = [
        { label: 'Factura', value: '01' },
        { label: 'Boleta', value: '03' }
    ];

    currencies = [
        { label: 'Soles (PEN)', value: 'PEN' },
        { label: 'Dólares (USD)', value: 'USD' }
    ];

    // Mock de sucursales
    branchId = 1;

    ngOnInit() {
        this.loadSuppliers();
        this.loadProducts();
    }

    loadSuppliers() {
        this.supplierService.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.suppliers.set(response.data);
                }
            }
        });
    }

    loadProducts() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.products.set(response.data);
                }
            }
        });
    }

    filterSuppliers(event: AutoCompleteCompleteEvent) {
        const query = event.query.toLowerCase();
        const filtered = this.suppliers().filter(s =>
            s.businessName.toLowerCase().includes(query) ||
            s.documentNumber.includes(query)
        );
        this.filteredSuppliers.set(filtered);
    }

    filterProducts(event: AutoCompleteCompleteEvent) {
        const query = event.query.toLowerCase();
        const filtered = this.products().filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.code?.toLowerCase().includes(query)
        );
        this.filteredProducts.set(filtered);
    }

    addLine() {
        if (!this.newProduct) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Seleccione un producto',
                life: 3000
            });
            return;
        }

        if (this.newQuantity <= 0 || this.newUnitCost <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Cantidad y costo deben ser mayores a 0',
                life: 3000
            });
            return;
        }

        const subtotal = this.newQuantity * this.newUnitCost;
        const tax = subtotal * (this.newIgvPercentage / 100);
        const total = subtotal + tax;

        const line: DetailLine = {
            productId: this.newProduct.id,
            productName: this.newProduct.name,
            quantity: this.newQuantity,
            unitCost: this.newUnitCost,
            igvPercentage: this.newIgvPercentage,
            lotCode: this.newLotCode || undefined,
            expirationDate: this.newExpirationDate || undefined,
            subtotal,
            tax,
            total
        };

        this.details.update(lines => [...lines, line]);
        this.clearLineForm();
    }

    removeLine(index: number) {
        this.details.update(lines => lines.filter((_, i) => i !== index));
    }

    clearLineForm() {
        this.newProduct = null;
        this.newQuantity = 1;
        this.newUnitCost = 0;
        this.newLotCode = '';
        this.newExpirationDate = null;
    }

    get subtotalGeneral(): number {
        return this.details().reduce((sum, d) => sum + d.subtotal, 0);
    }

    get igvTotal(): number {
        return this.details().reduce((sum, d) => sum + d.tax, 0);
    }

    get totalGeneral(): number {
        return this.details().reduce((sum, d) => sum + d.total, 0);
    }

    save() {
        // Validaciones
        if (!this.selectedSupplier) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Seleccione un proveedor',
                life: 3000
            });
            return;
        }

        if (!this.series || !this.number) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Ingrese serie y número del documento',
                life: 3000
            });
            return;
        }

        if (this.details().length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Agregue al menos un producto',
                life: 3000
            });
            return;
        }

        this.saving.set(true);

        const request: PurchaseRequest = {
            branchId: this.branchId,
            supplierId: this.selectedSupplier.id,
            voucherTypeId: this.voucherTypeId,
            series: this.series,
            number: this.number,
            issueDate: this.formatDate(this.issueDate),
            dueDate: this.dueDate ? this.formatDate(this.dueDate) : undefined,
            currencyId: this.currencyId,
            observations: this.observations,
            details: this.details().map(d => ({
                productId: d.productId,
                quantity: d.quantity,
                unitCost: d.unitCost,
                igvPercentage: d.igvPercentage,
                lotCode: d.lotCode,
                expirationDate: d.expirationDate ? this.formatDate(d.expirationDate) : undefined
            }))
        };

        // this.purchaseService.create(request).subscribe({
        //     next: (response) => {
        //         if (response.success) {
        //             this.messageService.add({
        //                 severity: 'success',
        //                 summary: 'Exitoso',
        //                 detail: 'Compra registrada correctamente',
        //                 life: 3000
        //             });
        //             setTimeout(() => {
        //                 this.router.navigate(['/compras']);
        //             }, 1500);
        //         }
        //         this.saving.set(false);
        //     },
        //     error: (err) => {
        //         console.error('Error:', err);
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Error',
        //             detail: 'No se pudo registrar la compra',
        //             life: 3000
        //         });
        //         this.saving.set(false);
        //     }
        // });
    }

    cancel() {
        this.router.navigate(['/compras']);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
