import { Component, inject, signal, input, output, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { User } from '../../models/user.models';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../../../../shared/services/shared.service';
import { DocumentTypeBasic } from '../../../../../core/models/document-type.models';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ToggleSwitchModule,
    SelectModule,
    InputMaskModule,
    PasswordModule
  ],
  templateUrl: './form-usuario.html',
  styleUrl: './form-usuario.scss'
})
export class FormUsuarioComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Inputs & Outputs
  data = input<User | null>(null);
  saveSuccess = output<void>();

  isSubmitting = signal(false);
  documentTypes = signal<DocumentTypeBasic[]>([]);

  form = this.fb.group({
    id: [null as number | null],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    documentType: ['dni', Validators.required],
    documentNumber: ['', Validators.required],
    phone: [''],
    active: [true]
  });

  constructor() {
    effect(() => {
      const selectedUser = this.data();
      if (selectedUser) {
        this.form.patchValue({
          id: selectedUser.id,
          username: selectedUser.username,
          email: selectedUser.email,
          firstName: selectedUser.firstName || selectedUser.nombres,
          lastName: selectedUser.lastName || selectedUser.apellidos,
          documentType: selectedUser.documentType || selectedUser.tipoDocumento || 'dni',
          documentNumber: selectedUser.documentNumber || selectedUser.nroDocumento,
          phone: selectedUser.phone || selectedUser.telefono,
          active: selectedUser.active ?? selectedUser.activo ?? true,
          password: ''
        });

        // Al editar, el password no es obligatorio
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
      } else {
        this.resetForm();
        // Al crear, el password es obligatorio
        this.form.get('password')?.setValidators([Validators.required]);
        this.form.get('password')?.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.loadDocumentTypes();
  }

  private loadDocumentTypes(): void {
    this.sharedService.getDocumentTypesBasic().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.documentTypes.set(res.data);
        }
      }
    });
  }

  onDocumentTypeChange(code: string): void {
    const documentType = this.documentTypes().find(t => t.code === code);
    const documentNumberControl = this.form.get('documentNumber');

    if (documentNumberControl && documentType) {
      const validators = [Validators.required];
      validators.push(Validators.maxLength(documentType.maxLength));
      if (documentType.numeric) {
        validators.push(Validators.pattern(/^[0-9]+$/));
      }
      documentNumberControl.setValidators(validators);
      documentNumberControl.updateValueAndValidity();
    }
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

    const value = this.form.value as Partial<User>;
    this.isSubmitting.set(true);

    const userId = this.data()?.id || this.form.controls.id.value;

    const request$ = userId
      ? this.userService.updateUser(userId, value)
      : this.userService.createUser(value);

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
      error: (err) => {
        console.error('Error saving user:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar' });
      }
    });
  }

  resetForm() {
    this.form.reset({
      id: null,
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      documentType: 'dni',
      documentNumber: '',
      phone: '',
      active: true
    });
    this.form.markAsPristine();
  }
}
