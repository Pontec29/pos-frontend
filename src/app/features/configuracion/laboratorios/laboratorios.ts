import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '../../../shared/ui/prime-imports';
import { AppButton } from '../../../shared/ui/button';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { ModalConfirmacionComponent } from '../../../shared/ui/modal-confirmacion/modal-confirmacion.component';
import { LaboratoryService } from './services/laboratory.service';
import { Laboratory, LaboratoryRequest } from '../../../core/models/inventory.model';
import { LaboratoryFormDialog } from './components/laboratory-form-dialog/laboratory-form-dialog';

@Component({
    selector: 'app-laboratorios',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        AppButton,
        LoadingSpinner,
        ModalConfirmacionComponent,
        LaboratoryFormDialog
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './laboratorios.html',
    styleUrl: './laboratorios.scss'
})
export default class Laboratorios implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private laboratoryService = inject(LaboratoryService);

    // Signals
    laboratories = signal<Laboratory[]>([]);
    visible = signal(false);
    loading = signal(false);
    saving = signal(false);
    selectedLab = signal<Laboratory | null>(null);
    searchQuery = signal('');

    // Form
    form: LaboratoryRequest = { name: '', description: '', active: true };

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.laboratoryService.getAll().subscribe({
            next: (response) => {
                if (response.success) {
                    this.laboratories.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar laboratorios:', err);
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los laboratorios',
                    life: 3000
                });
            }
        });
    }

    openNew() {
        this.selectedLab.set(null);
        this.form = { name: '', description: '', active: true };
        this.visible.set(true);
    }

    edit(lab: Laboratory) {
        this.selectedLab.set(lab);
        this.form = { name: lab.name, description: lab.description, active: lab.active };
        this.visible.set(true);
    }

    delete(lab: Laboratory) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el laboratorio "${lab.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.laboratoryService.delete(lab.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Laboratorio eliminado',
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
                            detail: 'No se pudo eliminar el laboratorio',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    save(formData: any) {
        this.saving.set(true);
        const lab = this.selectedLab();

        // Map form data to API request
        const request: LaboratoryRequest = {
            name: formData.name,
            description: formData.description,
            active: formData.status === 'Activo'
        };

        if (lab) {
            this.laboratoryService.update(lab.id, request).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Laboratorio actualizado',
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
                        detail: 'No se pudo actualizar el laboratorio',
                        life: 3000
                    });
                    this.saving.set(false);
                }
            });
        } else {
            this.laboratoryService.create(request).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Laboratorio creado',
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
                        detail: 'No se pudo crear el laboratorio',
                        life: 3000
                    });
                    this.saving.set(false);
                }
            });
        }
    }

    cancel() {
        this.visible.set(false);
        this.selectedLab.set(null);
    }
}
