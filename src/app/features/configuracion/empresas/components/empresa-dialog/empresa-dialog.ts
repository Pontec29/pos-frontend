import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AppButton } from '../../../../../shared/ui/button';

@Component({
  selector: 'app-empresa-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, InputTextModule, SelectModule, DatePickerModule, AppButton],
  templateUrl: './empresa-dialog.html',
  styleUrl: './empresa-dialog.scss'
})
export class EmpresaDialogComponent {
  @Input() form!: FormGroup;
  @Input() statusOptions: { label: string; value: boolean }[] = [];
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<any>();

  onHide() {
    this.visibleChange.emit(false);
  }

  onSave() {
    this.save.emit();
  }
}

