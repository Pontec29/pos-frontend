import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
  effect,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipModule } from 'primeng/chip';
import { forkJoin, finalize } from 'rxjs';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { GeneralService } from '@shared/services/general.service';
import { AlertService } from '@shared/services/alert.service';
import { ApiResponseSuccess } from '@shared/domains/api-response.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ResponseAfectacionIgvDto, ResponseMonedaDto } from '@shared/domains/general.dto';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProductoService } from '@inventario/productos/services/producto.service';
import { ProductoAdapter } from '@inventario/productos/domain/productos.adapter';
import { MarcaService } from '@inventario/marca/services/marca.service';
import { MarcaListar } from '@inventario/marca/domain/marca.interface';
import { CategoriaForm } from '@inventario/categoria/components/modal/categoria-form';
import { CategoriaService } from '@inventario/categoria/services/categoria.service';
import { Categoria } from '@inventario/categoria/domain/categoria.interface';
import { MarcaForm } from "@inventario/marca/components/modal/marca-form";
import { PresentacionUpSert, ProductoView } from '@inventario/productos/domain/productos.interface';
import { LoaderService } from '@shared/services/loader.service';
import { UnidadMedidaService } from '../../../../configuracion/unidades-medida/services/unidad-medida.service';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { ModalConfirmacionService } from '@shared/ui/modal-confirmacion/modal-confirmacion.service';
import type { UnidadMedidaListar } from '../../../../configuracion/unidades-medida/domain/unidad-medida.interface';

export interface PresentacionRowView extends PresentacionUpSert {
  unitName: string;
}

@Component({
  selector: 'app-new-producto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PRIMENG_FORM_MODULES,
    ToastModule,
    BreadcrumbModule,
    TooltipModule,
    TableModule,
    AutoCompleteModule,
    ToggleSwitchModule,
    SelectButtonModule,
    ConfirmDialogModule,
    ChipModule,
    AppButton,
    CategoriaForm,
    FloatLabelModule,
    MarcaForm,
    AppButton,
    ModalConfirmacionComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './new-producto.html',
  styleUrl: './new-producto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class NewProductoPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  private productoService = inject(ProductoService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private unidadMedidaService = inject(UnidadMedidaService);
  private generalService = inject(GeneralService);
  private alertService = inject(AlertService);
  private modalConfirmacionService = inject(ModalConfirmacionService);

  productId = signal<number | null>(null);
  isEditMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  showUnitDialog = signal<boolean>(false);
  showCategoryDialog = signal<boolean>(false);
  showMarcaDialog = signal<boolean>(false);
  showInactivePresentations = signal<boolean>(false);

  // ! DATA MAESTRA
  marcas = signal<MarcaListar[]>([]);
  categories = signal<Categoria[]>([]);
  unidadMedida = signal<UnidadMedidaListar[]>([]);
  unidadesMedidaBase = computed(() => this.unidadMedida());
  monedas = signal<ResponseMonedaDto[]>([]);
  afectacionIgv = signal<ResponseAfectacionIgvDto[]>([]);

  selectedUnitName = computed(() => {
    const id = this.productFormValue().unidadMedidaId;
    const unit = this.unidadMedida().find(u => u.ID_UNIDAD_MEDIDA === id);
    return unit ? unit.DESCRIPCION_SUNAT : '';
  });

  tiposProducto = [
    { label: 'Bien (Físico)', value: 'B' },
    { label: 'Servicio', value: 'S' }
  ];

  opcionesTrazabilidad = [
    { label: '📦 Estándar', value: 'NORMAL' },
    { label: '📅 Por Lote / Vcto', value: 'LOTE' },
    { label: '🔢 Por Serie', value: 'SERIE' }
  ];

  routeParams = toSignal(this.route.params, { initialValue: this.route.snapshot.params });

  @ViewChild('imageFileInput') imageFileInputRef?: ElementRef<HTMLInputElement>;

  imagePreviewUrl = signal<string | null>(null);
  imageFile = signal<File | null>(null);
  imageError = signal<string | null>(null);
  imageDragActive = signal(false);

  // ! PROFIT MARGIN SIGNAL (ERP PRO FEATURE)
  profitMargin = computed(() => {
    const data = this.productFormValue();
    const compra = data.precioCompra || 0;
    const venta = data.precioVenta || 0;

    if (compra <= 0 || venta <= 0) return 0;
    const margin = ((venta - compra) / venta) * 100;
    return Math.round(margin * 100) / 100;
  });

  filteredPresentations = computed(() => {
    const all = this.presentationsData();
    if (this.showInactivePresentations()) return all;
    return all.filter(p => p.ACTIVO !== false);
  });

  newUnitForm = this.fb.group({
    commercialName: ['', [Validators.required]],
    sunatCode: ['', [Validators.required]]
  });

  private readonly barcodePattern = /^[0-9]{8,13}$/;

  productForm = this.fb.group({
    // ! DATOS PRINCIPALES
    image: [''],
    nombreProducto: ['', [Validators.required]],
    marcaId: [null as number | null, [Validators.required]],
    unidadMedidaId: [null as number | null, [Validators.required]],
    tipoProducto: ['', [Validators.required]],
    codigoBarra: [''],
    sku: ['', [Validators.required]],
    // codigoInterno: ['', [Validators.required]],
    categoriaId: [null as number | null, [Validators.required]],
    description: [''],

    // ! TAB - PRECIOS
    monedaId: ['PEN', [Validators.required]],
    precioCompra: [null as number | null, [Validators.required, Validators.min(0)]],
    precioVenta: [null as number | null, [Validators.required, Validators.min(0)]],
    precioMinimoVenta: [null as number | null, [Validators.required, Validators.min(0)]],

    // ! UNIDADES Y PRESENTACIONES

    presentaciones: this.fb.group({
      unidadId: [null as number | null, [Validators.required]],
      priceBase: [null as number | null, [Validators.required, Validators.min(0.01)]],
      factor: [null, [Validators.required, Validators.min(1)]],
      barcode: ['', [Validators.required, Validators.pattern(/^[0-9]{8,13}$/)]],
      isPrimary: [false]
    }),

    afectacionIgvId: [null as string | null],
    complementaryTax: [null as number | null],
    controlStock: [null as boolean | null],
    minStock: [null as number | null],
    maxStock: [null as number | null],
    negativeStock: [null as boolean | null],
    active: [true],
    activeOnlineStore: [null as boolean | null],

    // ! TRAZABILIDAD
    tipoControlStock: ['NORMAL'],
    stockInicial: [0, [Validators.min(0)]],
    codigoLote: [''],
    fechaVencimiento: [null as Date | null],
    numeroSerie: ['']
  });

  productFormValue = toSignal(this.productForm.valueChanges, {
    initialValue: this.productForm.getRawValue()
  });

  constructor() {
    effect(() => {
      const presentations = this.presentationsData();
      const isFirst = presentations.length === 0;
      const factorControl = this.presentaciones.get('factor');

      if (isFirst) {
        factorControl?.setValue(1);
        factorControl?.disable();
      } else {
        factorControl?.enable();
      }
    });
  }

  ngOnInit() {
    this.loading.set(true);

    // 1. Cargar dependencias primero
    forkJoin({
      marcas: this.marcaService.getAll(),
      categories: this.categoriaService.getAll(),
      unidadMedida: this.unidadMedidaService.getAll(),
      moneda: this.generalService.getAllMonedas(),
      afectacionIgv: this.generalService.getAllAfectacionesIgv(),
    }).subscribe({
      next: (data) => {
        if (data.categories.success) this.categories.set(data.categories.data);
        if (data.marcas.success) this.marcas.set(data.marcas.data);
        if (data.unidadMedida.success) this.unidadMedida.set(data.unidadMedida.data);
        if (data.moneda.success) this.monedas.set(data.moneda.data);
        if (data.afectacionIgv.success) this.afectacionIgv.set(data.afectacionIgv.data);

        // 2. Carga drástica por ID (o identificador único en la ruta)
        const identifier = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('codigoBarras');

        if (identifier && identifier !== 'new' && identifier !== 'undefined') {
          const numericId = Number(identifier);
          if (!isNaN(numericId)) {
            this.productId.set(numericId);
            this.isEditMode.set(true);
            this.loadById(numericId);
          } else {
            this.loading.set(false);
          }
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar dependencias' });
        this.loading.set(false);
      }
    });

    const draft = this.presentaciones;
    if (draft) {
      this.actualizarFormularioValido();
      draft.valueChanges.subscribe(() => this.actualizarFormularioValido());
      draft.statusChanges.subscribe(() => this.actualizarFormularioValido());
    }

    const precioCompraCtrl = this.productForm.get('precioCompra');
    const precioVentaCtrl = this.productForm.get('precioVenta');
    const precioMinimoCtrl = this.productForm.get('precioMinimoVenta');
    const monedaCtrl = this.productForm.get('monedaId');

    precioCompraCtrl?.valueChanges.subscribe(() => {
      this.calcularMargenes();
      this.validarRelacionesDePrecios();
      this.autosave();
    });

    precioVentaCtrl?.valueChanges.subscribe(() => {
      this.calcularMargenes();
      this.validarRelacionesDePrecios();
      this.sincronizarPrecioPresentacionBase();
      this.autosave();
    });

    precioMinimoCtrl?.valueChanges.subscribe(() => {
      this.calcularMargenes();
      this.validarRelacionesDePrecios();
      this.autosave();
    });

    monedaCtrl?.valueChanges.subscribe(value => {
      this.currencyCode.set(value || 'PEN');
      this.autosave();
    });

    const tipoControlStock = this.productForm.get('tipoControlStock')?.value || 'NORMAL';
    this.updateTraceabilityState(tipoControlStock);

    const controlStockCtrl = this.productForm.get('controlStock');
    controlStockCtrl?.valueChanges.subscribe(value => {
      const minCtrl = this.productForm.get('minStock');
      const maxCtrl = this.productForm.get('maxStock');
      if (value) {
        minCtrl?.enable();
        maxCtrl?.enable();
      } else {
        minCtrl?.disable();
        minCtrl?.setValue(null);
        maxCtrl?.disable();
        maxCtrl?.setValue(null);
      }
    });
  }

  presentationsData = signal<PresentacionRowView[]>([]);
  primaryPresentationIndex = signal<number | null>(null);
  seriales = signal<string[]>([]);

  margenBruto = signal<number>(0);
  margenMinimo = signal<number>(0);
  currencyCode = signal<string>('PEN');

  formularioValido = false;
  private agregandoProducto = false;
  private autosaveKey = 'new-producto-precios-lotes';
  editingLoteIndex: number | null = null;

  get presentaciones(): FormGroup {
    return this.productForm.get('presentaciones') as FormGroup;
  }


  loadById(id: number) {
    this.loading.set(true);
    this.productoService.getById(id).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const product = response.data;
          // Aseguramos que el productId sea el ID interno real devuelto por el API
          this.productId.set(product.ID_PRODUCTO);
          this.populateForm(product);

          // Actualizar la URL del navegador con el ID real si es diferente al identificador usado
          const currentId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('codigoBarras');
          if (currentId !== product.ID_PRODUCTO.toString()) {
            this.router.navigate(['/inventario/productos/editar', product.ID_PRODUCTO], {
              replaceUrl: true,
              queryParamsHandling: 'preserve'
            });
          }
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontró información detallada del producto.'
          });
          this.router.navigate(['/inventario/productos']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al consumir el API de detalle por ID.'
        });
        this.router.navigate(['/inventario/productos']);
      }
    });
  }

  private populateForm(product: ProductoView) {
    this.productForm.patchValue({
      nombreProducto: product.NOMBRE,
      marcaId: product.ID_MARCA,
      tipoProducto: product.TIPO_PRODUCTO,
      codigoBarra: product.CODIGO_BARRAS,
      sku: product.SKU,
      categoriaId: product.ID_CATEGORIA,
      unidadMedidaId: product.ID_UNIDAD,
      description: product.DESCRIPCION,
      monedaId: product.ID_MONEDA,
      precioCompra: product.PRECIO_COMPRA,
      precioVenta: product.PRECIO_VENTA,
      precioMinimoVenta: product.PRECIO_MINIMO_VENTA,
      afectacionIgvId: product.CODIGO_AFECTACION_IGV,
      controlStock: product.CONTROLAR_STOCK,
      minStock: product.STOCK_MINIMO,
      maxStock: product.STOCK_MAXIMO,
      active: product.ACTIVO,
      activeOnlineStore: product.ACTIVO_TIENDA_ONLINE,
      tipoControlStock: product.TIPO_CONTROL_STOCK,
      stockInicial: product.STOCK_APERTURA?.CANTIDAD || 0,
      codigoLote: product.STOCK_APERTURA?.LOTE || '',
      fechaVencimiento: product.STOCK_APERTURA?.FECHA_VENCIMIENTO ? new Date(product.STOCK_APERTURA.FECHA_VENCIMIENTO) : null,

      // Mapeo de campos adicionales
      complementaryTax: product.IMPUESTO_ICBPER,
      negativeStock: product.PERMITIR_VENTA_SIN_STOCK,
    });

    this.updateTraceabilityState(product.TIPO_CONTROL_STOCK || 'NORMAL');

    if (product.PRESENTACIONES && product.PRESENTACIONES.length > 0) {
      const presentations: PresentacionRowView[] = product.PRESENTACIONES.map(p => {
        const unit = this.unidadMedida().find(u => u.ID_UNIDAD_MEDIDA === p.ID_UNIDAD);
        return {
          ID_UNIDAD: p.ID_UNIDAD,
          unitName: unit?.DESCRIPCION_SUNAT || 'N/A',
          FACTOR_CONVERSION_BASE: p.FACTOR_CONVERSION_BASE,
          CODIGO_BARRAS: p.CODIGO_BARRAS,
          PRECIO_VENTA: p.PRECIO_VENTA,
          ES_PRINCIPAL: p.ES_PRINCIPAL,
          ACTIVO: p.ACTIVO ?? true
        };
      });
      this.presentationsData.set(presentations);
    }

    if (product.STOCK_APERTURA?.SERIES) {
      this.seriales.set(product.STOCK_APERTURA.SERIES);
    }

    if (product.IMAGEN_URL) {
      this.imagePreviewUrl.set(product.IMAGEN_URL);
      this.productForm.patchValue({ image: product.IMAGEN_URL });
    }
  }

  updatePriceFieldsState(type: string, reset: boolean = false) {
    const precioCompraControl = this.productForm.get('precioCompra');
    const precioMinimoVentaControl = this.productForm.get('precioMinimoVenta');
    const precioVentaControl = this.productForm.get('precioVenta');

    if (type === 'S') {
      precioCompraControl?.disable();
      precioMinimoVentaControl?.disable();
      if (reset) {
        precioCompraControl?.setValue(null);
        precioMinimoVentaControl?.setValue(null);
      }
    } else {
      precioCompraControl?.enable();
      precioMinimoVentaControl?.enable();
    }
  }

  updateTraceabilityState(type: string) {
    const isService = this.productForm.get('tipoProducto')?.value === 'S';
    const isEdit = this.isEditMode();

    const stockInicialControl = this.productForm.get('stockInicial');
    const codigoLoteControl = this.productForm.get('codigoLote');
    const fechaVencimientoControl = this.productForm.get('fechaVencimiento');
    const numeroSerieControl = this.productForm.get('numeroSerie');
    const tipoControlStockControl = this.productForm.get('tipoControlStock');

    // Reset validations
    codigoLoteControl?.clearValidators();
    fechaVencimientoControl?.clearValidators();
    numeroSerieControl?.clearValidators();

    // ERP Rule: Stock inicial only on creation
    if (isEdit || isService) {
      stockInicialControl?.disable();
      stockInicialControl?.setValue(isService ? 0 : stockInicialControl.value);
    } else {
      stockInicialControl?.enable();
    }

    // ERP Rule: Traceability and Type locked on edit to preserve data integrity
    if (isEdit) {
      tipoControlStockControl?.disable();
      this.productForm.get('tipoProducto')?.disable();
    } else {
      tipoControlStockControl?.enable();
      this.productForm.get('tipoProducto')?.enable();
    }

    if (isService) {
      this.disableInventoryFields([codigoLoteControl, fechaVencimientoControl, numeroSerieControl]);
      return;
    }

    if (type === 'LOTE') {
      codigoLoteControl?.setValidators([Validators.required]);
      fechaVencimientoControl?.setValidators([Validators.required]);
      if (!isEdit) {
        codigoLoteControl?.enable();
        fechaVencimientoControl?.enable();
      }
      numeroSerieControl?.disable();
      numeroSerieControl?.setValue('');
    } else if (type === 'SERIE') {
      if (!isEdit) numeroSerieControl?.enable();
      codigoLoteControl?.disable();
      codigoLoteControl?.setValue('');
      fechaVencimientoControl?.disable();
      fechaVencimientoControl?.setValue(null);
    } else {
      this.disableInventoryFields([codigoLoteControl, fechaVencimientoControl, numeroSerieControl]);
    }

    codigoLoteControl?.updateValueAndValidity();
    fechaVencimientoControl?.updateValueAndValidity();
    numeroSerieControl?.updateValueAndValidity();
  }

  private disableInventoryFields(controls: (AbstractControl | null)[]) {
    controls.forEach(c => {
      c?.disable();
      c?.setValue(c.value instanceof Date ? null : '');
    });
  }

  onTipoTrazabilidadSelect(type: string) {
    this.productForm.patchValue({ tipoControlStock: type });
    this.updateTraceabilityState(type);
  }

  onTipoProductoChange(event: any) {
    this.updatePriceFieldsState(event.value, true);
    this.updateTraceabilityState(this.productForm.get('tipoControlStock')?.value || 'NORMAL');
  }

  onImageDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.imageDragActive.set(true);
  }

  onImageDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.imageDragActive.set(false);
  }

  onImageDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.imageDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }
    this.handleImageFiles(files);
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      return;
    }
    this.handleImageFiles(files);
  }

  onClearImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.imagePreviewUrl.set(null);
    this.imageFile.set(null);
    this.imageError.set(null);
    this.productForm.patchValue({ image: '' });
    if (this.imageFileInputRef?.nativeElement) {
      this.imageFileInputRef.nativeElement.value = '';
    }
  }

  generateEan13() {
    const ean = '775' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    this.productForm.patchValue({ codigoBarra: ean });
  }

  onBaseUnitChange(unitId: number) {
    if (!unitId) return;

    // Autoseleccionar la misma unidad en el borrador de presentaciones para ahorrar tiempo
    this.presentaciones.get('unidadId')?.setValue(unitId);

    // Regla ERP: Si no hay presentaciones, agregar la base automáticamente
    if (this.presentationsData().length === 0) {
      const unit = this.unidadMedida().find(u => u.ID_UNIDAD_MEDIDA === unitId);
      if (!unit) return;

      const precioVenta = this.productForm.get('precioVenta')?.value || 0;
      const barcode = this.productForm.get('codigoBarra')?.value || '';

      const basePresentation: PresentacionRowView = {
        ID_UNIDAD: unitId,
        unitName: unit.DESCRIPCION_SUNAT || 'N/A',
        FACTOR_CONVERSION_BASE: 1,
        PRECIO_VENTA: precioVenta,
        CODIGO_BARRAS: barcode,
        ES_PRINCIPAL: true
      };

      this.presentationsData.set([basePresentation]);
      this.messageService.add({
        severity: 'info',
        summary: 'Presentación Automática',
        detail: `Se ha agregado ${unit.DESCRIPCION_SUNAT} como presentación principal base.`
      });
    }
  }

  generatePresentationEan13() {
    const ean = '775' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const draft = this.presentaciones;
    if (!draft) {
      return;
    }
    draft.patchValue({ barcode: ean });
    const barcodeCtrl = draft.get('barcode');
    barcodeCtrl?.markAsDirty();
    barcodeCtrl?.markAsTouched();
    this.actualizarFormularioValido();
  }

  // removePresentation(index: number) {
  //   this.presentations.removeAt(index);
  //   const current = this.presentationsData();
  //   if (index >= 0 && index < current.length) {
  //     const next = current.slice();
  //     next.splice(index, 1);
  //     this.presentationsData.set(next);
  //   }
  // }

  agregarProducto() {
    if (this.agregandoProducto) {
      return;
    }

    const draft = this.presentaciones;
    if (!draft) {
      return;
    }

    draft.markAllAsTouched();

    const value = draft.getRawValue() as {
      unidadId: number | null;
      priceBase: number | null;
      factor: number | null;
      barcode: string | null;
    };

    const barcode = (value.barcode || '').trim();

    const invalidBasics =
      !value.unidadId ||
      value.priceBase == null ||
      value.priceBase <= 0 ||
      !value.factor ||
      value.factor <= 0 ||
      !barcode ||
      !this.barcodePattern.test(barcode);

    if (draft.invalid || invalidBasics) {
      this.actualizarFormularioValido();
      return;
    }

    const duplicate = this.presentationsData().some(
      row => row.ID_UNIDAD === value.unidadId
    );
    if (duplicate) {
      this.alertService.warn('Esta unidad de medida ya ha sido agregada para este producto', 'Atención');
      this.formularioValido = false;
      return;
    }

    // ERP Rule: There can only be ONE base presentation (Factor 1)
    if (value.factor === 1) {
      const hasFactor1 = this.presentationsData().some(p => p.FACTOR_CONVERSION_BASE === 1);
      if (hasFactor1) {
        this.alertService.error('Ya existe una presentación principal con Factor 1. Las cajas o fardos adicionales deben tener un factor mayor a 1.', 'Operación denegada');
        return;
      }
    }

    const unit = this.unidadMedida().find(
      u => (u as any).ID_UNIDAD_MEDIDA === value.unidadId || (u as any).id === value.unidadId
    );

    // Add null check for unit
    if (!unit) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unidad de medida no encontrada'
      });
      return;
    }

    this.agregandoProducto = true;

    const isFirst = this.presentationsData().length === 0;

    const row: PresentacionRowView = {
      ID_UNIDAD: value.unidadId as number,
      FACTOR_CONVERSION_BASE: value.factor as number,
      CODIGO_BARRAS: barcode,
      PRECIO_VENTA: Number(value.priceBase),
      ES_PRINCIPAL: isFirst,
      unitName: unit.DESCRIPCION_SUNAT || (unit as any).name || 'N/A',
      ACTIVO: true
    };

    const next = [...this.presentationsData(), row];
    this.presentationsData.set(next);
    this.primaryPresentationIndex.set(
      next.findIndex(p => p.ES_PRINCIPAL)
    );

    draft.reset({
      unidadId: null,
      priceBase: null,
      factor: isFirst ? 1 : null, // keep 1 for first, else null for next
      barcode: '',
      isPrimary: false
    });

    this.agregandoProducto = false;
    this.formularioValido = false;
  }

  onTogglePrimaryPresentation(index: number, checked: boolean) {
    const rows = [...this.presentationsData()];
    if (index < 0 || index >= rows.length) {
      return;
    }

    const row = rows[index];
    const currentPrimaryIndex = rows.findIndex(r => r.ES_PRINCIPAL);
    const currentPrimaries = rows.filter(r => r.ES_PRINCIPAL).length;

    if (!checked) {
      if (row.ES_PRINCIPAL && currentPrimaries === 1) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Debe existir al menos una presentación principal'
        });
        this.presentationsData.set([...rows]);
        this.primaryPresentationIndex.set(currentPrimaryIndex >= 0 ? currentPrimaryIndex : null);
        return;
      }
      row.ES_PRINCIPAL = false;
      const nextPrimaryIndex = rows.findIndex(r => r.ES_PRINCIPAL);
      this.presentationsData.set(rows);
      this.primaryPresentationIndex.set(nextPrimaryIndex >= 0 ? nextPrimaryIndex : null);
      return;
    }

    rows.forEach((r, i) => {
      r.ES_PRINCIPAL = i === index;
    });
    this.presentationsData.set(rows);
    this.primaryPresentationIndex.set(index);
  }

  removePresentation(index: number) {
    const current = this.presentationsData();
    if (index < 0 || index >= current.length) {
      return;
    }

    const removingPrimary = current[index].ES_PRINCIPAL;
    const next = current.filter((_, i) => i !== index);

    if (next.length === 0) {
      this.presentationsData.set([]);
      this.primaryPresentationIndex.set(null);
      return;
    }

    if (removingPrimary) {
      next[0].ES_PRINCIPAL = true;
      this.primaryPresentationIndex.set(0);
    } else {
      let primaryIndex = next.findIndex(r => r.ES_PRINCIPAL);
      if (primaryIndex === -1) {
        next[0].ES_PRINCIPAL = true;
        primaryIndex = 0;
      }
      this.primaryPresentationIndex.set(primaryIndex);
    }

    this.presentationsData.set(next);
  }

  confirmarEliminarPresentacion(index: number) {
    const current = this.presentationsData();
    if (index < 0 || index >= current.length) {
      return;
    }

    const presentacion = current[index];

    // ERP Rule: Prevent deleting the Base Presentation (Factor 1) or leaving the product empty
    if (presentacion.FACTOR_CONVERSION_BASE === 1) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acción Bloqueada',
        detail: 'No se puede eliminar la presentación primaria (Factor 1). Todo producto necesita una presentación base.'
      });
      return;
    }

    this.modalConfirmacionService.confirm(
      'deactivate',
      `Presentación: ${presentacion.unitName}`,
      () => {
        this.togglePresentationActive(index);
      }
    );
  }

  togglePresentationActive(index: number) {
    const rows = [...this.presentationsData()];
    const row = rows[index];

    if (row.FACTOR_CONVERSION_BASE === 1 && row.ACTIVO) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acción Bloqueada',
        detail: 'La presentación base (Factor 1) no puede ser desactivada.'
      });
      return;
    }

    row.ACTIVO = !row.ACTIVO;
    this.presentationsData.set(rows);

    this.messageService.add({
      severity: 'info',
      summary: 'Estado Actualizado',
      detail: `Presentación ${row.unitName} ha sido ${row.ACTIVO ? 'reactivada' : 'desactivada'}.`
    });
  }

  agregarSerie() {
    const control = this.productForm.get('numeroSerie');
    const value = (control?.value || '').trim();

    if (!value) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El número de serie no puede estar vacío.' });
      return;
    }

    if (this.seriales().includes(value)) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Este número de serie ya ha sido agregado.' });
      return;
    }

    this.seriales.update(current => [...current, value]);
    control?.setValue('');
  }

  eliminarSerie(index: number) {
    this.seriales.update(current => current.filter((_, i) => i !== index));
  }

  // ! GUARDAR DATA
  onUpSert(): void {
    const presentaciones = this.presentationsData();

    if (!this.isValidForm(presentaciones)) return;

    const formValue = this.productForm.getRawValue();
    const payload = ProductoAdapter.formToPayload(formValue, presentaciones, this.seriales());

    this.loading.set(true);

    const request$ = this.isEditMode() && this.productId()
      ? this.productoService.update(this.productId()!, payload)
      : this.productoService.create(payload);

    request$.pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => this.handleResponse(res),
      error: (err) => this.showError(err.message || 'Error en el servidor')
    });
  }

  private isValidForm(presentaciones: any[]): boolean {
    const ignoreDraft = presentaciones.length > 0;

    if (this.isProductFormInvalid(ignoreDraft)) {
      const controls = this.productForm.controls as Record<string, AbstractControl>;
      const invalidFields = Object.entries(controls)
        .filter(([name, control]) => control.invalid && !(ignoreDraft && name === 'presentaciones'))
        .map(([name]) => name);

      this.markProductFormAsTouched(ignoreDraft);
      const hasRequiredErrors = Object.values(controls).some(c => c.hasError('required'));
      const detail = hasRequiredErrors 
        ? 'Faltan campos obligatorios: ' + invalidFields.join(', ')
        : 'Existen inconsistencias en los datos. Revise los campos marcados en rojo.';

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: detail
      });
      return false;
    }

    if (!presentaciones.some(p => p.ES_PRINCIPAL || p.isPrimary)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Presentación Principal',
        detail: 'Debe existir al menos una presentación principal.'
      });
      return false;
    }

    // ! VALIDACIONES DE STOCK CONSISTENTES
    const controlStock = this.productForm.get('controlStock')?.value;
    const minStock = this.productForm.get('minStock')?.value || 0;
    const maxStock = this.productForm.get('maxStock')?.value || 0;
    const pCompra = this.productForm.get('precioCompra')?.value || 0;
    const pVenta = this.productForm.get('precioVenta')?.value || 0;
    const pVentaMin = this.productForm.get('precioMinimoVenta')?.value || 0;

    // ! VALIDACIONES DE PRECIOS GLOBALES
    if (this.productForm.get('tipoProducto')?.value === 'B' && pCompra >= 0) {
      if (pVenta < pCompra || pVentaMin < pCompra) {
        this.messageService.add({
          severity: 'error',
          summary: 'Inconsistencia de Precios',
          detail: 'El Precio de Venta o el Precio Mínimo no pueden ser menores al Precio de Compra. Revise sus costos para evitar pérdidas.'
        });
        return false;
      }
    }

    if (controlStock) {
      if (maxStock > 0 && minStock > maxStock) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Inconsistencia de Stock',
          detail: 'El stock mínimo no puede ser mayor al stock máximo.'
        });
        return false;
      }
    }

    // ! VALIDACIONES CONDICIONALES (LOTE / SERIE)
    const stockInicial = this.productForm.get('stockInicial')?.value || 0;
    const trazabilidad = this.productForm.get('tipoControlStock')?.value;

    if (stockInicial > 0) {
      if (trazabilidad === 'LOTE') {
        const codigoLote = this.productForm.get('codigoLote');
        const fechaVencimiento = this.productForm.get('fechaVencimiento');

        if (!codigoLote?.value || !fechaVencimiento?.value) {
          if (!codigoLote?.value) codigoLote?.markAsTouched();
          if (!fechaVencimiento?.value) fechaVencimiento?.markAsTouched();

          this.messageService.add({
            severity: 'warn',
            summary: 'Datos de Lote Incompletos',
            detail: 'Para el control por LOTE, debe ingresar el Código de Lote y la Fecha de Vencimiento.'
          });
          return false;
        }

        // ERP Rule: Prevent receiving initial stock that is already expired
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(fechaVencimiento.value) < today) {
          this.messageService.add({
            severity: 'error',
            summary: 'Fecha Inválida',
            detail: 'La fecha de vencimiento del lote inicial no puede ser una fecha pasada.'
          });
          return false;
        }

      } else if (trazabilidad === 'SERIE') {
        if (this.seriales().length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Series Requeridas',
            detail: 'Para el control por SERIE, debe ingresar al menos un número de serie.'
          });
          return false;
        }

        if (this.seriales().length !== stockInicial) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cantidad de Series Incorrecta',
            detail: `La cantidad de series ingresadas (${this.seriales().length}) debe coincidir con el stock inicial (${stockInicial}).`
          });
          return false;
        }
      }
    }

    return true;
  }

  private showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  private handleResponse(response: ApiResponseSuccess): void {
    if (response.success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: response.message || 'Operación realizada correctamente'
      });
      this.router.navigate(['/inventario/productos']);
    } else {
      this.showError(response.message);
    }
  }

  // ! CANCELAR
  onCancel() {
    this.router.navigate(['/inventario/productos']);
  }

  // ! MODAL
  openCategoryDialog() {
    this.showCategoryDialog.set(true);
  }

  openMarcaDialog() {
    this.showMarcaDialog.set(true);
  }

  private handleImageFiles(files: FileList) {
    this.imageError.set(null);

    if (files.length > 1) {
      this.imageError.set('Solo puedes subir una imagen por producto.');
      return;
    }

    const file = files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.imageError.set('Formato no permitido. Usa SVG, PNG, JPG o GIF.');
      return;
    }

    if (file.size > maxSizeBytes) {
      this.imageError.set('La imagen supera el tamaño máximo de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreviewUrl.set(result);
      this.imageFile.set(file);
      this.productForm.patchValue({ image: result });
    };
    reader.readAsDataURL(file);
  }

  private actualizarFormularioValido() {
    const draft = this.presentaciones;
    if (!draft) {
      this.formularioValido = false;
      return;
    }

    const value = draft.getRawValue() as {
      unidadId: number | null;
      priceBase: number | null;
      factor: number | null;
      barcode: string | null;
    };

    const barcode = (value.barcode || '').trim();

    const basicosValidos =
      draft.valid &&
      !!value.unidadId &&
      value.priceBase != null &&
      value.priceBase > 0 &&
      value.factor != null &&
      value.factor > 0 &&
      !!barcode &&
      this.barcodePattern.test(barcode);

    if (!basicosValidos) {
      this.formularioValido = false;
      return;
    }

    const duplicado = this.presentationsData().some(row => {
      return (
        row.ID_UNIDAD === (value.unidadId as number) &&
        row.FACTOR_CONVERSION_BASE === (value.factor as number) &&
        row.CODIGO_BARRAS === barcode
      );
    });

    this.formularioValido = !duplicado;
  }

  private sincronizarPrecioPresentacionBase(): void {
    const mainPrice = this.productForm.get('precioVenta')?.value || 0;
    const presentations = [...this.presentationsData()];
    const baseIndex = presentations.findIndex(p => p.FACTOR_CONVERSION_BASE === 1);

    if (baseIndex !== -1) {
      if (presentations[baseIndex].PRECIO_VENTA !== mainPrice) {
        presentations[baseIndex].PRECIO_VENTA = mainPrice;
        this.presentationsData.set(presentations);
      }
    }
  }

  private calcularMargenes(): void {
    const precioCompra = this.productForm.get('precioCompra')?.value ?? 0;
    const precioVenta = this.productForm.get('precioVenta')?.value ?? 0;
    const precioMinimoVenta = this.productForm.get('precioMinimoVenta')?.value ?? 0;

    if (precioCompra > 0 && precioVenta > 0 && precioVenta > precioCompra) {
      const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
      this.margenBruto.set(Number(margen.toFixed(2)));
    } else {
      this.margenBruto.set(0);
    }

    if (precioCompra > 0 && precioMinimoVenta > 0 && precioMinimoVenta > precioCompra) {
      const margen = ((precioMinimoVenta - precioCompra) / precioCompra) * 100;
      this.margenMinimo.set(Number(margen.toFixed(2)));
    } else {
      this.margenMinimo.set(0);
    }
  }

  private limpiarErroresRelacion(control: AbstractControl | null): void {
    if (!control || !control.errors) {
      return;
    }
    const { relation, higherThanSale, lowerThanCost, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  private validarRelacionesDePrecios(): void {
    const precioCompra = this.productForm.get('precioCompra')?.value ?? 0;
    const precioMinimoVenta = this.productForm.get('precioMinimoVenta')?.value ?? 0;
    const precioVenta = this.productForm.get('precioVenta')?.value ?? 0;
    const tipoProducto = this.productForm.get('tipoProducto')?.value;

    const precioCompraCtrl = this.productForm.get('precioCompra');
    const precioMinimoCtrl = this.productForm.get('precioMinimoVenta');
    const precioVentaCtrl = this.productForm.get('precioVenta');

    this.limpiarErroresRelacion(precioCompraCtrl);
    this.limpiarErroresRelacion(precioMinimoCtrl);
    this.limpiarErroresRelacion(precioVentaCtrl);

    // Validación 1: Venta < Compra (Solo Bienes)
    if (tipoProducto === 'B' && precioVenta > 0 && precioVenta < precioCompra) {
      const errors = precioVentaCtrl?.errors || {};
      precioVentaCtrl?.setErrors({ ...errors, lowerThanCost: true });
    }

    // Validación 2: Mínimo > Venta
    if (precioVenta > 0 && precioMinimoVenta > precioVenta) {
      const errors = precioMinimoCtrl?.errors || {};
      precioMinimoCtrl?.setErrors({ ...errors, higherThanSale: true });
    }
    
    // Validación 3: Mínimo <= Compra (Advertencia adicional)
    if (tipoProducto === 'B' && precioMinimoVenta > 0 && precioMinimoVenta <= precioCompra) {
       const errors = precioMinimoCtrl?.errors || {};
       precioMinimoCtrl?.setErrors({ ...errors, relation: true });
    }
  }

  private autosave(): void {
    const value = this.productForm.getRawValue();
    const data = {
      monedaId: value.monedaId,
      precioCompra: value.precioCompra,
      precioVenta: value.precioVenta,
      precioMinimoVenta: value.precioMinimoVenta,
    };
    try {
      localStorage.setItem(this.autosaveKey, JSON.stringify(data));
    } catch {
    }
  }

  private isProductFormInvalid(ignoreDraftPresentaciones: boolean): boolean {
    const controls = this.productForm.controls as Record<string, AbstractControl>;
    return Object.entries(controls)
      .filter(([name]) => !(ignoreDraftPresentaciones && name === 'presentaciones'))
      .some(([, control]) => control.invalid);
  }

  private markProductFormAsTouched(ignoreDraftPresentaciones: boolean): void {
    const controls = this.productForm.controls as Record<string, AbstractControl>;
    Object.entries(controls)
      .filter(([name]) => !(ignoreDraftPresentaciones && name === 'presentaciones'))
      .forEach(([, control]) => control.markAllAsTouched());
  }
}
