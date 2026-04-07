import { Component, inject, signal, input, output, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { Sucursal } from '../../domain/sucursal.type';
import { SucursalService } from '../../services/sucursal.service';

@Component({
  selector: 'app-form-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ToggleSwitchModule
  ],
  templateUrl: './form-sucursal.html',
  styleUrl: './form-sucursal.scss'
})
export class FormSucursalComponent implements OnInit {
  private readonly sucursalService = inject(SucursalService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Inputs & Outputs
  data = input<Sucursal | null>(null);
  saveSuccess = output<void>();

  isSubmitting = signal(false);

  form = this.fb.group({
    id: [null as number | null],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    activo: [true]
  });

  constructor() {
    effect(() => {
      const selectedSucursal = this.data();
      if (selectedSucursal) {
        this.form.patchValue({
          id: selectedSucursal.id,
          nombre: selectedSucursal.nombre,
          direccion: selectedSucursal.direccion,
          telefono: selectedSucursal.telefono,
          email: selectedSucursal.email,
          activo: selectedSucursal.activo
        });
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit(): void {}

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

    const value = this.form.value as Partial<Sucursal>;
    this.isSubmitting.set(true);

    const sucursalId = this.data()?.id || this.form.controls.id.value;

    const request$ = sucursalId
      ? this.sucursalService.update(sucursalId, value as any)
      : this.sucursalService.create(value as any);

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
        console.error('Error saving sucursal:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      }
    });
  }

  resetForm() {
    this.form.reset({
      id: null,
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      activo: true
    });
    this.form.markAsPristine();
  }
}
