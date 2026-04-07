import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AppButton } from '@shared/ui/button';
import {
    InventarioValorizadoService,
    InventarioValorizadoResponse,
    ItemValorizado
} from './services/inventario-valorizado.service';

@Component({
    selector: 'app-resumen-stock',
    standalone: true,
    imports: [
        CommonModule,
        TagModule,
        TooltipModule,
        DecimalPipe,
        DatePipe,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FORM_MODULES,
        AppButton
    ],
    providers: [MessageService],
    templateUrl: './inventario-valorizado.html',
    styleUrl: './inventario-valorizado.scss'
})
export default class ResumenStock implements OnInit {

    private readonly valorizadoService = inject(InventarioValorizadoService);
    private readonly messageService = inject(MessageService);

    readonly data = signal<InventarioValorizadoResponse | null>(null);
    readonly cargando = signal(false);
    readonly searchTerm = signal('');

    readonly valorTotalFormateado = computed(() => {
        const d = this.data();
        return d ? d.valorTotal : 0;
    });

    readonly detallesFiltrados = computed(() => {
        const d = this.data();
        const term = this.searchTerm().toLowerCase();
        if (!d) return [];
        if (!term) return d.detalle;
        return d.detalle.filter(item =>
            item.productoNombre.toLowerCase().includes(term) ||
            item.productoSku?.toLowerCase().includes(term) ||
            item.almacenNombre.toLowerCase().includes(term) ||
            item.codigoLote?.toLowerCase().includes(term)
        );
    });

    ngOnInit() {
        this.cargarData();
    }

    cargarData() {
        this.cargando.set(true);
        this.valorizadoService.obtenerValorizado().subscribe({
            next: (res) => {
                this.data.set(res.data ?? null);
                this.cargando.set(false);
            },
            error: () => {
                this.data.set(null);
                this.cargando.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el resumen de stock'
                });
            }
        });
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value);
    }
}
