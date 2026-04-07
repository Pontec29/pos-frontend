import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormControl, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
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
import { NuevoIngresoService } from '../../services/nuevo-ingreso.service';
import { CodigoSunat, MovimientoEntradaPayload } from '../../modelo/nuevo-ingreso.model';

@Component({
    selector: 'app-form-ingreso',
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
    templateUrl: './form-ingreso.html',
    styleUrl: './form-ingreso.scss'
})
export default class FormIngreso implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly contexto = inject(ContextoOperativoService);
    private readonly correlativoService = inject(CorrelativoService);
    private readonly productoService = inject(ProductoService);
    private readonly nuevoIngresoService = inject(NuevoIngresoService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    // Variables de estado
    readonly correlativoPreview = signal<CorrelativoPreview | null>(null);
    guardando = signal(false);
    totalGeneral = signal(0);
    productosSugeridos: ProductoBusqueda[] = [];

    readonly codigosSunat: CodigoSunat[] = [
        { codigo: '02', nombre: '[02] Compra Nacional' },
        { codigo: '05', nombre: '[05] Devolución Recibida' },
        { codigo: '16', nombre: '[16] Saldo Inicial' },
        { codigo: '19', nombre: '[19] Otros' }
    ];

    readonly almacenNombre = computed(() => this.contexto.selectedAlmacen()?.nombre ?? 'Sin almacén');
    readonly sucursalNombre = computed(() => this.contexto.selectedSucursal()?.nombre ?? 'Sin sucursal');

    // === Formularios Reactivos ===
    buscadorControl = new FormControl<string | ProductoBusqueda | null>(null);

    formulario = this.fb.group({
        fechaEmision: [new Date(), Validators.required],
        codigoOperacionSunat: ['02', Validators.required],
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
    }

    private cargarCorrelativo(almacenId: number) {
        this.correlativoService
            .previsualizarSiguiente('INVENTARIO', 'NI', almacenId)
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

        const exigeLote = p.tipoControlStock !== 'NORMAL';
        const defaultCosto = p.precioCompra ?? 0;
        const factorDefault = unidadDefault?.factorConversionBase ?? 1;

        const filaGroup = this.fb.group({
            productoId: [p.id, Validators.required],
            productoNombre: [p.nombre],
            unidadesList: [unidades],
            unidadSeleccionada: [unidadDefault],
            cantidad: [1, [Validators.required, Validators.min(0.0001)]],
            cantidadBase: [1 * factorDefault],
            exigeLote: [exigeLote],
            codigoLote: [''],
            fechaVencimiento: [null],
            costoUnitario: [defaultCosto, [Validators.required, Validators.min(0)]],
            subtotal: [1 * defaultCosto]
        });

        this.detallesFormArray.push(filaGroup);
        this.buscadorControl.setValue(null);
    }

    eliminarFila(index: number) {
        this.detallesFormArray.removeAt(index);
    }

    recalcularFila(index: number) {
        const row = this.detallesFormArray.at(index);
        const cantidad = row.get('cantidad')?.value || 0;
        const costoUnitario = row.get('costoUnitario')?.value || 0;
        const unidadSeleccionada = row.get('unidadSeleccionada')?.value;
        const factor = unidadSeleccionada?.factorConversionBase || 1;

        row.patchValue({
            cantidadBase: cantidad * factor,
            subtotal: cantidad * costoUnitario
        }, { emitEvent: true });
    }

    private actualizarTotalGeneral() {
        let total = 0;
        this.detallesFormArray.controls.forEach(ctrl => {
            total += (parseFloat(ctrl.get('subtotal')?.value) || 0);
        });
        this.totalGeneral.set(total);
    }

    guardar() {
        const almacenId = this.contexto.almacenId();
        if (!almacenId) return;

        if (this.formulario.invalid || this.detallesFormArray.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios y agregue al menos un producto.' });
            this.formulario.markAllAsTouched();
            return;
        }

        this.guardando.set(true);
        const formData = this.formulario.getRawValue();

        const payload: MovimientoEntradaPayload = {
            tipoMovimiento: 'ENTRADA',
            almacenDestinoId: almacenId,
            codigoOperacionSunat: formData.codigoOperacionSunat as string,
            documentoReferencia: formData.documentoReferencia as string,
            fechaEmision: (formData.fechaEmision as Date).toISOString().split('T')[0],
            observacion: formData.observacion as string,
            detalles: formData.detalles.map((d: any) => ({
                productoId: d.productoId,
                unidadId: d.unidadSeleccionada?.unidadId,
                cantidad: d.cantidad,
                factorConversion: d.unidadSeleccionada?.factorConversionBase || 1,
                costoUnitario: d.costoUnitario,
                codigoLote: d.codigoLote ? d.codigoLote : null,
                fechaVencimiento: d.fechaVencimiento ? (d.fechaVencimiento as Date).toISOString().split('T')[0] : null
            }))
        };

        this.nuevoIngresoService.registrarIngreso(payload).subscribe({
            next: (res) => {
                this.guardando.set(false);
                if (res.success) {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Ingreso ${res.data?.serie}-${res.data?.numero} OK.` });
                    this.router.navigate(['/inventario/nuevo-ingreso']);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
                }
            },
            error: () => {
                this.guardando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar.' });
            }
        });
    }

    limpiar() {
        this.formulario.reset({
            fechaEmision: new Date(),
            codigoOperacionSunat: '02',
            documentoReferencia: '',
            observacion: ''
        });
        this.detallesFormArray.clear();
        this.buscadorControl.setValue(null);

        const almacenId = this.contexto.almacenId();
        if (almacenId) this.cargarCorrelativo(almacenId);
    }

    volver() {
        this.router.navigate(['/inventario/nuevo-ingreso']);
    }
}
