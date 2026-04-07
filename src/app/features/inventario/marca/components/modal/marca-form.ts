import { Component, OnInit, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { MessageService } from 'primeng/api';
import { AppButton } from '@shared/ui/button';
import { MarcaListar } from '@inventario/marca/domain/marca.interface';

@Component({
  selector: 'app-marca-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...PRIMENG_FORM_MODULES,
    AppButton
  ],
  templateUrl: './marca-form.html',
  styleUrl: './marca-form.scss'
})
export class MarcaForm implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  visible = input<boolean>(false);
  marca = input<MarcaListar | null>(null);
  loading = input<boolean>(false);

  visibleChange = output<boolean>();
  save = output<any>();
  cancel = output<void>();

  marcaForm: FormGroup<{
    id: FormControl<number | null>;
    name: FormControl<string | null>;
    description: FormControl<string | null>;
  }> = this.fb.group({
    id: this.fb.control<number | null>(null),
    name: this.fb.control<string | null>('', [Validators.required]),
    description: this.fb.control<string | null>(''),
  });

  private initialValues: any = {};

  get isEditMode(): boolean {
    return !!this.marca()?.ID_MARCA;
  }

  ngOnInit() {
    this.loadMarcaData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['marca'] && !changes['marca'].firstChange) {
      this.loadMarcaData();
    }
  }

  onSave() {
    if (this.marcaForm.invalid) return;

    if (this.isEditMode) {
      const changes = this.getChangedValues();

      if (Object.keys(changes).length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin cambios',
          detail: 'Primero se debe realizar un cambio en los campos'
        });
        return;
      }

      changes['id'] = this.marcaForm.controls.id.value;
      this.save.emit(changes);
    } else {
      this.save.emit(this.marcaForm.value);
    }
  }

  private getChangedValues() {
    const currentValues = this.marcaForm.getRawValue();
    const changes: any = {};
    if (currentValues.name !== this.initialValues.name) {
      changes['name'] = currentValues.name;
    }
    if (currentValues.description !== this.initialValues.description) {
      changes['description'] = currentValues.description;
    }

    return changes;
  }

  private loadMarcaData() {
    if (this.marca()) {
      const data = {
        id: this.marca()?.ID_MARCA,
        name: this.marca()?.NOMBRE,
        description: this.marca()?.DESCRIPCION,
      };
      this.marcaForm.patchValue(data);
      this.initialValues = { ...data };
    } else {
      this.marcaForm.reset();
      this.initialValues = this.marcaForm.getRawValue();
    }
  }

  onCancel() {
    this.cancel.emit();
    this.visibleChange.emit(false);
  }
}
