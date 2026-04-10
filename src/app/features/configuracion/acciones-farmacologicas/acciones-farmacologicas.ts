import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '../../../shared/ui/prime-imports';
import { AppButton } from '../../../shared/ui/button';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { ModalConfirmacionComponent } from '../../../shared/ui/modal-confirmacion/modal-confirmacion.component';
import { PharmacologicalActionService } from './services/pharmacological-action.service';
import { PharmacologicalAction, PharmacologicalActionRequest } from '../../../core/models/inventory.model';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-acciones-farmacologicas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        AppButton,
        LoadingSpinner,
        ModalConfirmacionComponent,
        DialogModule,
        InputTextModule,
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './acciones-farmacologicas.html',
    styleUrl: './acciones-farmacologicas.scss'
})
export default class AccionesFarmacologicas implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private service = inject(PharmacologicalActionService);

    actions = signal<PharmacologicalAction[]>([]);
    visible = signal(false);
    loading = signal(false);
    saving = signal(false);
    selectedItem = signal<PharmacologicalAction | null>(null);
    searchQuery = signal('');

    form: PharmacologicalActionRequest = { name: '', description: '', active: true };

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.actions.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las acciones farmacológicas',
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

    edit(item: PharmacologicalAction) {
        this.selectedItem.set(item);
        this.form = { name: item.name, description: item.description, active: item.active };
        this.visible.set(true);
    }

    delete(item: PharmacologicalAction) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la acción "${item.name}"?`,
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
                                detail: 'Acción eliminada',
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
                        detail: item ? 'Acción actualizada' : 'Acción creada',
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
