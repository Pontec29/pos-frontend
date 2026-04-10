import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { PaginatorState } from 'primeng/paginator';
import { ModalConfirmacionService } from '../../../shared/ui/modal-confirmacion/modal-confirmacion.service';
import { AppButton } from '../../../shared/ui/button';
import { Cargo } from './domain/cargo.interface';
import { CargosService } from './services/cargos.service';
import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';

@Component({
  standalone: true,
  selector: 'app-rrhh-cargos',
  imports: [
    CommonModule,
    FormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    ...PRIMENG_FILTER_MODULES,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    AppButton,
    ModalForm
  ],
  providers: [CargosService],
  templateUrl: './cargos.html',
  styleUrl: './cargos.scss'
})
export default class Cargos implements OnInit {
  private readonly cargosService = inject(CargosService);
  private readonly messageService = inject(MessageService);
  private readonly confirmDialog = inject(ModalConfirmacionService);

  // Pagination & Search
  rows = signal(10);
  first = signal(0);
  searchValue = signal('');

  // Resource Control
  private refreshTrigger = signal(0);
  cargosResource = this.cargosService.getCargosResource(this.refreshTrigger);

  // Computed signals
  loading = this.cargosResource.isLoading;
  error = computed(() => this.cargosResource.error() ? 'Error al cargar los cargos' : null);

  cols = [
    { field: 'id', header: '#' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'activo', header: 'Estado' },
    { field: 'actions', header: 'Acciones' }
  ];
  selectedColumns = this.cols.slice();
  isSelected = (field: string) => this.selectedColumns.some(c => c.field === field);

  statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];
  selectedStatus = signal<boolean | null>(null);

  filtered = computed(() => {
    const q = this.searchValue().toLowerCase().trim();
    let data = this.cargosResource.value() || [];

    const status = this.selectedStatus();
    if (status !== null) {
      data = data.filter(e => e.activo === status);
    }

    if (!q) return data;
    return data.filter(e =>
      [
        e.id?.toString(),
        e.nombre,
        e.descripcion,
        e.activo ? 'activo' : 'inactivo'
      ]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q))
    );
  });

  paged = computed(() => {
    const list = this.filtered();
    const start = this.first();
    const end = start + this.rows();
    return list.slice(start, end);
  });

  ngOnInit(): void { }

  refrescar(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  // Dialog Control
  showDialog = signal(false);
  modalData = signal<ModalData<Cargo> | null>(null);

  openNew = () => {
    this.modalData.set({ view: 'cargo', mode: 'create' });
    this.showDialog.set(true);
  };

  editCargo = (e: Cargo) => {
    this.modalData.set({ view: 'cargo', mode: 'update', dataUpdate: e });
    this.showDialog.set(true);
  };

  onModalClosed(event: { saved: boolean; result?: unknown }): void {
    this.showDialog.set(false);
    this.modalData.set(null);
    if (event.saved) {
      this.refrescar();
    }
  }

  remove = (e: Cargo) => {
    // this.confirmDialog.confirm('delete', e.nombre, () => {
    //   this.cargosService.deleteCargo(e.id).subscribe({
    //     next: (response) => {
    //       if (response.success) {
    //         this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cargo eliminado' });
    //         this.refrescar();
    //       } else {
    //         this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
    //       }
    //     },
    //     error: (err) => {
    //       console.error('Error deleting cargo:', err);
    //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar cargo' });
    //     }
    //   });
    // });
  };

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
  }
}
