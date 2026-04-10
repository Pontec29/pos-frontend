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
import { Role } from './domain/role.interface';
import { RolesService } from './services/roles.service';
import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';

@Component({
  standalone: true,
  selector: 'app-config-roles',
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
  providers: [RolesService],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export default class RolesPage implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly messageService = inject(MessageService);
  private readonly confirmDialog = inject(ModalConfirmacionService);

  // Pagination & Search
  rows = signal(10);
  first = signal(0);
  searchValue = signal('');

  // Resource Control
  private refreshTrigger = signal(0);
  rolesResource = this.rolesService.getRolesResource(this.refreshTrigger);

  // Computed signals
  loading = this.rolesResource.isLoading;
  error = computed(() => this.rolesResource.error() ? 'Error al cargar los roles' : null);

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
    let data = this.rolesResource.value() || [];

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
  modalData = signal<ModalData<Role> | null>(null);

  openNew = () => {
    this.modalData.set({ view: 'rol', mode: 'create' });
    this.showDialog.set(true);
  };

  editRole = (e: Role) => {
    this.modalData.set({ view: 'rol', mode: 'update', dataUpdate: e });
    this.showDialog.set(true);
  };

  onModalClosed(event: { saved: boolean; result?: unknown }): void {
    this.showDialog.set(false);
    this.modalData.set(null);
    if (event.saved) {
      this.refrescar();
    }
  }

  remove = (e: Role) => {
    this.confirmDialog.confirm('delete', e.nombre, () => {
      this.rolesService.deleteRole(e.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado' });
            this.refrescar();
          } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
          }
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar rol' });
        }
      });
    });
  };

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
  }
}
