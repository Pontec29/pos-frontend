import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AppButton } from '@shared/ui/button';
import { KardexAuditoriaService, KardexAuditoriaCompleta } from '../services/kardex-auditoria.service';
import { ProductoService } from '@core/services/producto.service';
import { ProductoBusqueda } from '@core/models/producto.model';
import { AlmacenService } from '../../../configuracion/almacenes/services/almacen.service';

@Component({
    selector: 'app-kardex-fisico',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DecimalPipe,
        DatePipe,
        TagModule,
        TooltipModule,
        SelectModule,
        DatePickerModule,
        AutoCompleteModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FORM_MODULES,
        AppButton
    ],
    providers: [MessageService],
    templateUrl: './kardex-fisico.html',
    styleUrl: './kardex-fisico.scss'
})
export default class KardexFisico implements OnInit {

    private readonly kardexService = inject(KardexAuditoriaService);
    private readonly almacenService = inject(AlmacenService);
    private readonly productoService = inject(ProductoService);
    private readonly messageService = inject(MessageService);

    readonly data = signal<KardexAuditoriaCompleta | null>(null);
    readonly cargando = signal(false);
    readonly almacenes = signal<Array<{ label: string; value: number }>>([]);
    readonly sugerenciasProducto = signal<ProductoBusqueda[]>([]);

    almacenSeleccionado: number | null = null;
    productoSeleccionado: ProductoBusqueda | null = null;
    rangoFechas: Date[] | null = null;

    ngOnInit() {
        this.cargarAlmacenes();
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.rangoFechas = [primerDia, hoy];
    }

    cargarAlmacenes() {
        this.almacenService.getAll().subscribe({
            next: (res) => {
                this.almacenes.set(
                    (res.data ?? []).map(a => ({ label: a.nombre, value: a.id }))
                );
            }
        });
    }

    buscarProducto(event: { query: string }) {
        this.productoService.buscarProductos(event.query).subscribe({
            next: (res) => this.sugerenciasProducto.set(res.data)
        });
    }

    filtrar() {
        if (!this.productoSeleccionado || !this.almacenSeleccionado || !this.rangoFechas || this.rangoFechas.length < 2) {
            this.messageService.add({
                severity: 'warn', summary: 'Filtros incompletos',
                detail: 'Selecciona producto, almacén y rango de fechas'
            });
            return;
        }

        this.cargando.set(true);
        this.kardexService.consultarKardex(
            this.productoSeleccionado.id,
            this.almacenSeleccionado,
            this.formatearFecha(this.rangoFechas[0]),
            this.formatearFecha(this.rangoFechas[1])
        ).subscribe({
            next: (res) => {
                this.data.set(res.data ?? null);
                this.cargando.set(false);
                if (res.data?.totalRegistros === 0) {
                    this.messageService.add({ severity: 'info', summary: 'Sin resultados', detail: 'No hay registros para los filtros seleccionados' });
                }
            },
            error: () => {
                this.data.set(null);
                this.cargando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar el Kardex' });
            }
        });
    }

    private formatearFecha(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
