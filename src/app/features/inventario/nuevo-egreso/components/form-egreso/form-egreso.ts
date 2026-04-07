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
import { NuevoEgresoService } from '../../services/nuevo-egreso.service';
import { CodigoSunatSalida, MovimientoSalidaPayload } from '../../modelo/nuevo-egreso.model';

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
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    // Estado
    readonly correlativoPreview = signal<CorrelativoPreview | null>(null);
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

    confirmarSalida() {
        const almacenId = this.contexto.almacenId();
        if (!almacenId) return;

        if (this.formulario.invalid || this.detallesFormArray.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Complete los campos obligatorios y agregue al menos un producto.'
            });
            this.formulario.markAllAsTouched();
            return;
        }

        this.guardando.set(true);
        const formData = this.formulario.getRawValue();

        const payload: MovimientoSalidaPayload = {
            tipoMovimiento: 'SALIDA',
            almacenOrigenId: almacenId,
            codigoOperacionSunat: formData.codigoOperacionSunat as string,
            documentoReferencia: formData.documentoReferencia as string,
            fechaEmision: (formData.fechaEmision as Date).toISOString().split('T')[0],
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

        this.egresoService.registrarSalida(payload).subscribe({
            next: (res) => {
                this.guardando.set(false);
                if (res.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `Salida ${res.data?.serie}-${res.data?.numero} registrada.`
                    });
                    this.router.navigate(['/inventario/notas-salida']);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
                }
            },
            error: () => {
                this.guardando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar salida.' });
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
        this.router.navigate(['/inventario/notas-salida']);
    }
}
