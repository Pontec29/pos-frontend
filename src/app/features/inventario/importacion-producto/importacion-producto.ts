import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProductoService } from '@core/services/producto.service';
import { AlertService } from '@shared/services/alert.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-importacion-producto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButton,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    ProgressSpinnerModule
  ],
  providers: [],
  templateUrl: './importacion-producto.html',
  styleUrl: './importacion-producto.scss',
})
export default class ImportacionProducto {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly productoService = inject(ProductoService);
  private readonly alertService = inject(AlertService);

  isDragging = false;
  isLoading = false;
  searchQuery = '';
  pageSize = 10;
  pageSizeOptions = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ];

  // Resultados de la importación
  importResults: any[] = [];

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
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

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  private uploadFile(file: File): void {
    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      this.alertService.error('Formato de archivo no permitido');
      return;
    }

    this.isLoading = true;
    this.productoService.importar(file)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.importResults = response.data;
          this.alertService.success(`Se importaron ${this.importResults.length} productos correctamente.`);
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'No se pudo procesar el archivo.', 'Error crítico');
        }
      });
  }

  downloadTemplate(): void {
    this.productoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = 'Plantilla_Importacion_Productos.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.alertService.error('No se pudo generar la plantilla desde el servidor');
      }
    });
  }
}
