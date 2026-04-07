import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TreeTableModule } from 'primeng/treetable';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TreeNode, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Role } from '@core/models/document-type.models';
import { RolePermissionService, RoleMatrix } from '../roles/services/role-permission.service';
import { AuthService } from '../../auth/services/auth.service';
import { RolesEmpresaService } from './services/roles-empresa.service';

@Component({
    selector: 'app-permisos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TreeTableModule,
        CheckboxModule,
        ButtonModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './permisos.component.html',
    styleUrls: ['./permisos.component.scss']
})
export default class PermisosComponent {
    private readonly permissionService = inject(RolePermissionService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly rolesEmpresaService = inject(RolesEmpresaService);

    roles = signal<Role[]>([]);
    modulesTree = signal<TreeNode[]>([]);
    loading = signal(false);
    tenantId = signal<number | null>(null);

    constructor() {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.loading.set(true);
        this.authService.getSession().subscribe(session => {
            if (session?.tenantId) {
                this.tenantId.set(session.tenantId);
                this.rolesEmpresaService.listByEmpresa(session.tenantId).subscribe(res => {
                    if (res.success) {
                        this.roles.set(res.data);
                        this.loadMatrix(session.tenantId!, res.data.map(r => r.id));
                    } else {
                        this.loading.set(false);
                    }
                });
            }
        });
    }

    loadMatrix(tenantId: number, roleIds: number[]) {
        if (roleIds.length === 0) {
            this.loading.set(false);
            return;
        }
        this.permissionService.getPermissionMatrix(tenantId, roleIds).subscribe({
            next: res => {
                if (res.success) {
                    this.modulesTree.set(this.buildTree(res.data));
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private buildTree(nodes: RoleMatrix[]): TreeNode[] {
        return nodes.map(m => ({
            data: {
                moduloId: m.moduloId,
                empresaModuloId: m.empresaModuloId,
                label: m.label,
                icon: m.icon,
                rolesAccess: m.rolesAccess
            },
            children: m.items?.length ? this.buildTree(m.items) : [],
            expanded: true
        }));
    }

    updatePermission(moduloId: number, empresaModuloId: number, roleId: number, active: boolean) {
        const payload = {
            roleId: roleId,
            empresaModuloId: empresaModuloId,
            active: active
        };
        this.permissionService.upsert(payload).subscribe({
            next: () => this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Acceso actualizado' }),
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
                // Revert UI? Better to re-load matrix if complex
            }
        });
    }
}
