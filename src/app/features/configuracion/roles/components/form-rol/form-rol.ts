import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { Role } from '../../domain/role.interface';
import { RolesService } from '../../services/roles.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-form-rol',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ToggleSwitchModule
  ],
  templateUrl: './form-rol.html',
  styleUrl: './form-rol.scss'
})
export class FormRolComponent {
  private readonly rolesService = inject(RolesService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Inputs & Outputs
  data = input<Role | null>(null);
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
      const selectedRole = this.data();
      if (selectedRole) {
        this.form.patchValue({
          id: selectedRole.id,
          nombre: selectedRole.nombre,
          descripcion: selectedRole.descripcion,
          activo: selectedRole.activo
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

    const value = this.form.value as Partial<Role>;
    this.isSubmitting.set(true);

    const roleId = this.data()?.id || this.form.controls.id.value;

    if (!roleId) {
      delete value.activo;
    }

    const request$ = roleId
      ? this.rolesService.updateRole(roleId, value)
      : this.rolesService.createRole(value);

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
        console.error('Error saving role:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      }
    });
  }

  resetForm() {
    this.form.reset({ id: null, nombre: '', descripcion: '', activo: true });
    this.form.markAsPristine();
  }
}
