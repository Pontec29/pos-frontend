import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Proveedor, ProveedorCrear } from '@proveedores/domain/proveedor.interface';
import { ProveedorService } from '@proveedores/services/proveedor.service';
import { ResponseUbigeoDto, ResponseTipoDocumentoDto } from '@shared/domains/general.dto';
import { GeneralService } from '@shared/services/general.service';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-form-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...PRIMENG_FORM_MODULES],
  templateUrl: './form-proveedor.html',
  styleUrl: './form-proveedor.scss',
})
export class FormProveedor {
  saveSuccess = output<{ mode: 'create' | 'update'; id?: number; request: ProveedorCrear }>();

  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly generalService = inject(GeneralService);
  private readonly proveedorService = inject(ProveedorService);

  isSubmitting = signal(false);
  isSearching = signal(false);
  ubigeoResults = signal<ResponseUbigeoDto[]>([]);
  tipoDocumentoOptions = signal<ResponseTipoDocumentoDto[]>([]);

  statusOptions = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  form: FormGroup<{
    id: FormControl<number | null>;
    code: FormControl<string>;
    name: FormControl<string>;
    ruc: FormControl<string>;
    contactName: FormControl<string>;
    contactLastName: FormControl<string>;
    phone: FormControl<string>;
    email: FormControl<string>;
    address: FormControl<string>;
    ubigeo: FormControl<ResponseUbigeoDto | null>;
    tipoDocumento: FormControl<ResponseTipoDocumentoDto | null>;
    status: FormControl<'Activo' | 'Inactivo'>;
  }> = this.fb.group({
    id: this.fb.control<number | null>(null),
    code: this.fb.control<string>('', { nonNullable: true }),
    name: this.fb.control<string>('', { nonNullable: true, validators: [requiredTrim()] }),
    ruc: this.fb.control<string>('', {
      nonNullable: true,
      validators: [requiredTrim(), documentoValidator()],
      updateOn: 'blur',
    }),
    contactName: this.fb.control<string>('', { nonNullable: true, validators: [requiredTrim()] }),
    contactLastName: this.fb.control<string>('', { nonNullable: true, validators: [requiredTrim()] }),
    phone: this.fb.control<string>('', {
      nonNullable: true,
      validators: [requiredTrim(), Validators.pattern(/^[0-9+() -]{6,20}$/)],
    }),
    email: this.fb.control<string>('', {
      nonNullable: true,
      validators: [requiredTrim(), Validators.email],
      updateOn: 'blur',
    }),
    address: this.fb.control<string>('', { nonNullable: true, validators: [requiredTrim()] }),
    ubigeo: this.fb.control<ResponseUbigeoDto | null>(null),
    tipoDocumento: this.fb.control<ResponseTipoDocumentoDto | null>(null, { validators: [Validators.required] }),
    status: this.fb.control<'Activo' | 'Inactivo'>('Activo', { nonNullable: true, validators: [Validators.required] }),
  });

  data = input<Proveedor | null>(null);

  constructor() {
    this.loadTipoDocumentos();
    effect(() => {
      const item = this.data();

      if (!item) {
        this.resetForm();
        return;
      }

      this.form.patchValue({
        id: item.ID_PROVEEDOR ?? null,
        code: item.CODIGO ?? '',
        name: item.RAZONSOCIAL ?? item.NOMBRE_PROVEEDOR ?? '',
        ruc: item.RUC ?? '',
        contactName: item.NOMBRES ?? '',
        contactLastName: item.APELLIDOS ?? '',
        phone: item.TELEFONO ?? '',
        email: item.EMAIL ?? '',
        address: item.DIRECCION ?? '',
        status: item.ACTIVO ? 'Activo' : 'Inactivo',
      });

      const ubigeoId = item.UBIGEO ?? '';
      if (ubigeoId) {
        this.loadUbigeoById(ubigeoId);
      } else {
        this.form.patchValue({ ubigeo: null });
      }

      this.form.markAsPristine();
    });
  }

  isEditMode(): boolean {
    return Boolean(this.data()?.ID_PROVEEDOR) || Boolean(this.form.controls.id.value);
  }

  hasPendingChanges(): boolean {
    return this.form.dirty && !this.isSubmitting();
  }

  loadTipoDocumentos() {
    this.generalService.getAllTiposDocumentos().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tipoDocumentoOptions.set(res.data);
          // Set RUC as default if exists (can be '6' or '06')
          const ruc = res.data.find((t) => t.codigoSunat === '6' || t.codigoSunat === '06');
          if (ruc) this.form.controls.tipoDocumento.setValue(ruc);
        }
      },
    });
  }

  searchUbigeo(event: any) {
    const searchTerm = event.query?.trim() || undefined;

    this.generalService.getAllUbigeos(searchTerm).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const dataWithFullLabel = res.data.map(u => ({
            ...u,
            fullName: `${u.departamento} - ${u.provincia} - ${u.distrito}`
          }));
          this.ubigeoResults.set(dataWithFullLabel);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los ubigeos',
        });
      },
    });
  }

  searchEntity() {
    const docNumber = String(this.form.controls.ruc.value || '').trim();
    if (!docNumber) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Ingrese un RUC o DNI para buscar',
      });
      return;
    }

    const tipoDoc = docNumber.length === 8 ? '1' : '6';
    this.isSearching.set(true);
    this.generalService.buscarPorDniOruc(tipoDoc, docNumber).subscribe({
      next: (response: any) => {
        this.isSearching.set(false);
        if (response.success && response.data) {
          const data: any = response.data;
          if (tipoDoc === '1') {
            const fullName = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim();
            this.form.patchValue({
              name: fullName,
              contactName: data.nombres,
              contactLastName: `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
            });
          } else {
            this.form.patchValue({
              name: data.razonSocial,
              address: data.direccion,
            });
          }
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Datos encontrados', life: 2000 });
          return;
        }

        this.messageService.add({
          severity: 'info',
          summary: 'Sin resultados',
          detail: 'No se encontraron datos en RENIEC/SUNAT',
        });
      },
      error: () => {
        this.isSearching.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo consultar el servicio externo',
        });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Complete todos los campos obligatorios (marcados con *).',
      });
      return;
    }

    const fv = this.form.getRawValue();
    const request: ProveedorCrear = {
      NUMERO_DOCUMENTO: String(fv.ruc).trim(),
      NOMBRES: String(fv.contactName).trim(),
      APELLIDOS: String(fv.contactLastName).trim(),
      DIRECCION: String(fv.address).trim(),
      ID_UBIGEO: String(fv.ubigeo?.id ?? '').trim(),
      tipoDocCodigo: fv.tipoDocumento?.codigoSunat ?? '06',
      EMAIL: String(fv.email).trim(),
      TELEFONO_PRINCIPAL: String(fv.phone).trim(),
      TELEFONO_SECUNDARIO: '',
      RAZON_SOCIAL: String(fv.name).trim() || undefined,
      NOMBRE_COMERCIAL: String(fv.code).trim() || undefined,
    };

    const id = fv.id ?? this.data()?.ID_PROVEEDOR ?? null;
    const mode: 'create' | 'update' = id ? 'update' : 'create';

    this.isSubmitting.set(true);
    const request$ = mode === 'update' ? this.proveedorService.update(request, Number(id)) : this.proveedorService.create(request);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: mode === 'create' ? 'Proveedor creado correctamente' : 'Proveedor actualizado correctamente',
            life: 2500,
          });
          this.resetForm();
          this.saveSuccess.emit({ mode, id: id ? Number(id) : undefined, request });
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: res.message || (mode === 'create' ? 'No se pudo crear el proveedor' : 'No se pudo actualizar el proveedor'),
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || (mode === 'create' ? 'No se pudo crear el proveedor' : 'No se pudo actualizar el proveedor'),
        });
      },
    });
  }

  private resetForm() {
    this.form.reset({
      id: null,
      code: '',
      name: '',
      ruc: '',
      contactName: '',
      contactLastName: '',
      phone: '',
      email: '',
      address: '',
      ubigeo: null,
      tipoDocumento: this.tipoDocumentoOptions().find(t => t.codigoSunat === '06') || null,
      status: 'Activo',
    });
    this.form.markAsPristine();
  }

  private loadUbigeoById(ubigeoId: string) {
    this.generalService.getAllUbigeos(ubigeoId).subscribe({
      next: (res) => {
        const match = res.success && res.data ? res.data.find((u) => u.id === ubigeoId) || res.data[0] : null;
        if (match) {
          const matchWithFullLabel = {
            ...match,
            fullName: `${match.departamento} - ${match.provincia} - ${match.distrito}`
          };
          this.form.patchValue({ ubigeo: matchWithFullLabel });
          this.form.controls.ubigeo.markAsPristine();
        }
      },
      error: () => {
        this.form.patchValue({ ubigeo: null });
      },
    });
  }
}

function requiredTrim(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === null || value === undefined || value === '') return { required: true };
    return null;
  };
}

function documentoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    const value = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!value) return null;
    if (!/^\d+$/.test(value)) return { numeric: true };
    if (value.length !== 8 && value.length !== 11) return { documentoLength: true };
    return null;
  };
}

