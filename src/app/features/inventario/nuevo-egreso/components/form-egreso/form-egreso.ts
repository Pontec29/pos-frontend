import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormControl, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AlertService } from '@shared/services/alert.service';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

import { ContextoOperativoService } from '../../../../../core/services/contexto-operativo.service';
import { CorrelativoService, CorrelativoPreview } from '../../../../../core/services/correlativo.service';
import { ProductoService } from '../../../../../core/services/producto.service';
import { ProductoBusqueda, ProductoPresentacion } from '../../../../../core/models/producto.model';
import { NuevoEgresoService } from '../../services/nuevo-egreso.service';
import { CodigoSunatSalida, MovimientoSalidaPayload, MovimientoResponse, DetalleMovimientoResponse } from '../../modelo/nuevo-egreso.model';

@Component({
    selector: 'app-form-egreso',
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
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FORM_MODULES
    ],
    providers: [MessageService],
    templateUrl: './form-egreso.html',
    styleUrl: './form-egreso.scss'
})
export default class FormEgreso implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly contexto = inject(ContextoOperativoService);
    private readonly correlativoService = inject(CorrelativoService);
    private readonly productoService = inject(ProductoService);
    private readonly egresoService = inject(NuevoEgresoService);
    private readonly alertService = inject(AlertService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    // Estado
    readonly isViewMode = signal(false);
    readonly cargandoDatos = signal(false);
    readonly estadoMovimiento = signal<string>('');
    readonly motivoAnulacion = signal<string | null>(null);
    readonly correlativoPreview = signal<CorrelativoPreview | null>(null);
    readonly soloBorrador = signal(false);
    guardando = signal(false);
    totalGeneral = signal(0);
    productosSugeridos: ProductoBusqueda[] = [];

    readonly codigosSunatSalida: CodigoSunatSalida[] = [
        { codigo: '10', nombre: '[10] Venta Nacional' },
        { codigo: '13', nombre: '[13] Merma / Producto Vencido' },
        { codigo: '20', nombre: '[20] Devolución Efectuada' },
        { codigo: '99', nombre: '[99] Otros' }
    ];

    readonly almacenNombre = computed(() => this.contexto.selectedAlmacen()?.nombre ?? 'Sin almacén');
    readonly sucursalNombre = computed(() => this.contexto.selectedSucursal()?.nombre ?? 'Sin sucursal');

    // Formularios
    buscadorControl = new FormControl<string | ProductoBusqueda | null>(null);

    formulario = this.fb.group({
        fechaEmision: [new Date(), Validators.required],
        codigoOperacionSunat: ['13', Validators.required],
        documentoReferencia: [''],
        observacion: [''],
        detalles: this.fb.array([])
    });

    get detallesFormArray() {
        return this.formulario.get('detalles') as FormArray;
    }

    constructor() {
        effect(() => {
            const almacenId = this.contexto.almacenId();
            if (almacenId) {
                this.cargarCorrelativo(almacenId);
            }
        });
    }

    ngOnInit() {
        this.detallesFormArray.valueChanges.subscribe(() => {
            this.actualizarTotalGeneral();
        });

        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isViewMode.set(true);
            this.cargarMovimiento(Number(id));
        }
    }

    private cargarMovimiento(id: number) {
        this.cargandoDatos.set(true);
        this.egresoService.getById(id).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const m = res.data as MovimientoResponse;
                    this.formulario.patchValue({
                        fechaEmision: new Date(m.fechaEmision + 'T00:00:00'),
                        codigoOperacionSunat: m.codigoOperacionSunat,
                        documentoReferencia: m.documentoReferencia,
                        observacion: m.observacion
                    });

                    this.estadoMovimiento.set(m.estado);
                    this.motivoAnulacion.set(m.motivoAnulacion);

                    // Cargar detalles
                    this.detallesFormArray.clear();
                    m.detalles.forEach((d: DetalleMovimientoResponse) => {
                        const filaGroup = this.fb.group({
                            productoId: [d.productoId],
                            productoNombre: [d.productoNombre],
                            unidadesList: [[]],
                            unidadSeleccionada: [{ unidadNombre: d.unidadAbreviatura }],
                            cantidad: [d.cantidad],
                            cantidadBase: [d.cantidadBase],
                            tipoControlStock: [d.tipoControlStock],
                            loteId: [d.loteId],
                            codigoLote: [d.codigoLote],
                            stockDisponible: [0],
                            costoPromedio: [d.costoUnitario]
                        });
                        this.detallesFormArray.push(filaGroup);
                    });

                    if (this.isViewMode()) {
                        this.formulario.disable();
                        this.buscadorControl.disable();
                    }
                }
                this.cargandoDatos.set(false);
            },
            error: () => {
                this.alertService.error('No se pudo cargar el movimiento');
                this.cargandoDatos.set(false);
            }
        });
    }

    private cargarCorrelativo(almacenId: number) {
        this.correlativoService
            .previsualizarSiguiente('INVENTARIO', 'NS', almacenId)
            .subscribe({
                next: (preview) => this.correlativoPreview.set(preview),
                error: () => this.correlativoPreview.set(null)
            });
    }

    buscarProductos(event: { query: string }) {
        this.productoService.buscarProductos(event.query).subscribe(res => {
            this.productosSugeridos = res.data ?? [];
        });
    }

    onProductoSeleccionado(event: { value: ProductoBusqueda | string }) {
        if (typeof event.value === 'string' || !event.value) return;

        const p = event.value as ProductoBusqueda;
        const unidades: ProductoPresentacion[] = p.presentaciones ?? [];
        const unidadDefault = unidades.find(u => u.esPrincipal) ?? unidades[0];
        const factorDefault = unidadDefault?.factorConversionBase ?? 1;

        const filaGroup = this.fb.group({
            productoId: [p.id, Validators.required],
            productoNombre: [p.nombre],
            unidadesList: [unidades],
            unidadSeleccionada: [unidadDefault],
            cantidad: [1, [Validators.required, Validators.min(0.0001)]],
            cantidadBase: [1 * factorDefault],
            tipoControlStock: [p.tipoControlStock],
            loteId: [null as number | null],
            stockDisponible: [0],
            costoPromedio: [p.precioCompra ?? 0]
        });

        this.detallesFormArray.push(filaGroup);
        const index = this.detallesFormArray.length - 1;

        // Cargar stock disponible
        const almacenId = this.contexto.almacenId();
        if (almacenId) {
            this.productoService.getStock(p.id, almacenId).subscribe(res => {
                if (res.success) {
                    this.detallesFormArray.at(index).patchValue({ stockDisponible: res.data });
                }
            });
        }

        this.buscadorControl.setValue(null);
    }

    eliminarFila(index: number) {
        this.detallesFormArray.removeAt(index);
    }

    recalcularFila(index: number) {
        const row = this.detallesFormArray.at(index);
        const cantidad = row.get('cantidad')?.value || 0;
        const unidadSeleccionada = row.get('unidadSeleccionada')?.value;
        const factor = unidadSeleccionada?.factorConversionBase || 1;

        row.patchValue({
            cantidadBase: cantidad * factor
        }, { emitEvent: true });
    }

    private actualizarTotalGeneral() {
        let total = 0;
        this.detallesFormArray.controls.forEach(ctrl => {
            const cantidad = ctrl.get('cantidad')?.value || 0;
            const costo = ctrl.get('costoPromedio')?.value || 0;
            total += cantidad * costo;
        });
        this.totalGeneral.set(total);
    }

    private formatearFecha(date: Date | string): string {
        return (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
    }

    confirmarSalida() {
        const almacenId = this.contexto.almacenId();
        if (!almacenId) return;

        if (this.formulario.invalid || this.detallesFormArray.length === 0) {
            this.alertService.warn('Complete los campos obligatorios y agregue al menos un producto.');
            this.formulario.markAllAsTouched();
            return;
        }

        // Validación de Stock Negativo
        const itemsSinStock = this.detallesFormArray.controls.filter(ctrl => {
            const cantBase = ctrl.get('cantidadBase')?.value || 0;
            const stockDisp = ctrl.get('stockDisponible')?.value || 0;
            return cantBase > stockDisp;
        });

        if (itemsSinStock.length > 0) {
            this.alertService.error('Hay productos cuya cantidad a retirar supera el stock disponible.', 'Stock Insuficiente');
            return;
        }

        this.guardando.set(true);
        const formData = this.formulario.getRawValue();

        const payload: MovimientoSalidaPayload = {
            tipoMovimiento: 'SALIDA',
            almacenOrigenId: this.contexto.almacenId()!,
            codigoOperacionSunat: formData.codigoOperacionSunat as string,
            documentoReferencia: formData.documentoReferencia as string,
            fechaEmision: this.formatearFecha(formData.fechaEmision as Date),
            observacion: formData.observacion as string,
            detalles: formData.detalles.map((d: any) => ({
                productoId: d.productoId,
                unidadId: d.unidadSeleccionada?.unidadId,
                loteId: d.loteId ?? undefined,
                cantidad: d.cantidad,
                factorConversion: d.unidadSeleccionada?.factorConversionBase || 1,
                costoUnitario: d.costoPromedio
            }))
        };

        const request$ = this.soloBorrador() 
            ? this.egresoService.registrarSalida(payload)
            : this.egresoService.registrarSalidaDirecta(payload);

        request$.subscribe({
            next: (res) => {
                this.guardando.set(false);
                if (res.success) {
                    this.alertService.success(`Salida ${res.data?.serie}-${res.data?.numero} registrada ${this.soloBorrador() ? 'como borrador' : 'y procesada'}.`);
                    this.router.navigate(['/inventario/nuevo-egreso']);
                } else {
                    this.alertService.error(res.message);
                }
            },
            error: (err) => {
                this.guardando.set(false);
                this.alertService.error(err.error?.message || 'Fallo al registrar salida.');
            }
        });
    }

    limpiar() {
        this.formulario.reset({
            fechaEmision: new Date(),
            codigoOperacionSunat: '13',
            documentoReferencia: '',
            observacion: ''
        });
        this.detallesFormArray.clear();
        this.buscadorControl.setValue(null);

        const almacenId = this.contexto.almacenId();
        if (almacenId) this.cargarCorrelativo(almacenId);
    }

    volver() {
        this.router.navigate(['/inventario/nuevo-egreso']);
    }
}
