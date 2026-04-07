import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { TagModule } from 'primeng/tag';
import { NuevoEgresoService } from './services/nuevo-egreso.service';
import { MovimientoResumen } from './modelo/nuevo-egreso.model';
import { ContextoOperativoService } from '../../../core/services/contexto-operativo.service';
import { AppButton } from "@shared/ui/button";

@Component({
    selector: 'app-nuevo-egreso',
    standalone: true,
    imports: [
        CommonModule,
        TagModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FORM_MODULES,
        AppButton
    ],
    providers: [MessageService],
    templateUrl: './nuevo-egreso.html',
    styleUrl: './nuevo-egreso.scss'
})
export default class NuevoEgreso implements OnInit {

    private readonly router = inject(Router);
    private readonly egresoService = inject(NuevoEgresoService);
    private readonly contexto = inject(ContextoOperativoService);

    readonly salidas = signal<MovimientoResumen[]>([]);
    readonly cargando = signal(false);

    ngOnInit() {
        this.cargarSalidas();
    }

    cargarSalidas() {
        this.cargando.set(true);
        this.egresoService.listarSalidas().subscribe({
            next: (res) => {
                this.salidas.set(res.data ?? []);
                this.cargando.set(false);
            },
            error: () => {
                this.salidas.set([]);
                this.cargando.set(false);
            }
        });
    }

    nuevaSalida() {
        this.router.navigate(['/inventario/nuevo-egreso/nuevo']);
    }

    getSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'PROCESADO': return 'success';
            case 'BORRADOR': return 'warn';
            case 'ANULADO': return 'danger';
            default: return 'info';
        }
    }
}
