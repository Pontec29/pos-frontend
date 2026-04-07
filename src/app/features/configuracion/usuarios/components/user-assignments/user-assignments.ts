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
import { UserAssignment } from '../../../../../core/models/user-assignment.models';
import { User } from '../../models/user.models';
import { GeneralService } from '../../../../../shared/services/general.service';
import { RolesEmpresaService } from '../../../permisos/services/roles-empresa.service';
import { Observable } from 'rxjs';


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
    companyId: [null as number | null, Validators.required],
    roleId: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.loadCompanies();

    // Subscribe to company changes to load roles dynamically
    this.assignmentForm.get('companyId')?.valueChanges.subscribe(companyId => {
      console.log('Selected Company ID:', companyId);
      if (companyId) {
        this.loadRolesByCompany(companyId);
        this.assignmentForm.get('roleId')?.enable();
      } else {
        this.roles.set([]);
        this.assignmentForm.get('roleId')?.disable();
        this.assignmentForm.get('roleId')?.reset();
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
      companyId: assignment.companyId
    });

    // Manually trigger role load for edit
    if (assignment.companyId) {
      this.loadRolesByCompany(assignment.companyId);
      this.assignmentForm.patchValue({ roleId: assignment.roleId });
      this.assignmentForm.get('roleId')?.enable();
    }
    this.showAssignmentForm.set(true);
  }

  saveAssignment(): void {
    if (this.assignmentForm.invalid || !this.selectedUser?.id) return;

    const formValue = this.assignmentForm.value;
    const assignmentData = {
      userId: this.selectedUser.id,
      companyId: formValue.companyId!,
      roleId: formValue.roleId!
    };

    if (this.editingAssignment) {
      // Update existing assignment
      this.userAssignmentService.updateAssignment(this.editingAssignment.id!, assignmentData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAssignments();
            this.showAssignmentForm.set(false);
            this.assignmentForm.reset();
            this.editingAssignment = null;
          }
        },
        error: (error) => {
          console.error('Error updating assignment:', error);
        }
      });
    } else {
      // Create new assignment
      this.userAssignmentService.assignUserToCompany(
        this.selectedUser.id,
        formValue.companyId!,
        formValue.roleId!,
        false // Default company flag - could be added to form if needed
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAssignments();
            this.showAssignmentForm.set(false);
            this.assignmentForm.reset();
            this.editingAssignment = null;
          }
        },
        error: (error) => {
          console.error('Error creating assignment:', error);
        }
      });
    }
  }

  deleteAssignment(assignment: UserAssignment): Observable<void> {
    if (!this.selectedUser?.id || !assignment.companyId) return new Observable();

    if (!confirm('¿Está seguro de eliminar esta asignación?')) return new Observable();

    this.userAssignmentService.removeUserCompany(this.selectedUser.id, assignment.companyId).subscribe({
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
