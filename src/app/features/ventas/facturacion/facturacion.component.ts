import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Cliente } from '@clientes/models/cliente.model';
import { ClientesService } from '@clientes/services/clientes';
import { ProductoBusqueda, ProductoPresentacion } from '@core/models/producto.model';
import { ContextoOperativoService } from '@core/services/contexto-operativo.service';
import { CorrelativoService } from '@core/services/correlativo.service';
import { ProductoService } from '@core/services/producto.service';
import { GeneralService } from '@shared/services/general.service';
import { PRIMENG_FORM_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { VentaRequest } from '@ventas/models/venta.models';
import { VentasService } from '@ventas/services/ventas.service';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatLabelModule,
    DividerModule,
    CardModule,
    TagModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    FormsModule,
    AutoCompleteModule,
    TooltipModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
  ],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss',
})
export default class FacturacionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contexto = inject(ContextoOperativoService);
  private readonly productoService = inject(ProductoService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly ventasService = inject(VentasService);
  private readonly correlativoService = inject(CorrelativoService);
  private readonly generalService = inject(GeneralService);
  private readonly clientesService = inject(ClientesService);

  // Signals para estado
  guardando = signal(false);
  isViewMode = signal(false);
  mostrarModalCliente = signal(false);

  // Opciones para selects usando los modelos
  // Opciones para selects
  formaPagoOptions = signal<any[]>([]);
  tiposAfectacion: Array<{ label: string; value: string }> = [];

  // Monedas (constante local ya que el modelo no la exporta como enum)
  readonly monedas = [
    { label: 'Soles (S/)', value: 'PEN' },
    { label: 'Dólares ($)', value: 'USD' },
  ];

  // Datos de sesión
  session = toSignal(this.authService.getSession());

  // Listas para combos y búsquedas
  productosSugeridos: any[] = [];
  clientesSugeridos: Cliente[] = [];
  todosLosClientes: Cliente[] = [];
  // Display model for the cliente autocomplete (keeps the shown text separate from the stored cliente id)
  clienteDisplay: Cliente | null = null;

  // Tipo de comprobante seleccionado (ahora por ID numérico)
  tipoComprobanteSeleccionado = signal<number>(1); // 1 = FACTURA

  // Serie y correlativo
  serieCorrelativo = signal('Cargando...');
  actualSerie = signal('');
  actualNumero = signal('');

  readonly almacenNombre = computed(() => this.contexto.selectedAlmacen()?.nombre ?? 'Sin almacén');
  readonly sucursalNombre = computed(
    () => this.contexto.selectedSucursal()?.nombre ?? 'Sin sucursal',
  );

  private readonly activatedRoute = inject(ActivatedRoute);

  buscadorControl = new FormControl<string | ProductoBusqueda | null>(null);

  ventaForm: FormGroup = this.fb.group({
    fechaEmision: [new Date(), Validators.required],
    cliente: ['', Validators.required],
    moneda: [{ value: 1, disabled: true }, Validators.required], // 1 = PEN
    condicionPago: this.fb.group({
      condicion: ['CONTADO', Validators.required],
      formaPago: [null, Validators.required],
      refOperacion: [''],
    }),
    detalles: this.fb.array([]),
  });

  // señales derivadas de los controles del formulario
  paymentCondition = toSignal(this.ventaForm.get('condicionPago.condicion')!.valueChanges, {
    initialValue: 'CONTADO' as const,
  });
  paymentMethod = toSignal(this.ventaForm.get('condicionPago.formaPago')!.valueChanges, {
    initialValue: null,
  });
  refOperacionSignal = toSignal(this.ventaForm.get('condicionPago.refOperacion')!.valueChanges, {
    initialValue: '',
  });
  monedaSignal = toSignal(this.ventaForm.get('moneda')!.valueChanges, { initialValue: 1 });
  // señal que refleja los cambios del FormArray 'detalles' (para usar en computed)
  detallesSignal = toSignal(this.ventaForm.get('detalles')!.valueChanges, {
    initialValue: this.ventaForm.get('detalles')!.value,
  });

  // computed que agrupa el cálculo de totales a partir de los detalles
  readonly totalesComputed = computed(() => {
    const detalles = this.detallesSignal() ?? [];
    const detallesNormalizados = (detalles as any[]).map((d) => ({
      cantidad: d.cantidad || 0,
      precioUnitario: d.precioUnitario || 0,
      afectacion: d.afectacion ?? '10',
    }));
    return this._calcularTotales(detallesNormalizados);
  });

  readonly subtotalGeneral = computed(() => this.totalesComputed().subtotal);
  readonly igvGeneral = computed(() => this.totalesComputed().igv);
  readonly totalGeneral = computed(() => this.totalesComputed().total);

  readonly headerVendedor = computed(() => {
    const sess = this.session();
    if (!sess) return 'P.V : 00000000000 - CARGANDO...';
    return `P.V : ${sess.tenantId} - ${sess.companyName.toUpperCase()}`;
  });

  get detallesFormArray() {
    return this.ventaForm.get('detalles') as FormArray;
  }

  constructor() {
    effect(() => {
      const sucursalId = this.contexto.sucursalId();
      const almacenId = this.contexto.almacenId();
      // recargar correlativo cuando cambie sucursal/almacen o tipo seleccionado
      this.cargarCorrelativo(almacenId ?? undefined, sucursalId ?? undefined);
    });
  }

  ngOnInit() {
    this.cargarCorrelativo();
    this.cargarMetodosPago();

    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.isViewMode.set(true);
      this.loadVenta(Number(id));
    }

    // Cargar tipos de afectación desde el servicio general
    this.generalService.getAllAfectacionesIgv().subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.tiposAfectacion = data.map((d) => ({
          label: `${d.id} - ${d.descripcion}`,
          value: d.id,
        }));
        const pred = data.find((d) => d.esPredeterminado) ?? data.find((d) => d.id === '10');
        const defaultVal = pred ? pred.id : (this.tiposAfectacion[0]?.value ?? '10');
        this.itemAfectacion.setValue(defaultVal);
      },
      error: () => {
        // fallback static options
        this.tiposAfectacion = [
          { label: '10 - Gravado', value: '10' },
          { label: '20 - Exonerado', value: '20' },
          { label: '30 - Inafecto', value: '30' },
        ];
        this.itemAfectacion.setValue('10');
      },
    });
  }

  cargarMetodosPago() {
    this.generalService.getAllMetodosPago().subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.formaPagoOptions.set(
          data.map((m) => ({
            label: m.tipo,
            value: m.id,
          })),
        );

        // Establecer un valor por defecto si hay opciones
        if (data.length > 0) {
          this.ventaForm.get('condicionPago.formaPago')?.setValue(data[0].id);
        }
      },
      error: (err) => {
        console.error('Error cargando métodos de pago', err);
      },
    });
  }

  loadVenta(id: number) {
    this.ventasService.getVentaById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const venta = res.data;
          this.tipoComprobanteSeleccionado.set(venta.tipoComprobanteId);
          this.actualSerie.set(venta.serie);
          this.actualNumero.set(venta.numero);
          this.serieCorrelativo.set(`${venta.serie}-${venta.numero}`);

          // Cargar cliente
          const clienteObj: any = {
            id: venta.clienteId as number,
            razonSocial: venta.clienteNombre || 'CLIENTE VARIOS',
            numeroDocumento: venta.clienteNumeroDocumento || '00000000',
            tipoDocumento: '',
            direccionFiscal: '',
            correoElectronico: '',
            telefono: '',
            esCliente: true,
            esProveedor: false,
            estado: true
          };
          this.clienteDisplay = clienteObj;

          this.ventaForm.patchValue({
            fechaEmision: new Date(venta.fEmision),
            cliente: clienteObj,
            moneda: venta.monedaId,
            condicionPago: {
              condicion: venta.formaPago,
              formaPago: venta.metodoPagoId,
              refOperacion: ''
            }
          });

          // Cargar detalles
          this.detallesFormArray.clear();
          venta.detalles.forEach(d => {
            const filaGroup = this.fb.group({
              productoId: [d.productoId],
              productoNombre: [d.productoNombre],
              productoCodigo: [d.productoCodigo],
              cantidad: [d.cantidad],
              precioUnitario: [d.precioUnitario],
              subtotal: [d.subtotal],
              afectacion: [d.tipoAfectacionId]
            });
            this.detallesFormArray.push(filaGroup);
          });

          if (this.isViewMode()) {
            this.ventaForm.disable();
          }
        }
      }
    });
  }

  cargarCorrelativo(almacenId?: number | null, sucursalId?: number | null) {
    const id = this.tipoComprobanteSeleccionado();
    const tipoDocumento = this.tipoComprobanteToCodigo(id);
    const alm = almacenId ?? this.contexto.almacenId();
    const suc = sucursalId ?? this.contexto.sucursalId();

    this.correlativoService
      .previsualizarSiguiente('VENTAS', tipoDocumento, alm ?? undefined, suc ?? undefined)
      .subscribe({
        next: (preview) => {
          if (preview) {
            this.serieCorrelativo.set(preview.documentoFormateado);
            this.actualSerie.set(preview.serie);
            this.actualNumero.set(preview.numeroSiguiente);
          }
        },
        error: (error) => {
          console.error('Error al cargar correlativo:', error);
        },
      });
  }

  onTipoComprobanteChange(id: number) {
    this.tipoComprobanteSeleccionado.set(id);
    this.cargarCorrelativo();
  }

  private tipoComprobanteToCodigo(id: number): string {
    switch (id) {
      case 1:
        return '01'; // FACTURA
      case 2:
        return '03'; // BOLETA
      case 3:
        return '07'; // NC
      case 4:
        return '08'; // ND
      default:
        return '01';
    }
  }

  /** Helper local para calcular totales (reemplaza al método del servicio eliminado). */
  private _calcularTotales(
    detalles: { cantidad: number; precioUnitario: number; afectacion: string }[],
  ) {
    let opGravada = 0;
    let opExonerada = 0;
    let opInafecta = 0;

    for (const d of detalles) {
      const subtotal = d.cantidad * d.precioUnitario;
      switch (d.afectacion) {
        case '10':
          opGravada += subtotal / 1.18;
          break;
        case '20':
          opExonerada += subtotal;
          break;
        case '30':
          opInafecta += subtotal;
          break;
        default:
          opGravada += subtotal / 1.18;
          break;
      }
    }

    const igv = opGravada * 0.18;
    const total = opGravada + igv + opExonerada + opInafecta;
    return { subtotal: opGravada, igv, total, opGravada, opExonerada, opInafecta };
  }

  buscarClientes(event: { query: string }) {
    const q = (event.query || '').toString();
    if (!q) {
      this.clientesSugeridos = [];
      return;
    }

    // usar el servicio general para buscar contactos (tipo 'c' = cliente)
    this.generalService.buscarContactos(q, 'c').subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.clientesSugeridos = data.map(
          (d) =>
            ({
              id: d.id,
              tipoDocumento: d.tipoDocumento,
              numeroDocumento: d.numeroDocumento,
              razonSocial: d.razonSocial,
              direccionFiscal: d.direccionFiscal ?? '',
              correoElectronico: d.correoElectronico ?? '',
              telefono: d.telefono ?? '',
              esCliente: d.esCliente ?? true,
              esProveedor: d.esProveedor ?? false,
              estado: (d.estado || '').toUpperCase() === 'ACTIVO',
            }) as Cliente,
        );
      },
      error: (err) => {
        console.error('Error buscando contactos:', err);
        this.clientesSugeridos = [];
      },
    });
  }

  onClienteSeleccionado(event: any) {
    const selected = event && event.value ? event.value : event;
    if (!selected) return;
    this.clienteDisplay = selected;
  }

  onClienteClear() {
    this.ventaForm.get('cliente')?.setValue('');
    this.clienteDisplay = null;
  }

  // Controles temporales para ítem a agregar
  selectedProducto: any | null = null;
  itemCantidad = new FormControl(1, [Validators.required, Validators.min(0.0001)]);
  itemUnidad = new FormControl<number | null>(null, Validators.required);
  itemUnidadOptions: Array<{ label: string; value: any }> = [];
  // Default to '10' until API provides options
  itemAfectacion = new FormControl('10', Validators.required);

  buscarProductos(event: { query: string }) {
    this.productoService.buscarProductos(event.query).subscribe((res) => {
      // Adaptamos la respuesta del servicio de productos
      this.productosSugeridos = (res.data ?? []).map((p) => {
        const unidadPrincipal = p.presentaciones.find((u) => u.esPrincipal) || p.presentaciones[0];
        return {
          ...p,
          stock: 10, // Mock stock if not present
          precio: unidadPrincipal?.precioVenta ?? 0,
        };
      });
    });
  }

  onProductoSeleccionado(event: { value: any }) {
    if (!event.value) return;
    // no agregamos de inmediato; guardamos la selección para que el usuario indique cantidad/afectacion
    this.selectedProducto = event.value;
    // inicializamos controles con valores por defecto
    this.itemCantidad.setValue(1);
    this.itemAfectacion.setValue(this.tiposAfectacion[0]?.value ?? '10');
    // set default unidad if presentaciones available
    const unidades: ProductoPresentacion[] = this.selectedProducto.presentaciones ?? [];
    // preparar opciones para el select de unidad
    this.itemUnidadOptions = unidades.map((u) => ({ label: u.unidadNombre, value: u.id }));
    const unidadDefault = unidades.find((u) => u.esPrincipal) ?? unidades[0];
    this.itemUnidad.setValue(unidadDefault ? unidadDefault.id : null);
  }

  onBuscadorClear() {
    this.selectedProducto = null;
    this.itemUnidadOptions = [];
  }

  agregarDetalle() {
    if (!this.selectedProducto) return;
    if (this.itemCantidad.invalid || this.itemAfectacion.invalid || this.itemUnidad.invalid) return;

    const p = this.selectedProducto;
    const unidades: ProductoPresentacion[] = p.presentaciones ?? [];
    const unidadSeleccionada =
      unidades.find((u) => u.id === this.itemUnidad.value) ??
      unidades.find((u) => u.esPrincipal) ??
      unidades[0];
    const precioDefault = unidadSeleccionada?.precioVenta ?? 0;
    const cantidad = this.itemCantidad.value ?? 0;

    const filaGroup = this.fb.group({
      productoId: [p.id, Validators.required],
      productoNombre: [p.nombre],
      // opcionales para mostrar código si existe
      productoCodigo: [p.codigo ?? ''],
      unidadesList: [unidades],
      unidadSeleccionada: [unidadSeleccionada],
      cantidad: [cantidad, [Validators.required, Validators.min(0.0001)]],
      precioUnitario: [precioDefault, [Validators.required, Validators.min(0)]],
      subtotal: [cantidad * precioDefault],
      afectacion: [this.itemAfectacion.value ?? '', Validators.required],
    });

    this.detallesFormArray.push(filaGroup);
    this.selectedProducto = null;
    this.buscadorControl.setValue(null);
    this.itemCantidad.setValue(1);
    this.itemAfectacion.setValue(this.tiposAfectacion[0]?.value ?? '10');
    this.itemUnidadOptions = [];
  }

  eliminarFila(index: number) {
    this.detallesFormArray.removeAt(index);
  }

  recalcularFila(index: number) {
    const row = this.detallesFormArray.at(index);
    const cantidad = row.get('cantidad')?.value || 0;
    const precioUnitario = row.get('precioUnitario')?.value || 0;

    row.patchValue(
      {
        subtotal: cantidad * precioUnitario,
      },
      { emitEvent: true },
    );
  }

  guardar() {
    if (this.ventaForm.invalid || this.detallesFormArray.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos y agregue productos.',
      });
      this.ventaForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);

    const cliente = this.ventaForm.get('cliente')?.value as Cliente | null;

    // Preparar datos de la venta (campos mínimos requeridos por el backend)
    const totales = this._calcularTotales(
      this.detallesFormArray.value.map((d: any) => ({
        cantidad: d.cantidad || 0,
        precioUnitario: d.precioUnitario || 0,
        afectacion: d.afectacion ?? '10',
      })),
    );
    const ventaData: VentaRequest = {
      sucursalId: this.contexto.sucursalId() ?? 0,
      almacenId: this.contexto.almacenId() ?? 0,
      tipoComprobanteId: this.tipoComprobanteSeleccionado(),
      comprobanteCodigoSunat: this.tipoComprobanteToCodigo(this.tipoComprobanteSeleccionado()),
      serie: this.actualSerie(),
      numero: this.actualNumero(),
      clienteId: cliente?.id,
      clienteTipoDocumentoId: undefined, //! Se podría obtener si el objeto trae el ID del tipo
      clienteNumeroDocumento: cliente?.numeroDocumento,
      clienteNombre: cliente?.razonSocial,
      monedaId: this.ventaForm.get('moneda')?.value ?? 1,
      moneda: this.ventaForm.get('moneda')?.value === 2 ? 'USD' : 'PEN',
      tipoCambio: 1, //! revisar
      subtotal: totales.subtotal,
      totalGravado: totales.opGravada,
      totalInafecto: totales.opInafecta,
      totalExonerado: totales.opExonerada,
      igvPorcentaje: 18,
      igvMonto: totales.igv,
      total: totales.total,
      totalNeto: totales.total,
      metodoPagoId: this.ventaForm.get('condicionPago.formaPago')?.value ?? 1,
      formaPago: (this.ventaForm.get('condicionPago.condicion')?.value as any) ?? 'CONTADO',
      idUsuarioVendedor: this.session()?.tenantId ? Number(this.session()!.tenantId) : 1, //! debe ser del tokenb
      detalles: this.detallesFormArray.value.map((detalle: any) => ({
        productoId: detalle.productoId,
        productoCodigo: detalle.codigoInterno ?? undefined,
        productoNombre: detalle.productoNombre,
        cantidad: detalle.cantidad,
        unidadMedidaId: detalle.unidadSeleccionada.unidadId, //! revisar ene l buscador y eliminar id causa cnfusion
        tipoAfectacionId: detalle.afectacion,
        precioUnitario: detalle.precioUnitario,
        precioUnitarioTotal: detalle.precioUnitario,
        costoUnitario: 0,
        costoUnitarioTotal: 0,
        subtotal: detalle.subtotal,
        igvMonto: 0, //! revisar
        total: detalle.subtotal,
      })),
    };

    // Crear la venta
    this.ventasService.crearVenta(ventaData).subscribe({
      next: (response) => {
        this.guardando.set(false);
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Venta Guardada',
            detail: 'La venta se ha registrado exitosamente.',
          });
          this.router.navigate(['/ventas/listar-ventas']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Error al guardar la venta',
          });
        }
      },
      error: (error) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al comunicarse con el servidor',
        });
        console.error('Error al guardar venta:', error);
      },
    });
  }

  volver() {
    this.router.navigate(['/ventas/listar-ventas']);
  }

  limpiarFormulario() {
    this.ventaForm.reset({
      cliente: '',
      fechaEmision: new Date(),
      moneda: 1, // PEN
      condicionPago: {
        condicion: 'CONTADO',
        formaPago: 'EFECTIVO',
        refOperacion: '',
      },
    });
    this.detallesFormArray.clear();
    this.selectedProducto = null;
    this.itemCantidad.setValue(1);
    this.itemAfectacion.setValue(this.tiposAfectacion[0]?.value ?? '10');
    this.buscadorControl.setValue(null);
  }

  // Método para imprimir
  imprimir(formato: string = 'A4') {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.ventasService.abrirPdfEnNuevaPestana(Number(id), formato);
    }
  }

  // Método para emitir comprobante
  emitirComprobante() {
    // TODO: Implementar lógica de emisión
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad en desarrollo',
      detail: 'La emisión de comprobantes estará disponible próximamente.',
    });
  }

  // Validadores personalizados
  validarCliente(): boolean {
    const clienteControl = this.ventaForm.get('cliente');
    return clienteControl ? clienteControl.valid && clienteControl.value : false;
  }

  validarDetalles(): boolean {
    return this.detallesFormArray.length > 0 && this.detallesFormArray.valid;
  }

  // Método para obtener los errores del formulario
  obtenerErrores(): string[] {
    const errores: string[] = [];

    if (!this.validarCliente()) {
      errores.push('Debe seleccionar un cliente');
    }

    if (!this.validarDetalles()) {
      errores.push('Debe agregar al menos un producto');
    }

    if (this.ventaForm.get('condicionPago.formaPago')?.invalid) {
      errores.push('Debe seleccionar una forma de pago');
    }

    return errores;
  }

  abrirModalCliente() {
    this.mostrarModalCliente.set(true);
  }

  onSaveCliente(dto: any) {
    this.guardando.set(true);
    this.clientesService.create(dto).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success && res.data) {
          const newCliente = res.data;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cliente creado correctamente',
          });

          // Seleccionar el nuevo cliente en el formulario
          this.ventaForm.get('cliente')?.setValue(newCliente);
          this.clienteDisplay = newCliente;

          this.mostrarModalCliente.set(false);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el cliente',
        });
        console.error(err);
      },
    });
  }

  onCancelCliente() {
    this.mostrarModalCliente.set(false);
  }
}
