import { Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PRIMENG_FILTER_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { CompraUpsertDto } from '@compras/domain/compras.dto';
import { CompraCrear, TipoOperacion, SunatAfectacionIgv } from '@compras/domain/compras.interface';
import { ComprasService } from '@compras/service/compras.service';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  private readonly compService = inject(ComprasService);
  private readonly generalService = inject(GeneralService);
  private readonly productoService = inject(ProductoService);

  saving = signal(false);
  isViewMode = signal(false);
  isEditMode = signal(false);
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
  availablePresentations = signal<any[]>([]);

  // ! FORMULARIO REACTIVO
  form = this.fb.group({
    ID_ALMACEN: [1, [Validators.required]], // Default almacén 1
    ID_PROVEEDOR: [null as any | null, [Validators.required]],
    ID_TIPO_OPERACION: [null as number | null, [Validators.required]],
    ID_TIPO_COMPROBANTE: ['01', [Validators.required]],
    SERIE: ['', [Validators.required, Validators.maxLength(4)]],
    NUMERO: ['', [Validators.required, Validators.maxLength(10)]],
    FECHA_EMISION: [new Date(), [Validators.required]],
    FECHA_VENCIMIENTO: [null as Date | null],
    ID_MONEDA: ['PEN', [Validators.required]],
    TIPO_CAMBIO: [1, [Validators.required, Validators.min(0.001)]],
    OBSERVACIONES: [''],
    
    // CONFIGURACIÓN DE INGRESO A ALMACÉN
    GENERA_INGRESO: [true],

    // CAMPOS TEMPORALES PARA AGREGAR PRODUCTO
    TEMP_PRODUCTO: [null as any | null],
    TEMP_UNIDAD: [null as any | null],
    TEMP_CANTIDAD: [null as number | null],
    TEMP_COSTO: [null as number | null],
    TEMP_AFECTACION: [null as SunatAfectacionIgv | null],
    TEMP_LOTE: [''],
    TEMP_VENCIMIENTO: [null as Date | null],

    DETALLES: this.fb.array([], [Validators.required, Validators.minLength(1)])
  });

  ngOnInit() {
    this.loadCatalogs();

    this.form.valueChanges.subscribe(() => {
      this.formUpdateTrigger.update(v => v + 1);
    });

    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.url[0]?.path;
    
    if (path === 'editar') {
      this.isEditMode.set(true);
    }

    if (id) {
      if (path === 'ver') this.isViewMode.set(true);
      this.loadCompra(Number(id));
    }
  }

  loadCompra(id: number) {
    this.compService.getById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const compra = res.data;
          
          // Mapear cabecera
          this.form.patchValue({
            ID_ALMACEN: compra.ID_ALMACEN,
            ID_PROVEEDOR: { id: compra.ID_PROVEEDOR, businessName: compra.PROVEEDOR },
            ID_TIPO_OPERACION: compra.ID_TIPO_OPERACION,
            ID_TIPO_COMPROBANTE: compra.ID_TIPO_COMPROBANTE,
            SERIE: compra.SERIE,
            NUMERO: compra.NUMERO,
            FECHA_EMISION: new Date(compra.FECHA_EMISION + 'T00:00:00'),
            FECHA_VENCIMIENTO: compra.FECHA_VENCIMIENTO ? new Date(compra.FECHA_VENCIMIENTO + 'T00:00:00') : null,
            ID_MONEDA: compra.ID_MONEDA,
            TIPO_CAMBIO: compra.TIPO_CAMBIO,
            OBSERVACIONES: compra.OBSERVACIONES,
            GENERA_INGRESO: false // No aplica para visualización
          });

          // Limpiar detalles y cargar nuevos
          this.detalles.clear();
          if (compra.DETALLES) {
            compra.DETALLES.forEach((d: any) => {
              const detalleGroup = this.fb.group({
                ID_PRODUCTO: [d.ID_PRODUCTO],
                PRODUCTO_NOMBRE: [d.PRODUCTO_NOMBRE],
                ID_AFECTACION_IGV: [d.ID_AFECTACION_IGV],
                AFECTACION_NOMBRE: [d.AFECTACION_NOMBRE],
                CANTIDAD: [d.CANTIDAD],
                ID_UNIDAD: [d.ID_UNIDAD],
                UNIDAD_NOMBRE: [d.UNIDAD_NOMBRE],
                FACTOR_CONVERSION: [d.FACTOR_CONVERSION],
                VALOR_UNITARIO: [d.VALOR_UNITARIO],
                PRECIO_UNITARIO: [d.PRECIO_UNITARIO],
                PORCENTAJE_IGV: [d.PORCENTAJE_IGV],
                CODIGO_LOTE: [d.CODIGO_LOTE],
                FECHA_VENCIMIENTO: [d.FECHA_VENCIMIENTO ? new Date(d.FECHA_VENCIMIENTO + 'T00:00:00') : null],
                SUBTOTAL: [d.SUBTOTAL],
                IGV: [d.IGV],
                TOTAL: [d.TOTAL]
              });
              this.detalles.push(detalleGroup);
            });
          }

          if (this.isViewMode()) {
            this.form.disable();
          } else {
            this.form.enable();
          }

          // Forzar recálculo de totales
          this.formUpdateTrigger.update(v => v + 1);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la compra' });
      }
    });
  }

  loadCatalogs() {
    this.compService.getTiposOperacion().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tiposOperacion.set(res.data);
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
          if (res.data.length > 0) {
            const defaultAfectacion = res.data.find(a => a.codigoSunat === '10') || res.data[0];
            this.form.patchValue({ TEMP_AFECTACION: defaultAfectacion });
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

  // ! REATIVIDAD PARA TOTALES
  // Usamos un signal que se actualiza manualmente o mediante un stream que incluya controles deshabilitados
  private formUpdateTrigger = signal(0);

  // ! CALCULOS COMPUTADOS
  subtotalGeneral = computed(() => {
    this.formUpdateTrigger(); // Dependencia
    const detalles = this.form.getRawValue().DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => acc + (curr.SUBTOTAL || 0), 0);
  });

  igvTotal = computed(() => {
    this.formUpdateTrigger();
    const detalles = this.form.getRawValue().DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => acc + (curr.IGV || 0), 0);
  });

  totalGeneral = computed(() => {
    this.formUpdateTrigger();
    const detalles = this.form.getRawValue().DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => {
      const isGratuito = this.afectacionesIgv().find(a => a.id === curr.ID_AFECTACION_IGV)?.esBonificacion;
      return acc + (isGratuito ? 0 : (curr.TOTAL || 0));
    }, 0);
  });

  opGratuita = computed(() => {
    this.formUpdateTrigger();
    const detalles = this.form.getRawValue().DETALLES as any[];
    if (!detalles) return 0;
    return detalles.reduce((acc, curr) => {
      const isGratuito = this.afectacionesIgv().find(a => a.id === curr.ID_AFECTACION_IGV)?.esBonificacion;
      return acc + (isGratuito ? (curr.TOTAL || 0) : 0);
    }, 0);
  });

  noGravado = computed(() => {
    this.formUpdateTrigger();
    const detalles = this.form.getRawValue().DETALLES as any[];
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
            presentaciones: p.presentaciones || []
          }));
          this.filteredProducts.set(mappedProducts);
        }
      }
    });
  }

  onProductSelect(event: any) {
    // PrimeNG autocomplete puede devolver el objeto directamente o dentro de event.value
    const product = event.value || event;
    
    if (product && product.presentaciones) {
      this.availablePresentations.set(product.presentaciones);
      // Seleccionar la principal por defecto
      const principal = product.presentaciones.find((p: any) => p.esPrincipal) || product.presentaciones[0];
      this.form.patchValue({ TEMP_UNIDAD: principal });
    } else {
      this.availablePresentations.set([]);
      this.form.patchValue({ TEMP_UNIDAD: null });
    }
  }

  // ! MANEJO DEL PROVEEDOR SELECCIONADO
  // Helper para manejar la selección del autocomplete y setear el ID en el form
  onSupplierSelect(event: any) {
    const supplier = event.value || event;
    this.form.patchValue({ ID_PROVEEDOR: supplier });
  }

  // ! AGREGAR Y ELIMINAR LINEAS
  addLine() {
    const values = this.form.value;
    const product = values.TEMP_PRODUCTO;
    const unit = values.TEMP_UNIDAD;
    const quantity = values.TEMP_CANTIDAD;
    const cost = values.TEMP_COSTO;
    const afectacion = values.TEMP_AFECTACION;

    if (!product || !unit || !quantity || !cost || !afectacion) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los datos del producto y unidad' });
      return;
    }

    const igvPercent = 18;
    const aplicaIgv = afectacion.aplicaIgv;
    const subtotal = (quantity || 0) * (cost || 0);
    const igv = aplicaIgv ? (subtotal * (igvPercent / 100)) : 0;
    const total = subtotal + igv;

    const detalleGroup = this.fb.group({
      ID_PRODUCTO: [product.id, [Validators.required]],
      PRODUCTO_NOMBRE: [product.name],
      ID_AFECTACION_IGV: [afectacion.id, [Validators.required]],
      AFECTACION_NOMBRE: [afectacion.descripcion],
      CANTIDAD: [quantity, [Validators.required, Validators.min(0.01)]],
      ID_UNIDAD: [unit.unidadId, [Validators.required]],
      UNIDAD_NOMBRE: [unit.unidadNombre],
      FACTOR_CONVERSION: [unit.factorConversionBase || 1],
      VALOR_UNITARIO: [cost, [Validators.required]],
      PRECIO_UNITARIO: [(cost || 0) * (aplicaIgv ? (1 + igvPercent / 100) : 1)],
      PORCENTAJE_IGV: [igvPercent, [Validators.required]],
      CODIGO_LOTE: [values.TEMP_LOTE || ''],
      FECHA_VENCIMIENTO: [values.TEMP_VENCIMIENTO],
      SUBTOTAL: [subtotal],
      IGV: [igv],
      TOTAL: [total]
    });

    this.detalles.push(detalleGroup);

    // Reset fields en el form
    this.form.patchValue({
      TEMP_PRODUCTO: null,
      TEMP_UNIDAD: null,
      TEMP_CANTIDAD: null,
      TEMP_COSTO: null,
      TEMP_LOTE: '',
      TEMP_VENCIMIENTO: null
    });

    this.form.get('DETALLES')?.updateValueAndValidity({ emitEvent: true });
  }

  removeLine(index: number) {
    this.detalles.removeAt(index);
  }

  updateRowTotals(index: number) {
    const row = this.detalles.at(index) as FormGroup;
    const quantity = row.get('CANTIDAD')?.value || 0;
    const cost = row.get('VALOR_UNITARIO')?.value || 0;
    const afectacionId = row.get('ID_AFECTACION_IGV')?.value;
    const afectacion = this.afectacionesIgv().find(a => a.id === afectacionId);

    const igvPercent = row.get('PORCENTAJE_IGV')?.value || 18;
    const aplicaIgv = afectacion?.aplicaIgv ?? true;

    const subtotal = quantity * cost;
    const igv = aplicaIgv ? (subtotal * (igvPercent / 100)) : 0;
    const total = subtotal + igv;

    row.patchValue({
      SUBTOTAL: subtotal,
      IGV: igv,
      TOTAL: total,
      PRECIO_UNITARIO: cost * (aplicaIgv ? (1 + igvPercent / 100) : 1)
    }, { emitEvent: false });

    // Forzar actualización de señales computadas
    this.form.get('DETALLES')?.updateValueAndValidity();
  }

  cancel() {
    this.router.navigate(['/compras']);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Identificar qué campo está fallando para avisar al usuario
      const invalidFields = [];
      const controls = this.form.controls as any;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidFields.push(name);
        }
      }

      console.log('Campos inválidos:', invalidFields);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Formulario Incompleto', 
        detail: `Por favor revise los siguientes campos: ${invalidFields.join(', ')}` 
      });
      return;
    }

    const formValue = this.form.getRawValue();

    // Map form values to CompraCrear interface
    // Ensure dates are strings YYYY-MM-DD
    const compra: CompraCrear = {
      ID_ALMACEN: formValue.ID_ALMACEN!,
      ID_PROVEEDOR: formValue.ID_PROVEEDOR?.id || formValue.ID_PROVEEDOR,
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
    const id = this.route.snapshot.paramMap.get('id');
    
    const obs$ = (id && this.isEditMode())
      ? this.compService.update(Number(id), compra)
      : this.compService.create(compra);

    obs$.subscribe({
      next: (response: any) => {
        this.saving.set(false);
        if (response.success) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: this.isEditMode() ? 'Compra actualizada correctamente' : 'Compra registrada correctamente' 
          });
          this.router.navigate(['/compras']);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo procesar la compra' });
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('Error al guardar compra:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ocurrió un error al guardar la compra' });
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
