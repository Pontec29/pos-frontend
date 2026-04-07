import { Component, input, output, inject, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { AppButton } from '@shared/ui/button';
import { ClienteFormDto, SelectOption } from '../models/cliente.model';
import { SunatService } from '@core/services/sunat.service';
import { MessageService } from 'primeng/api';
import { GeneralService } from '@shared/services/general.service';
import { ResponseUbigeoDto } from '@shared/domains/general.dto';

@Component({
    selector: 'app-cliente-form-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ...PRIMENG_FORM_MODULES,
        IconFieldModule,
        InputIconModule,
        AppButton
    ],
    templateUrl: './cliente-form-dialog.html',
    styleUrl: './cliente-form-dialog.scss'
})
export class ClienteFormDialog {

    private readonly fb = inject(FormBuilder);
    private readonly sunatService = inject(SunatService);
    private readonly messageService = inject(MessageService);
    private readonly generalService = inject(GeneralService);

    loading = signal(false);

    // --- Inputs ---
    visible = input<boolean>(false);
    cliente = input<Partial<ClienteFormDto> | null>(null);

    // --- Outputs ---
    save = output<ClienteFormDto>();
    cancel = output<void>();

    // --- Opciones para selects ---
    tipoDocumentoOptions = signal<SelectOption<string>[]>([
        { label: 'DNI', value: '1' },
        { label: 'RUC', value: '6' },
        { label: 'Carnet Extranjería', value: '4' },
        { label: 'Pasaporte', value: '7' }
    ]);

    generoOptions = signal<SelectOption<string>[]>([
        { label: 'Masculino', value: 'M' },
        { label: 'Femenino', value: 'F' }
    ]);

    // --- Estado: persona natural o jurídica ---
    isPersonaJuridica = signal(false);

    // --- Ubigeo ---
    ubigeoResults = signal<ResponseUbigeoDto[]>([]);

    // --- Formulario reactivo ---
    clienteForm: FormGroup = this.fb.group({
        id: [null],
        tipoDocCodigo: ['1', [Validators.required]],
        numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
        razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
        nombreComercial: ['', [Validators.maxLength(200)]],
        nombres: ['', [Validators.maxLength(100)]],
        apellidos: ['', [Validators.maxLength(100)]],
        direccionFiscal: ['', [Validators.maxLength(300)]],
        // almacena el objeto Ubigeo seleccionado (ResponseUbigeoDto)
        ubigeo: [null],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        telefonoPrincipal: ['', [Validators.maxLength(20)]],
        genero: [null]
    });

    constructor() {
        // Reacciona a cambios de visibilidad y cliente seleccionado
        effect(() => {
            const cliente = this.cliente();
            const isVisible = this.visible();

            if (isVisible && cliente) {
                this.clienteForm.patchValue(cliente as any);
                this.updatePersonaJuridica(cliente.tipoDocCodigo ?? '1');

                // Si el cliente trae un ubigeoId, intentar cargar el objeto para mostrarlo
                const ubigeoId = (cliente as any)?.ubigeoId;
                if (ubigeoId) {
                    this.generalService.getAllUbigeos(ubigeoId).subscribe({
                        next: (res) => {
                            if (res.success && res.data) {
                                const match = res.data.find(u => u.id === ubigeoId) || res.data[0];
                                this.clienteForm.patchValue({ ubigeo: match });
                            }
                        },
                        error: (err) => console.error('Error cargando ubigeo:', err)
                    });
                }

            } else if (isVisible && !cliente) {
                this.resetForm();
            }
        });

        // Reacciona a cambios del tipo de documento dentro del formulario
        this.clienteForm.get('tipoDocCodigo')?.valueChanges.subscribe(
            (value: string) => this.updatePersonaJuridica(value)
        );
    }

    // --- Métodos privados ---

    private updatePersonaJuridica(tipoDocId: string): void {
        this.isPersonaJuridica.set(tipoDocId === '6'); // 6 = RUC
    }

    private resetForm(): void {
        this.clienteForm.reset({
            tipoDocCodigo: '1',
            numeroDocumento: '',
            razonSocial: '',
            nombreComercial: '',
            nombres: '',
            apellidos: '',
            direccionFiscal: '',
            ubigeo: null,
            email: '',
            telefonoPrincipal: '',
            genero: null
        });
        this.isPersonaJuridica.set(false);
    }

    buscarDocumento(): void {
        const tipoDoc = this.clienteForm.get('tipoDocCodigo')?.value;
        const numDoc = this.clienteForm.get('numeroDocumento')?.value;

        if (!numDoc || numDoc.length < 8) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Alerta',
                detail: 'Ingrese un número de documento válido'
            });
            return;
        }

        this.loading.set(true);
        this.sunatService.consultarDocumento(tipoDoc.toString(), numDoc).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    const data = response.data;

                    if (tipoDoc === '1') { // DNI
                        this.clienteForm.patchValue({
                            nombres: data.nombres,
                            apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno}`,
                            razonSocial: data.nombreCompleto,
                            direccionFiscal: data.direccion,
                            ubigeo: data.ubigeo ? {
                                id: data.ubigeo,
                                departamento: data.departamento,
                                provincia: data.provincia,
                                distrito: data.distrito,
                                activo: true
                            } : this.clienteForm.get('ubigeo')?.value
                        });
                    } else if (tipoDoc === '6') { // RUC
                        this.clienteForm.patchValue({
                            razonSocial: data.razonSocial,
                            nombreComercial: data.nombreComercial,
                            direccionFiscal: data.direccion,
                            ubigeo: data.ubigeo ? {
                                id: data.ubigeo,
                                departamento: data.departamento,
                                provincia: data.provincia,
                                distrito: data.distrito,
                                activo: true
                            } : this.clienteForm.get('ubigeo')?.value
                        });
                    }

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Datos encontrados'
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No encontrado',
                        detail: 'No se encontraron datos para el documento ingresado'
                    });
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al consultar el servicio'
                });
                this.loading.set(false);
            }
        });
    }

    // --- Métodos públicos ---

    onSubmit(): void {
        if (this.clienteForm.valid) {
            const fv = this.clienteForm.value;
            const payload: ClienteFormDto = {
                id: fv.id,
                tipoDocCodigo: fv.tipoDocCodigo,
                numeroDocumento: fv.numeroDocumento,
                razonSocial: fv.razonSocial,
                nombreComercial: fv.nombreComercial,
                nombres: fv.nombres,
                apellidos: fv.apellidos,
                direccionFiscal: fv.direccionFiscal,
                ubigeoId: fv.ubigeo?.id || '',
                email: fv.email,
                telefonoPrincipal: fv.telefonoPrincipal,
                genero: fv.genero
            };

            this.save.emit(payload);
        } else {
            Object.keys(this.clienteForm.controls).forEach(key => {
                this.clienteForm.get(key)?.markAsTouched();
            });
        }
    }

    searchUbigeo(event: any) {
        const searchTerm = event.query?.trim() || undefined;

        this.generalService.getAllUbigeos(searchTerm).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.ubigeoResults.set(res.data);
                }
            },
            error: (err) => {
                console.error('Error al buscar ubigeos:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los ubigeos'
                });
            }
        });
    }

    onCancel(): void {
        this.cancel.emit();
        this.resetForm();
    }
}
