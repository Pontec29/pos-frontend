import { Component, inject, signal, input, output, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { UnidadMedidaListar } from '../../domain/unidad-medida.interface';
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { UnidadMedidaDTO } from '../../domain/unidad-medida.dto';

@Component({
  selector: 'app-form-unidad-medida',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ToggleSwitchModule,
    SelectModule
  ],
  templateUrl: './form-unidad-medida.html',
  styleUrl: './form-unidad-medida.scss'
})
export class FormUnidadMedidaComponent implements OnInit {
  private readonly unidadService = inject(UnidadMedidaService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Inputs & Outputs
  data = input<UnidadMedidaListar | null>(null);
  saveSuccess = output<void>();

  isSubmitting = signal(false);
  catalogoSunat = signal<any[]>([]);

  form = this.fb.group({
    id: [null as number | null], // Internal use for knowing edit vs create
    codigoSunat: ['', Validators.required],
    nombreComercial: ['', [Validators.required, Validators.maxLength(50)]],
    abreviatura: ['', [Validators.maxLength(10)]],
    esBase: [false]
  });

  constructor() {
    effect(() => {
      const selectedUnidad = this.data();
      if (selectedUnidad) {
        this.form.patchValue({
          id: selectedUnidad.ID_UNIDAD_MEDIDA,
          codigoSunat: selectedUnidad.CODIGO_SUNAT,
          nombreComercial: selectedUnidad.NOMBRE_COMERCIAL,
          abreviatura: selectedUnidad.Abreviatura,
          esBase: selectedUnidad.ES_BASE
        });
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit(): void {
    this.loadCatalogoSunat();
  }

  loadCatalogoSunat() {
    this.unidadService.getCatalogoSunat().subscribe({
      next: (res) => {
        if (res.success) {
          this.catalogoSunat.set(res.data);
        }
      },
      error: (err) => console.error('Error loading SUNAT catalogue:', err)
    });
  }

  isEditMode(): boolean {
    return Boolean(this.data()?.ID_UNIDAD_MEDIDA) || Boolean(this.form.controls.id.value);
  }

  hasPendingChanges(): boolean {
    return this.form.dirty && !this.isSubmitting();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    
    // Only send what Java expects: UnidadMedidaRequest
    const payload = {
      nombreComercial: value.nombreComercial,
      abreviatura: value.abreviatura,
      codigoSunat: value.codigoSunat,
      esBase: value.esBase
    };

    this.isSubmitting.set(true);
    const unitId = this.data()?.ID_UNIDAD_MEDIDA || this.form.controls.id.value;

    const request$ = unitId
      ? this.unidadService.update(unitId, payload as any)
      : this.unidadService.create(payload as any);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: response.message });
          this.saveSuccess.emit();
          this.resetForm();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
        }
      },
      error: (err: any) => {
        console.error('Error saving unidad-medida:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      }
    });
  }

  resetForm() {
    this.form.reset({
      id: null,
      codigoSunat: '',
      nombreComercial: '',
      abreviatura: '',
      esBase: false
    });
    this.form.markAsPristine();
  }
}
