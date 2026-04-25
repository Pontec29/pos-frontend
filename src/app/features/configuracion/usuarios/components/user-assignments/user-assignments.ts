import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { AppButton } from '../../../../../shared/ui/button';
import { UserAssignmentService } from '../../services/user-assignment.service';
import { User } from '../../models/user.models';
import { GeneralService } from '../../../../../shared/services/general.service';
import { RolesEmpresaService } from '../../../permisos/services/roles-empresa.service';
import { Observable } from 'rxjs';
import { AlertService } from '../../../../../shared/services/alert.service';

export interface UserAssignment {
  id?: number;
  usuarioId: number;
  tenantId: number;
  rolId: number;
  nombreEmpresa: string;
  nombreRol: string;
  predeterminado?: boolean;
  activo: boolean;
}

export interface CreateAssignmentRequest {
  usuarioId: number;
  tenantId: number;
  rolId: number;
}


@Component({
  selector: 'app-user-assignments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    SelectModule,
    TableModule,
    TooltipModule,
    ButtonModule,
    AppButton
  ],
  templateUrl: './user-assignments.html',
  styleUrl: './user-assignments.scss'
})
export class UserAssignmentsComponent implements OnInit, OnChanges {
  private readonly userAssignmentService = inject(UserAssignmentService);
  private readonly generalService = inject(GeneralService);
  private readonly rolesEmpresaService = inject(RolesEmpresaService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() selectedUser: User | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  assignments = signal<UserAssignment[]>([]);
  companies = signal<{ label: string; value: number }[]>([]);
  roles = signal<{ label: string; value: number }[]>([]);

  loading = signal(false);
  loadingCompanies = signal(false);
  loadingRoles = signal(false);
  showAssignmentForm = signal(false);
  activeTab = signal<'companies' | 'permissions'>('companies');

  editingAssignment: UserAssignment | null = null;

  assignmentForm = this.fb.group({
    tenantId: [null as number | null, Validators.required],
    rolId: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.loadCompanies();

    // Subscribe to company changes to load roles dynamically
    this.assignmentForm.get('tenantId')?.valueChanges.subscribe(tenantId => {
      console.log('Selected Tenant ID:', tenantId);
      if (tenantId) {
        this.loadRolesByCompany(tenantId);
        this.assignmentForm.get('rolId')?.enable();
      } else {
        this.roles.set([]);
        this.assignmentForm.get('rolId')?.disable();
        this.assignmentForm.get('rolId')?.reset();
      }
    });

    // Disable role initially
    this.assignmentForm.get('roleId')?.disable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.selectedUser) {
      this.loadAssignments();
    }
  }

  private loadAssignments(): void {
    if (!this.selectedUser?.id) return;

    this.loading.set(true);
    this.userAssignmentService.getUserAssignments(this.selectedUser.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignments.set(response.data);
        } else {
          console.error('Error loading assignments:', response.message);
          this.assignments.set([]);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.assignments.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadCompanies(): void {
    this.loadingCompanies.set(true);

    this.generalService.getEmpresasBasicas().subscribe({
      next: (response) => {
        if (response.success) {
          const companyOptions = response.data
            .map((company) => ({
              label: company.razonSocial,
              value: company.tenantId
            }));
          this.companies.set(companyOptions);
        } else {
          console.error('Error loading companies:', response.message);
          this.setFallbackCompanies();
        }
        this.loadingCompanies.set(false);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.setFallbackCompanies();
        this.loadingCompanies.set(false);
      }
    });
  }

  private setFallbackCompanies(): void {
    this.companies.set([
      { label: 'Empresa Principal', value: 1 }
    ]);
  }

  private loadRolesByCompany(companyId: number): void {
    this.loadingRoles.set(true);

    this.rolesEmpresaService.listByEmpresa(companyId).subscribe({
      next: (response) => {
        if (response.success) {
          const roleOptions = response.data
            .filter(role => role.active)
            .map(role => ({
              label: role.name,
              value: role.id
            }));
          this.roles.set(roleOptions);
        } else {
          console.error('Error loading roles:', response.message);
          this.roles.set([]);
        }
        this.loadingRoles.set(false);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.loadingRoles.set(false);
        this.roles.set([]);
      }
    });
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  toggleAssignmentForm(): void {
    if (this.showAssignmentForm()) {
      this.showAssignmentForm.set(false);
      this.assignmentForm.reset();
      this.editingAssignment = null;
    } else {
      this.editingAssignment = null;
      this.assignmentForm.reset();
      this.showAssignmentForm.set(true);
    }
  }

  editAssignment(assignment: UserAssignment): void {
    this.editingAssignment = assignment;
    this.assignmentForm.patchValue({
      tenantId: assignment.tenantId
    });

    // Manually trigger role load for edit
    if (assignment.tenantId) {
      this.loadRolesByCompany(assignment.tenantId);
      this.assignmentForm.patchValue({ rolId: assignment.rolId });
      this.assignmentForm.get('rolId')?.enable();
    }
  }

  saveAssignment(): void {
    if (this.assignmentForm.invalid || !this.selectedUser?.id) return;

    const formValue = this.assignmentForm.value;
    
    // Always use assignUserToCompany for both create and update
    this.userAssignmentService.assignUserToCompany(
      this.selectedUser.id,
      formValue.tenantId!,
      formValue.rolId!,
      false
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.success(this.editingAssignment ? 'Asignación actualizada' : 'Usuario asignado correctamente');
          this.toggleAssignmentForm();
          this.loadAssignments();
        }
      },
      error: (error) => {
        this.alertService.error('No se pudo procesar la asignación');
      }
    });
  }

  deleteAssignment(assignment: UserAssignment): Observable<void> {
    if (!this.selectedUser?.id || !assignment.tenantId) return new Observable();

    if (!confirm('¿Está seguro de eliminar esta asignación?')) return new Observable();

    this.userAssignmentService.removeUserCompany(this.selectedUser.id, assignment.tenantId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAssignments();
        }
      },
      error: (error) => {
        console.error('Error deleting assignment:', error);
      }
    });
    return new Observable();
  }



  showAssignmentDialog() {
    this.showAssignmentForm.set(true);
  }
}
