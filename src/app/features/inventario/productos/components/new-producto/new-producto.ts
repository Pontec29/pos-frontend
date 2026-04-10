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
import { forkJoin, finalize } from 'rxjs';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { GeneralService } from '@shared/services/general.service';
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
import { PresentacionUpSert } from '@inventario/productos/domain/productos.interface';
import { LoaderService } from '@shared/services/loader.service';
import { UnidadMedidaService } from '../../../../configuracion/unidades-medida/services/unidad-medida.service';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
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

  productId = signal<number | null>(null);
  isEditMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  showUnitDialog = signal<boolean>(false);
  showCategoryDialog = signal<boolean>(false);
  showMarcaDialog = signal<boolean>(false);

  // ! DATA MAESTRA
  marcas = signal<MarcaListar[]>([]);
  categories = signal<Categoria[]>([]);
  unidadMedida = signal<UnidadMedidaListar[]>([]);
  unidadesMedidaBase = computed(() => {
    const unidades = this.unidadMedida();
    return unidades.filter(u => u && u.ES_BASE === true);
  });
  monedas = signal<ResponseMonedaDto[]>([]);
  afectacionIgv = signal<ResponseAfectacionIgvDto[]>([]);

  tiposProducto = [
    { label: 'Bien (Físico)', value: 'B' },
    { label: 'Servicio', value: 'S' }
  ];

  routeParams = toSignal(this.route.params, { initialValue: this.route.snapshot.params });

  @ViewChild('imageFileInput') imageFileInputRef?: ElementRef<HTMLInputElement>;

  imagePreviewUrl = signal<string | null>(null);
  imageFile = signal<File | null>(null);
  imageError = signal<string | null>(null);
  imageDragActive = signal(false);

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
    codigoBarra: ['', [Validators.required]],
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

    afectacionIgvId: [null],
    complementaryTax: [null],
    controlStock: [null],
    minStock: [null],
    maxStock: [null],
    negativeStock: [null],
    active: [true],
    activeOnlineStore: [null],

    // ! TRAZABILIDAD
    tipoControlStock: ['NORMAL'],
    stockInicial: [0, [Validators.min(0)]],
    codigoLote: [''],
    fechaVencimiento: [null],
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
    this.loadDependencies();

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

    const tipoTrazabilidad = this.productForm.get('tipoTrazabilidad')?.value || 'ESTANDAR';
    this.updateTraceabilityState(tipoTrazabilidad);
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


  loadProductByCode(code: string) {
    this.loading.set(true);
    // this.productoService.searchProductoCode(code).subscribe({
    //   next: (response) => {
    //     if (response.success && response.data) {
    //       const product = response.data;
    //       this.productId.set(product.ID_PRODUCTO);

    //       this.productForm.patchValue({
    //         nombreProducto: product.NOMBRE,
    //         marcaId: product.ID_MARCA,
    //         tipoProducto: product.TIPO_PRODUCTO,
    //         codigoBarra: product.CODIGO_BARRAS,
    //         sku: product.SKU,
    //         // codigoInterno: product.CODIGO_INTERNO,
    //         categoriaId: product.ID_CATEGORIA,
    //         description: product.DESCRIPCION,

    //         monedaId: product.ID_MONEDA,
    //         precioCompra: product.PRECIO_COMPRA,
    //         precioVenta: product.PRECIO_VENTA,
    //         precioMinimoVenta: product.PRECIO_MINIMO_VENTA,

    //         afectacionIgvId: product.CODIGO_AFECTACION_IGV,
    //         controlStock: product.CONTROLAR_STOCK,
    //         minStock: product.STOCK_MINIMO,
    //         maxStock: product.STOCK_MAXIMO,
    //         negativeStock: product.PERMITIR_VENTA_SIN_STOCK || false,

    //         tipoControlStock: product.TIPO_CONTROL_STOCK,
    //         activeOnlineStore: product.ACTIVO_TIENDA_ONLINE,
    //         active: product.ACTIVO
    //       });

    //       this.updatePriceFieldsState(product.TIPO_PRODUCTO);

    //       if (product.PRESENTACIONES && product.PRESENTACIONES.length > 0) {
    //         const presentations: PresentationRowView[] = product.PRESENTACIONES.map(p => ({
    //           unitId: p.ID_UNIDAD,
    //           unitName: p.UNIDAD_NOMBRE,
    //           factor: p.FACTOR_CONVERSION_BASE,
    //           barcode: p.CODIGO_BARRAS,
    //           salePrice: p.PRECIO_VENTA,
    //           isPrimary: p.ES_PRINCIPAL
    //         }));

    //         this.presentationsData.set(presentations);
    //         const primaryIndex = presentations.findIndex(p => p.isPrimary);
    //         this.primaryPresentationIndex.set(primaryIndex !== -1 ? primaryIndex : null);
    //       }

    //       if (product.IMAGEN_URL) {
    //         this.imagePreviewUrl.set(product.IMAGEN_URL);
    //       }
    //     }
    //     this.loading.set(false);
    //   },
    //   error: (err) => {
    //     console.error('Error loading product', err);
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: 'No se pudo cargar el producto. Verifique el código de barras.'
    //     });
    //     this.loading.set(false);
    //     this.router.navigate(['/inventario/productos']);
    //   }
    // });
  }

  updatePriceFieldsState(type: string, reset: boolean = false) {
    const precioCompraControl = this.productForm.get('precioCompra');
    const precioMinimoVentaControl = this.productForm.get('precioMinimoVenta');

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
    const stockInicialControl = this.productForm.get('stockInicial');
    const codigoLoteControl = this.productForm.get('codigoLote');
    const fechaVencimientoControl = this.productForm.get('fechaVencimiento');
    const numeroSerieControl = this.productForm.get('numeroSerie');

    // Reset validations
    codigoLoteControl?.clearValidators();
    fechaVencimientoControl?.clearValidators();
    numeroSerieControl?.clearValidators();

    // Enable/Disable logic
    stockInicialControl?.enable();

    if (type === 'LOTE') {
      codigoLoteControl?.setValidators([Validators.required]);
      fechaVencimientoControl?.setValidators([Validators.required]);
      codigoLoteControl?.enable();
      fechaVencimientoControl?.enable();

      numeroSerieControl?.disable();
      numeroSerieControl?.setValue('');
    } else if (type === 'SERIE') {
      // numeroSerieControl?.setValidators([Validators.required]);
      numeroSerieControl?.enable();

      codigoLoteControl?.disable();
      codigoLoteControl?.setValue('');
      fechaVencimientoControl?.disable();
      fechaVencimientoControl?.setValue(null);
    } else {
      // ESTANDAR
      codigoLoteControl?.disable();
      codigoLoteControl?.setValue('');
      fechaVencimientoControl?.disable();
      fechaVencimientoControl?.setValue(null);
      numeroSerieControl?.disable();
      numeroSerieControl?.setValue('');
    }

    codigoLoteControl?.updateValueAndValidity();
    fechaVencimientoControl?.updateValueAndValidity();
    numeroSerieControl?.updateValueAndValidity();
  }

  onTipoTrazabilidadSelect(type: string) {
    this.productForm.patchValue({ tipoControlStock: type });
    this.updateTraceabilityState(type);
  }

  onTipoProductoChange(event: any) {
    this.updatePriceFieldsState(event.value, true);
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
      row =>
        row.ID_UNIDAD === value.unidadId &&
        row.FACTOR_CONVERSION_BASE === value.factor &&
        row.CODIGO_BARRAS === barcode
    );
    if (duplicate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Esta combinación de unidad, moneda y factor ya fue agregada'
      });
      this.formularioValido = false;
      return;
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
      unitName: unit.DESCRIPCION_SUNAT || (unit as any).name || 'N/A'
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

    this.confirmationService.confirm({
      message: '¿Desea eliminar esta presentación?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.removePresentation(index)
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
      this.markProductFormAsTouched(ignoreDraft);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor, complete todos los campos obligatorios marcados en rojo.'
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

    const unidadId = this.productForm.get('unidadMedidaId')?.value;
    if (unidadId) {
      const selectedUnit = this.unidadMedida().find(u => u.ID_UNIDAD_MEDIDA === unidadId);
      if (selectedUnit && !selectedUnit.ES_BASE) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Unidad Inválida',
          detail: 'La unidad de medida seleccionada debe ser una unidad base.'
        });
        return false;
      }
    }

    // ! VALIDACIONES CONDICIONALES (LOTE / SERIE)
    const stockInicial = this.productForm.get('stockInicial')?.value || 0;
    const trazabilidad = this.productForm.get('tipoTrazabilidad')?.value;

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

  // ! PRIVADO
  private loadDependencies() {
    this.loading.set(true);
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
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar dependencias' });
        this.loading.set(false);
      }
    });
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
    const { relation, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  private validarRelacionesDePrecios(): void {
    const precioCompra = this.productForm.get('precioCompra')?.value ?? 0;
    const precioMinimoVenta = this.productForm.get('precioMinimoVenta')?.value ?? 0;
    const precioVenta = this.productForm.get('precioVenta')?.value ?? 0;

    const precioCompraCtrl = this.productForm.get('precioCompra');
    const precioMinimoCtrl = this.productForm.get('precioMinimoVenta');
    const precioVentaCtrl = this.productForm.get('precioVenta');

    this.limpiarErroresRelacion(precioCompraCtrl);
    this.limpiarErroresRelacion(precioMinimoCtrl);
    this.limpiarErroresRelacion(precioVentaCtrl);

    if (precioVenta > 0 && precioMinimoVenta > 0) {
      if (precioVenta <= precioMinimoVenta && precioVentaCtrl) {
        const errors = precioVentaCtrl.errors || {};
        precioVentaCtrl.setErrors({ ...errors, relation: true });
      }
    }

    if (precioMinimoVenta > 0 && precioCompra > 0) {
      if (precioMinimoVenta <= precioCompra && precioMinimoCtrl) {
        const errors = precioMinimoCtrl.errors || {};
        precioMinimoCtrl.setErrors({ ...errors, relation: true });
      }
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
