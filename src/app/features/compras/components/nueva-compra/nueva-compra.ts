import { Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { PRIMENG_FILTER_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from "@shared/ui/button";
import { CompraUpsertDto } from '@compras/domain/compras.dto';
import { CompraCrear, TipoOperacion, SunatAfectacionIgv } from '@compras/domain/compras.interface';
import { ComprasService } from '@compras/service/compras.service';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Toast } from "primeng/toast";
import { GeneralService } from '@shared/services/general.service';
import { ProductoService } from '@inventario/productos/services/producto.service';

@Component({
  selector: 'app-nueva-compra',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PRIMENG_FORM_MODULES,
    ...PRIMENG_FILTER_MODULES,
    CardModule,
    TableModule,
    Toast
  ],
  templateUrl: './nueva-compra.html',
  styleUrl: './nueva-compra.scss',
})
export default class NuevaCompra implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private readonly messageService = inject(MessageService);

  private readonly compService = inject(ComprasService);
  private readonly generalService = inject(GeneralService);
  private readonly productoService = inject(ProductoService);

  saving = signal(false);
  tiposOperacion = signal<TipoOperacion[]>([]);
  afectacionesIgv = signal<SunatAfectacionIgv[]>([]);

  // ! SOLO RECIBE DATA PARA ACTUALIZAR UNA COMPRA
  dataCompras = input<CompraUpsertDto>();

  // ! LISTAS Y OPCIONES (Mockeadas por ahora, deberían venir de servicios)
  voucherTypes = [
    { label: 'Factura', value: '01' },
    { label: 'Boleta', value: '03' },
    { label: 'Nota de Crédito', value: '07' }
  ];

  currencies = [
    { label: 'Soles', value: 'PEN' },
    { label: 'Dólares', value: 'USD' }
  ];

  // ! SIGNALS PARA AUTOCOMPLETE
  filteredSuppliers = signal<any[]>([]);
  filteredProducts = signal<any[]>([]);
  selectedSupplier = signal<any | null>(null);

  // ! VARIABLES PARA AGREGAR PRODUCTO (NO SON PARTE DEL FORM GROUP PRINCIPAL)
  newProduct = signal<any | null>(null);
  newQuantity = signal<number | null>(null);
  newUnitCost = signal<number | null>(null);
  newAfectacion = signal<SunatAfectacionIgv | null>(null);
  newLotCode = signal<string>('');
  newExpirationDate = signal<Date | null>(null);

  // ! FORMULARIO REACTIVO
  form = this.fb.group({
    ID_ALMACEN: [1, [Validators.required]], // Default almacén 1
    ID_PROVEEDOR: [null as number | null, [Validators.required]],
    ID_TIPO_OPERACION: [null as number | null, [Validators.required]],
    ID_TIPO_COMPROBANTE: [null as string | null, [Validators.required]],
    SERIE: ['', [Validators.required, Validators.maxLength(4)]],
    NUMERO: ['', [Validators.required, Validators.maxLength(10)]],
    FECHA_EMISION: [new Date(), [Validators.required]],
    FECHA_VENCIMIENTO: [null as Date | null],
    ID_MONEDA: ['PEN', [Validators.required]],
    TIPO_CAMBIO: [1, [Validators.required, Validators.min(0.001)]],
    OBSERVACIONES: [''],
    DETALLES: this.fb.array([], [Validators.required, Validators.minLength(1)])
  });

  ngOnInit() {
    this.loadCatalogs();
  }

  loadCatalogs() {
    this.compService.getTiposOperacion().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tiposOperacion.set(res.data);
          // Set default if available
          if (res.data.length > 0) {
            this.form.patchValue({ ID_TIPO_OPERACION: res.data[0].id });
          }
        }
      }
    });

    this.compService.getAfectacionesIgv().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.afectacionesIgv.set(res.data);
          // Set default for new product
          if (res.data.length > 0) {
            const defaultAfectacion = res.data.find(a => a.codigoSunat === '10') || res.data[0];
            this.newAfectacion.set(defaultAfectacion);
          }
        }
      }
    });
  }

  // ! GETTERS
  get detalles() {
    return this.form.get('DETALLES') as FormArray;
  }

  get detailsControls() {
    return this.detalles.controls as FormGroup[];
  }

  // ! CALCULOS COMPUTADOS
  subtotalGeneral = computed(() => {
    // Implementar lógica si es necesario, o usar valores del form
    const detalles = this.form.value.DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => acc + (curr.SUBTOTAL || 0), 0);
  });

  igvTotal = computed(() => {
    const detalles = this.form.value.DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => acc + (curr.IGV || 0), 0);
  });

  totalGeneral = computed(() => {
    const detalles = this.form.value.DETALLES as any[];
    if (!detalles) return 0;
    // El total general solo suma lo que NO es gratuito
    return detalles.reduce((acc, curr) => {
      const isGratuito = this.afectacionesIgv().find(a => a.id === curr.ID_AFECTACION_IGV)?.esBonificacion;
      return acc + (isGratuito ? 0 : (curr.TOTAL || 0));
    }, 0);
  });

  opGratuita = computed(() => {
    const detalles = this.form.value.DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => {
      const isGratuito = this.afectacionesIgv().find(a => a.id === curr.ID_AFECTACION_IGV)?.esBonificacion;
      return acc + (isGratuito ? (curr.TOTAL || 0) : 0);
    }, 0);
  });

  noGravado = computed(() => {
    const detalles = this.form.value.DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => {
      const afectacion = this.afectacionesIgv().find(a => a.id === curr.ID_AFECTACION_IGV);
      const isNoGravado = afectacion && !afectacion.aplicaIgv && !afectacion.esBonificacion;
      return acc + (isNoGravado ? (curr.SUBTOTAL || 0) : 0);
    }, 0);
  });


  // ! METODOS DE AUTOCOMPLETE
  filterSuppliers(event: any) {
    const query = event.query?.trim();
    if (!query || query.length < 2) return;

    this.generalService.buscarContactos(query, 'P').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const mappedSuppliers = res.data.map(c => ({
            id: c.id,
            businessName: c.razonSocial,
            ruc: c.numeroDocumento
          }));
          this.filteredSuppliers.set(mappedSuppliers);
        }
      }
    });
  }

  filterProducts(event: any) {
    const query = event.query?.trim();
    if (!query || query.length < 2) return;

    this.productoService.buscar(query).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const mappedProducts = res.data.map(p => ({
            id: p.id,
            name: p.nombre,
            unitId: p.idUnidadBase || 1,
            igv: 18 // Default IGV, ideally this should come from the product or company config
          }));
          this.filteredProducts.set(mappedProducts);
        }
      }
    });
  }

  // ! MANEJO DEL PROVEEDOR SELECCIONADO
  // Helper para manejar la selección del autocomplete y setear el ID en el form
  onSupplierSelect(supplier: any) {
    this.form.patchValue({ ID_PROVEEDOR: supplier.id });
  }

  // ! AGREGAR Y ELIMINAR LINEAS
  addLine() {
    const product = this.newProduct();
    const quantity = this.newQuantity();
    const cost = this.newUnitCost();

    if (!product || !quantity || !cost) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los datos del producto' });
      return;
    }

    const afectacion = this.newAfectacion();

    if (!afectacion) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una afectación de IGV' });
      return;
    }

    // Cálculos basados en afectación
    const igvPercent = product.igv || 18;
    const aplicaIgv = afectacion.aplicaIgv;

    // Si aplica IGV, el costo es el valor unitario (base)
    // Si no aplica, el costo es el precio total de línea dividido por cantidad? 
    // Usualmente el usuario ingresa el Valor Unitario (sin IGV)
    const subtotal = quantity * cost;
    const igv = aplicaIgv ? (subtotal * (igvPercent / 100)) : 0;
    const total = subtotal + igv;

    const detalleGroup = this.fb.group({
      ID_PRODUCTO: [product.id, [Validators.required]],
      PRODUCTO_NOMBRE: [product.name],
      ID_AFECTACION_IGV: [afectacion.id, [Validators.required]],
      AFECTACION_NOMBRE: [afectacion.descripcion],
      CANTIDAD: [quantity, [Validators.required, Validators.min(0.01)]],
      ID_UNIDAD: [product.unitId || 1, [Validators.required]],
      VALOR_UNITARIO: [cost, [Validators.required]],
      PRECIO_UNITARIO: [cost * (aplicaIgv ? (1 + igvPercent / 100) : 1)],
      PORCENTAJE_IGV: [igvPercent, [Validators.required]],
      CODIGO_LOTE: [this.newLotCode()],
      FECHA_VENCIMIENTO: [this.newExpirationDate()],
      SUBTOTAL: [subtotal],
      IGV: [igv],
      TOTAL: [total]
    });

    this.detalles.push(detalleGroup);

    // Reset fields
    this.newProduct.set(null);
    this.newQuantity.set(null);
    this.newUnitCost.set(null);
    this.newLotCode.set('');
    this.newExpirationDate.set(null);
  }

  removeLine(index: number) {
    this.detalles.removeAt(index);
  }

  cancel() {
    this.router.navigate(['/compras']);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los campos obligatorios' });
      return;
    }

    const formValue = this.form.getRawValue();

    // Map form values to CompraCrear interface
    // Ensure dates are strings YYYY-MM-DD
    const compra: CompraCrear = {
      ID_ALMACEN: formValue.ID_ALMACEN!,
      ID_PROVEEDOR: formValue.ID_PROVEEDOR!,
      ID_TIPO_OPERACION: formValue.ID_TIPO_OPERACION!,
      ID_TIPO_COMPROBANTE: formValue.ID_TIPO_COMPROBANTE!,
      SERIE: formValue.SERIE!,
      NUMERO: formValue.NUMERO!,
      FECHA_EMISION: this.formatDate(formValue.FECHA_EMISION),
      FECHA_VENCIMIENTO: this.formatDate(formValue.FECHA_VENCIMIENTO),
      ID_MONEDA: formValue.ID_MONEDA!,
      TIPO_CAMBIO: formValue.TIPO_CAMBIO!,
      OBSERVACIONES: formValue.OBSERVACIONES || '',
      DETALLES: formValue.DETALLES.map((d: any) => ({
        ID_PRODUCTO: d.ID_PRODUCTO,
        ID_AFECTACION_IGV: d.ID_AFECTACION_IGV,
        CANTIDAD: d.CANTIDAD,
        ID_UNIDAD: d.ID_UNIDAD,
        VALOR_UNITARIO: d.VALOR_UNITARIO,
        PRECIO_UNITARIO: d.PRECIO_UNITARIO,
        PORCENTAJE_IGV: d.PORCENTAJE_IGV,
        CODIGO_LOTE: d.CODIGO_LOTE || '',
        FECHA_VENCIMIENTO: this.formatDate(d.FECHA_VENCIMIENTO)
      }))
    };

    this.saving.set(true);
    this.compService.create(compra).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Compra registrada correctamente' });
          this.router.navigate(['/compras']);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo registrar la compra' });
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('Error al guardar compra:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar la compra' });
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return String(date); // Fallback if it's already a string or other type
  }

}
