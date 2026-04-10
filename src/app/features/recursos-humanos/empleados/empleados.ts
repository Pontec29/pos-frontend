import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { PaginatorState } from 'primeng/paginator';
import { ModalConfirmacionService } from '../../../shared/ui/modal-confirmacion/modal-confirmacion.service';
import { AppButton } from '../../../shared/ui/button';
import { Empleado } from './domain/empleado.domain';
import { EmpleadoService } from './services/empleado.service';

@Component({
  standalone: true,
  selector: 'app-rrhh-empleados',
  imports: [
    CommonModule,
    FormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    ...PRIMENG_FILTER_MODULES,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    AppButton
  ],
  providers: [EmpleadoService],
  templateUrl: './empleados.html',
  styleUrl: './empleados.scss'
})
export default class Empleados implements OnInit {
  private readonly empleadoService = inject(EmpleadoService);
  private readonly messageService = inject(MessageService);
  private readonly confirmDialog = inject(ModalConfirmacionService);
  private readonly router = inject(Router);

  // Pagination & Search
  rows = signal(10);
  first = signal(0);
  searchValue = signal('');

  // Resource Control
  private refreshTrigger = signal(0);
  empleadosResource = this.empleadoService.getEmpleadosResource(this.refreshTrigger);

  // Computed signals
  loading = this.empleadosResource.isLoading;
  error = computed(() => this.empleadosResource.error() ? 'Error al cargar los empleados' : null);

  cols = [
    { field: 'id', header: '#' },
    { field: 'nombre', header: 'Nombre Completo' },
    { field: 'cargoNombre', header: 'Cargo' },
    { field: 'tieneAccesoSistema', header: 'Acceso' },
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
    let data = this.empleadosResource.value() || [];

    const status = this.selectedStatus();
    if (status !== null) {
      data = data.filter(e => e.activo === status);
    }

    if (!q) return data;
    return data.filter(e =>
      [
        e.id?.toString(),
        e.nroDocumento,
        e.nombres,
        e.apellidos,
        e.cargoNombre,
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

  openNew = () => {
    this.router.navigate(['/recursos-humanos/empleados/nuevo']);
  };

  editEmpleado = (e: Empleado) => {
    this.router.navigate(['/recursos-humanos/empleados/editar', e.id]);
  };

  viewEmpleado = (e: Empleado) => {
    this.router.navigate(['/recursos-humanos/empleados/ver', e.id]);
  };

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
  }
}
