import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { PaginatorState } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppButton } from '../../../shared/ui/button';
import { Breadcrumb } from "primeng/breadcrumb";
import { ModalForm } from '@shared/components/modal-form/modal-form';
import { ModalData } from '@shared/domains/apartadoType.model';
import { UserAssignmentsComponent } from './components/user-assignments/user-assignments';
import { UserService } from './services/user.service';
import { User } from './models/user.models';

@Component({
  standalone: true,
  selector: 'app-config-usuarios',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FORM_MODULES,
    ...PRIMENG_FILTER_MODULES,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    AppButton,
    ModalForm,
    UserAssignmentsComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export default class UsuariosPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  fb = new FormBuilder();

  rows = signal(10);
  first = signal(0);
  rows2 = signal(10);
  searchValue = signal('');

  // Estado local
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  cols = [
    { field: 'id', header: '#' },
    { field: 'username', header: 'Usuario' },
    { field: 'nombres', header: 'Nombre' },
    { field: 'apellidos', header: 'Apellido' },
    { field: 'email', header: 'Correo' },
    { field: 'empresas', header: 'Empresas' },
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
  dateRange: Date[] | null = null;

  users = signal<User[]>([]);

  filtered = computed(() => {
    const q = this.searchValue().toLowerCase().trim();
    let data = this.users();

    if (this.selectedStatus() !== null) {
      data = data.filter(u => u.activo === this.selectedStatus());
    }

    if (!q) return data;
    return data.filter(u =>
      [
        u.id?.toString(),
        u.username,
        u.nombres,
        u.apellidos,
        u.email,
        u.activo ? 'activo' : 'inactivo'
      ]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q))
    );
  });

  paged = computed(() => {
    const list = this.filtered();
    const start = this.first();
    const end = start + this.rows2();
    return list.slice(start, end);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data);
        } else {
          this.error.set('Error al cargar usuarios: ' + response.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Error de conexión al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  onRefresh(): void {
    this.loadUsers();
  }

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows2.set(event.rows ?? 10);
  }

  showDialog = signal(false);
  showAssignmentsDialog = signal(false);
  modalData = signal<ModalData<User> | null>(null);
  selectedUserForAssignments: User | null = null;

  // Formulario para crear/editar usuario
  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    tipoDocumento: ['dni'],
    nroDocumento: ['', Validators.required],
    telefono: [''],
    activo: [true],
    id: [null as number | null]
  });

  openNew = () => {
    this.modalData.set({ view: 'usuario', mode: 'create' });
    this.showDialog.set(true);
  };

  editUser = (u: User) => {
    this.modalData.set({ view: 'usuario', mode: 'update', dataUpdate: u });
    this.showDialog.set(true);
  };

  openAssignments = (user: User) => {
    this.selectedUserForAssignments = user;
    this.showAssignmentsDialog.set(true);
  };

  onModalClosed(event: { saved: boolean; result?: unknown }): void {
    this.showDialog.set(false);
    this.modalData.set(null);
    if (event.saved) {
      this.loadUsers();
    }
  }

  toggleUserStatus = (u: User) => {
    const action = u.activo ? 'desactivar' : 'activar';

    this.confirmationService.confirm({
      message: `¿Está seguro de ${action} este usuario?`,
      header: 'Confirmar Acción',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.loading.set(true);
        const request = u.activo ?
          this.userService.deactivateUser(u.id) :
          this.userService.activateUser(u.id);

        request.subscribe({
          next: (response) => {
            if (response.success) {
              this.loadUsers();
            } else {
              alert(`Error al ${action} usuario: ${response.message}`);
            }
            this.loading.set(false);
          },
          error: (err) => {
            console.error(err);
            alert(`Error al ${action} usuario`);
            this.loading.set(false);
          }
        });
      }
    });
  };

  remove = (u: User) => {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este usuario?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-info-circle',
      acceptIcon: "none",
      rejectIcon: "none",
      rejectButtonStyleClass: "p-button-text p-button-danger",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.userService.deleteUser(u.id).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (err) => console.error(err)
        });
      }
    });
  };
}
