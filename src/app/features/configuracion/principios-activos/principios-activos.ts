import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '../../../shared/ui/prime-imports';
import { AppButton } from '../../../shared/ui/button';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { AppConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ActivePrincipleService } from './services/active-principle.service';
import { ActivePrinciple, ActivePrincipleRequest } from '../../../core/models/inventory.model';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-principios-activos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        AppButton,
        LoadingSpinner,
        AppConfirmDialog,
        DialogModule,
        InputTextModule,
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './principios-activos.html',
    styleUrl: './principios-activos.scss'
})
export default class PrincipiosActivos implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private service = inject(ActivePrincipleService);

    principles = signal<ActivePrinciple[]>([]);
    visible = signal(false);
    loading = signal(false);
    saving = signal(false);
    selectedItem = signal<ActivePrinciple | null>(null);
    searchQuery = signal('');

    form: ActivePrincipleRequest = { name: '', description: '', active: true };

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.principles.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los principios activos',
                    life: 3000
                });
            }
        });
    }

    openNew() {
        this.selectedItem.set(null);
        this.form = { name: '', description: '', active: true };
        this.visible.set(true);
    }

    edit(item: ActivePrinciple) {
        this.selectedItem.set(item);
        this.form = { name: item.name, description: item.description, active: item.active };
        this.visible.set(true);
    }

    delete(item: ActivePrinciple) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el principio activo "${item.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.service.delete(item.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Principio activo eliminado',
                                life: 3000
                            });
                            this.load();
                        }
                    },
                    error: (err) => {
                        console.error('Error:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    save() {
        if (!this.form.name?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'El nombre es requerido',
                life: 3000
            });
            return;
        }

        this.saving.set(true);
        const item = this.selectedItem();

        const request$ = item
            ? this.service.update(item.id, this.form)
            : this.service.create(this.form);

        request$.subscribe({
            next: (response) => {
                if (response.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exitoso',
                        detail: item ? 'Principio activo actualizado' : 'Principio activo creado',
                        life: 3000
                    });
                    this.visible.set(false);
                    this.load();
                }
                this.saving.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar',
                    life: 3000
                });
                this.saving.set(false);
            }
        });
    }

    cancel() {
        this.visible.set(false);
        this.selectedItem.set(null);
    }
}
