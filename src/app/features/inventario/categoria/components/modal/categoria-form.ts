import { Component, OnInit, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { MessageService } from 'primeng/api';
import { AppButton } from '@shared/ui/button';
import { Categoria } from '@inventario/categoria/domain/categoria.interface';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...PRIMENG_FORM_MODULES,
    AppButton
  ],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.scss'
})
export class CategoriaForm implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  visible = input<boolean>(false);
  category = input<Categoria | null>(null);
  loading = input<boolean>(false);

  visibleChange = output<boolean>();
  save = output<any>();
  cancel = output<void>();

  statusOptions = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' }
  ];

  categoryForm: FormGroup<{
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
    return !!this.category()?.ID_CATEGORIA;
  }

  ngOnInit() {
    this.loadCategoryData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] && !changes['category'].firstChange) {
      this.loadCategoryData();
    }
  }

  onSave() {
    if (this.categoryForm.invalid) return;

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

      changes['id'] = this.categoryForm.controls.id.value;
      this.save.emit(changes);
    } else {
      this.save.emit(this.categoryForm.value);
    }
  }

  private getChangedValues() {
    const currentValues = this.categoryForm.getRawValue();
    const changes: any = {};
    if (currentValues.name !== this.initialValues.name) {
      changes['name'] = currentValues.name;
    }
    if (currentValues.description !== this.initialValues.description) {
      changes['description'] = currentValues.description;
    }

    return changes;
  }

  private loadCategoryData() {
    if (this.category()) {
      const data = {
        id: this.category()?.ID_CATEGORIA,
        name: this.category()?.NOMBRE,
        description: this.category()?.DESCRIPCION,
      };
      this.categoryForm.patchValue(data);
      this.initialValues = { ...data };
    } else {
      this.categoryForm.reset();
      this.initialValues = this.categoryForm.getRawValue();
    }
  }

  onCancel() {
    this.cancel.emit();
    this.visibleChange.emit(false);
  }
}
