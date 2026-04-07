import { Component, input, output, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { Almacen } from '../domain/almacen.type';
import { SucursalCoreService } from '@core/services/sucursal-core.service';
import type { SucursalOption } from '../../sucursales/models/sucursal.type';

@Component({
    selector: 'app-almacen-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ...PRIMENG_FORM_MODULES,
        AppButton
    ],
    templateUrl: './almacen-form-dialog.html',
    styleUrl: './almacen-form-dialog.scss'
})
export class AlmacenFormDialog implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly sucursalService = inject(SucursalCoreService);

    // Input signals
    visible = input<boolean>(false);
    almacen = input<Almacen | null>(null);

    // Outputs
    save = output<Record<string, unknown>>();
    cancel = output<void>();

    // Opciones de sucursales cargadas del API
    sucursalOptions = signal<{ label: string; value: number }[]>([]);

    almacenForm: FormGroup = this.fb.group({
        id: [null],
        sucursalId: [null, [Validators.required]],
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        codigoSunat: ['', [Validators.required, Validators.maxLength(10)]],
        esPrincipal: [false],
        permiteVenta: [true]
    });

    constructor() {
        // Effect: reacciona cuando cambia el almacén seleccionado
        effect(() => {
            const almacen = this.almacen();
            const isVisible = this.visible();

            if (almacen && isVisible) {
                this.almacenForm.patchValue({
                    id: almacen.id,
                    sucursalId: almacen.sucursalId,
                    nombre: almacen.nombre,
                    codigoSunat: almacen.codigoSunat,
                    esPrincipal: almacen.esPrincipal,
                    permiteVenta: almacen.permiteVenta
                });
            } else if (isVisible && !almacen) {
                this.almacenForm.reset({
                    sucursalId: null,
                    nombre: '',
                    codigoSunat: '',
                    esPrincipal: false,
                    permiteVenta: true
                });
            }
        });
    }

    ngOnInit() {
        this.loadSucursales();
    }

    /** Carga las sucursales activas para el select */
    private loadSucursales() {
        this.sucursalService.getActivas().subscribe({
            next: (res) => {
                if (res.success) {
                    this.sucursalOptions.set(
                        res.data.map((s: SucursalOption) => ({
                            label: s.nombre,
                            value: s.id
                        }))
                    );
                }
            },
            error: (err) => console.error('Error al cargar sucursales:', err)
        });
    }

    onSubmit() {
        if (this.almacenForm.valid) {
            this.save.emit(this.almacenForm.value);
        } else {
            Object.keys(this.almacenForm.controls).forEach(key => {
                this.almacenForm.get(key)?.markAsTouched();
            });
        }
    }

    onCancel() {
        this.cancel.emit();
        this.almacenForm.reset({
            sucursalId: null,
            nombre: '',
            codigoSunat: '',
            esPrincipal: false,
            permiteVenta: true
        });
    }
}
