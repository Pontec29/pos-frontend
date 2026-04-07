import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { Cargo } from '../../domain/cargo.interface';
import { CargosService } from '../../services/cargos.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-form-cargo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ToggleSwitchModule
  ],
  templateUrl: './form-cargo.html',
  styleUrl: './form-cargo.scss'
})
export class FormCargoComponent {
  private readonly cargosService = inject(CargosService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Inputs & Outputs
  data = input<Cargo | null>(null);
  saveSuccess = output<void>();

  isSubmitting = signal(false);

  form = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

  constructor() {
    effect(() => {
      const selectedCargo = this.data();
      if (selectedCargo) {
        this.form.patchValue({
          id: selectedCargo.id,
          nombre: selectedCargo.nombre,
          descripcion: selectedCargo.descripcion,
          activo: selectedCargo.activo
        });
      } else {
        this.resetForm();
      }
    });
  }

  isEditMode(): boolean {
    return Boolean(this.data()?.id) || Boolean(this.form.controls.id.value);
  }

  hasPendingChanges(): boolean {
    return this.form.dirty && !this.isSubmitting();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value as Partial<Cargo>;
    this.isSubmitting.set(true);

    const cargoId = this.data()?.id || this.form.controls.id.value;

    const request$ = cargoId
      ? this.cargosService.updateCargo(cargoId, value)
      : this.cargosService.createCargo(value);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: response.message });
          this.saveSuccess.emit();
          this.resetForm();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
        }
      },
      error: (err) => {
        console.error('Error saving cargo:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      }
    });
  }

  resetForm() {
    this.form.reset({ id: null, nombre: '', descripcion: '', activo: true });
    this.form.markAsPristine();
  }
}
