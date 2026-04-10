import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CategoriaService } from './services/categoria.service';
import { LoadingSpinner } from '@shared/ui/loading-spinner/loading-spinner';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { Categoria, CategoriaUpSert } from './domain/categoria.interface';
import { finalize } from 'rxjs';
import { CategoriaForm } from './components/modal/categoria-form';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FILTER_MODULES,
    AppButton,
    LoadingSpinner,
    ErrorState,
    ModalConfirmacionComponent,
    CategoriaForm
  ],
  providers: [ConfirmationService],
  templateUrl: './categoria.html',
  styleUrl: './categoria.scss'
})
export default class CategoriaPage implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private categoriaService = inject(CategoriaService);

  // Signals
  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  selectedCategoria = signal<Categoria | null>(null);
  visible = signal(false);

  // Filtros
  searchQuery = signal('');
  statusOptions = signal([
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ]);
  statusFilter = signal<boolean | null>(null);


  filteredCategorias = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    let list = this.categorias();

    if (status !== null) {
      list = list.filter(c => c.ACTIVO === status);
    }

    if (!query) return list;

    return list.filter(c =>
      c.NOMBRE.toLowerCase().includes(query) ||
      (c.DESCRIPCION && c.DESCRIPCION.toLowerCase().includes(query))
    );
  });

  // Paginación
  rows = signal(10);
  first = signal(0);

  ngOnInit() {
    this.loadCategorias();
  }

  openNew() {
    this.selectedCategoria.set(null);
    this.visible.set(true);
  }

  editCategoria(categoria: Categoria) {
    this.selectedCategoria.set(categoria);
    this.visible.set(true);
  }

  deleteCategoria(categoria: Categoria) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría "${categoria.NOMBRE}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'danger',
      accept: () => {
        this.categoriaService.delete(categoria.ID_CATEGORIA).subscribe({
          next: (response) => {
            if (response.success) {
              this.categorias.update(values => values.filter(val => val.ID_CATEGORIA !== categoria.ID_CATEGORIA));
              this.messageService.add({
                severity: 'success',
                summary: 'Exitoso',
                detail: 'Categoría eliminada correctamente',
                life: 3000
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'No se pudo eliminar la categoría',
                life: 3000
              });
            }
          },
          error: (err) => {
            console.error('Error al eliminar categoría:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la categoría',
              life: 3000
            });
          }
        });
      }
    });
  }

  onSaveCategoria(formValue: any) {
    this.saving.set(true);

    if (formValue.id) {
      const request: CategoriaUpSert = {};

      if ('name' in formValue) {
        request.NOMBRE = formValue.name;
      }
      if ('description' in formValue) {
        request.DESCRIPCION = formValue.description || '';
      }

      this.categoriaService.update(request, formValue.id)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Exitoso',
                detail: 'Categoría actualizada correctamente',
                life: 3000
              });
              this.loadCategorias();
              this.visible.set(false);
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'Error al actualizar la categoría',
                life: 3000
              });
            }
          },
          error: (err) => {
            console.error('Error al actualizar categoría:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar la categoría',
              life: 3000
            });
          }
        });
    } else {
      const request: CategoriaUpSert = {
        NOMBRE: formValue.name,
        DESCRIPCION: formValue.description || ''
      };

      this.categoriaService.create(request)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Exitoso',
                detail: 'Categoría creada correctamente',
                life: 3000
              });
              this.loadCategorias();
              this.visible.set(false);
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'Error al crear la categoría',
                life: 3000
              });
            }
          },
          error: (err) => {
            console.error('Error al crear categoría:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear la categoría',
              life: 3000
            });
          }
        });
    }
  }

  onCancelDialog() {
    this.visible.set(false);
    this.selectedCategoria.set(null);
  }

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  onStatusChange(statusValue: boolean | null): void {
    this.statusFilter.set(statusValue);
  }

  loadCategorias(active?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoriaService
      .getAll(active)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.categorias.set(res.data);
          } else {
            this.error.set(res.message || 'No se pudieron cargar las categorías');
          }
        },
        error: (err: unknown) => {
          console.error('Error al cargar categorías:', err);
          this.error.set('No se pudo conectar al servidor para cargar las categorías');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las categorías',
            life: 3000
          });
        }
      });
  }
}
