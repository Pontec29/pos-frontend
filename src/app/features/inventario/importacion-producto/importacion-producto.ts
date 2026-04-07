import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';

@Component({
  selector: 'app-importacion-producto',
  imports: [
    CommonModule,
    FormsModule,
    AppButton,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES
  ],
  templateUrl: './importacion-producto.html',
  styleUrl: './importacion-producto.scss',
})
export default class ImportacionProducto {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  searchQuery = '';
  pageSize = 10;
  pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ];

  // Datos de ejemplo para la tabla (inicialmente vacío)
  importResults: any[] = [];

  triggerFileInput(): void {
    // Lógica pendiente
  }

  onFileSelected(event: Event): void {
    // Lógica pendiente
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    // Lógica pendiente
  }
}
