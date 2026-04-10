import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MarcaService } from './services/marca.service';
import { LoadingSpinner } from '@shared/ui/loading-spinner/loading-spinner';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { AppButton } from '@shared/ui/button';
import { ModalConfirmacionComponent } from '@shared/ui/modal-confirmacion/modal-confirmacion.component';
import { PRIMENG_FILTER_MODULES, PRIMENG_TABLE_MODULES } from '@shared/ui/prime-imports';
import { MarcaListar, MarcaUpSert } from './domain/marca.interface';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MarcaForm } from './components/modal/marca-form';

@Component({
  selector: 'app-marca',
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
    MarcaForm
],
  providers: [ConfirmationService],
  templateUrl: './marca.html',
  styleUrl: './marca.scss'
})
export default class MarcaPage implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private marcaService = inject(MarcaService);

  // Signals
  marcas = signal<MarcaListar[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  selectedMarca = signal<MarcaListar | null>(null);
  visible = signal(false);

  // Filtros
  searchQuery = signal('');
  statusOptions = signal([
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ]);
  statusFilter = signal<boolean | null>(null);
  private readonly statusFilterChange$ = new Subject<boolean | null>();

  filteredMarcas = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const list = this.marcas();
    if (!query) return list;
    return list.filter(m =>
      m.NOMBRE.toLowerCase().includes(query) ||
      (m.DESCRIPCION && m.DESCRIPCION.toLowerCase().includes(query))
    );
  });

  // Paginación
  rows = signal(10);
  first = signal(0);

  ngOnInit() {
    this.loadMarcas();

    this.statusFilterChange$
      .pipe(
        debounceTime(250),
        distinctUntilChanged()
      )
      .subscribe((statusValue: boolean | null) => {
        const activeParam: boolean | undefined =
          statusValue === null ? undefined : statusValue;
        this.loadMarcas(activeParam);
      });
  }

  openNew() {
    this.selectedMarca.set(null);
    this.visible.set(true);
  }

  editMarca(marca: MarcaListar) {
    this.selectedMarca.set(marca);
    this.visible.set(true);
  }

  deleteMarca(marca: MarcaListar) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la marca "${marca.NOMBRE}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'danger',
      accept: () => {
        this.marcaService.delete(marca.ID_MARCA).subscribe({
          next: (response) => {
            if (response.success) {
              this.marcas.update(values => values.filter(val => val.ID_MARCA !== marca.ID_MARCA));
              this.messageService.add({
                severity: 'success',
                summary: 'Exitoso',
                detail: 'Marca eliminada correctamente',
                life: 3000
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'No se pudo eliminar la marca',
                life: 3000
              });
            }
          },
          error: (err) => {
            console.error('Error al eliminar marca:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la marca',
              life: 3000
            });
          }
        });
      }
    });
  }

  onSaveMarca(formValue: any) {
    const request: MarcaUpSert = {
      NOMBRE: formValue.name,
      DESCRIPCION: formValue.description || ''
    };

    if (formValue.id) {
      this.marcaService.update(request, formValue.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Marca actualizada correctamente',
              life: 3000
            });
            this.loadMarcas();
            this.visible.set(false);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Error al actualizar la marca',
              life: 3000
            });
          }
        },
        error: (err) => {
          console.error('Error al actualizar marca:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la marca',
            life: 3000
          });
        }
      });
    } else {
      this.marcaService.create(request).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Marca creada correctamente',
              life: 3000
            });
            this.loadMarcas();
            this.visible.set(false);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Error al crear la marca',
              life: 3000
            });
          }
        },
        error: (err) => {
          console.error('Error al crear marca:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la marca',
            life: 3000
          });
        }
      });
    }
  }

  onCancelDialog() {
    this.visible.set(false);
    this.selectedMarca.set(null);
  }

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  onStatusChange(statusValue: boolean | null): void {
    this.statusFilter.set(statusValue);
    this.statusFilterChange$.next(statusValue);
  }

  loadMarcas(active?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.marcaService
      .getAll(active)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.marcas.set(res.data);
          } else {
            this.error.set(res.message || 'No se pudieron cargar las marcas');
          }
        },
        error: (err: unknown) => {
          console.error('Error al cargar marcas:', err);
          this.error.set('No se pudo conectar al servidor para cargar las marcas');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las marcas',
            life: 3000
          });
        }
      });
  }
}
