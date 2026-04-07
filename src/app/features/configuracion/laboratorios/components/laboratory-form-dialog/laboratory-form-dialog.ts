import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { PRIMENG_FORM_MODULES } from '../../../../../shared/ui/prime-imports';
import { AppButton } from '../../../../../shared/ui/button';
import { Laboratory } from '../../../../../core/models/inventory.model';

@Component({
    selector: 'app-laboratory-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ...PRIMENG_FORM_MODULES,
        AppButton
    ],
    templateUrl: './laboratory-form-dialog.html',
    styleUrl: './laboratory-form-dialog.scss'
})
export class LaboratoryFormDialog implements OnInit, OnChanges {
    private fb = inject(FormBuilder);

    @Input() visible = false;
    @Input() laboratory: Laboratory | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    statusOptions = [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' }
    ];

    labForm: FormGroup<{
        id: FormControl<number | null>;
        name: FormControl<string | null>;
        description: FormControl<string | null>;
        status: FormControl<'Activo' | 'Inactivo' | null>;
    }> = this.fb.group({
        id: this.fb.control<number | null>(null),
        name: this.fb.control<string | null>('', [Validators.required]),
        description: this.fb.control<string | null>(''),
        status: this.fb.control<'Activo' | 'Inactivo' | null>('Activo')
    });

    get isEditMode(): boolean {
        return !!this.laboratory?.id;
    }

    ngOnInit() {
        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['laboratory'] && !changes['laboratory'].firstChange) {
            this.loadData();
        }
    }

    private loadData() {
        if (this.laboratory) {
            this.labForm.patchValue({
                id: this.laboratory.id,
                name: this.laboratory.name,
                description: this.laboratory.description,
                status: this.laboratory.active ? 'Activo' : 'Inactivo'
            });
        } else {
            this.labForm.reset({ status: 'Activo' });
        }
    }

    onSave() {
        if (this.labForm.valid) {
            // Convert status back to boolean for API if needed, or let parent handle it
            // Based on Categoría logic, parent handles mapping
            this.save.emit(this.labForm.value);
        } else {
            this.labForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.labForm.reset({ status: 'Activo' });
        this.cancel.emit();
        this.visibleChange.emit(false);
    }
}
