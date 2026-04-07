import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '../../../shared/ui/prime-imports';
import { AppButton } from '../../../shared/ui/button';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { InventoryAlertService } from './services/inventory-alert.service';
import { InventoryAlert } from '../../../core/models/inventory.model';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-alertas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        AppButton,
        LoadingSpinner,
        SelectModule,
        ToastModule,
        TagModule,
        ButtonModule
    ],
    providers: [MessageService],
    templateUrl: './alertas.html',
    styleUrl: './alertas.scss'
})
export default class Alertas implements OnInit {
    private messageService = inject(MessageService);
    private alertService = inject(InventoryAlertService);

    alerts = signal<InventoryAlert[]>([]);
    loading = signal(false);
    alertCount = signal(0);

    filterOptions = [
        { label: 'Todas', value: 'all' },
        { label: 'Stock Bajo', value: 'STOCK_BAJO' },
        { label: 'Sin Stock', value: 'STOCK_AGOTADO' },
        { label: 'Próximo a Vencer', value: 'PROXIMO_VENCER' },
        { label: 'Vencido', value: 'VENCIDO' }
    ];
    selectedFilter = signal('all');

    ngOnInit() {
        this.load();
        this.loadCount();
    }

    load() {
        this.loading.set(true);

        this.alertService.getPendingAlerts().subscribe({
            next: (response) => {
                if (response.success) {
                    this.alerts.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las alertas',
                    life: 3000
                });
            }
        });
    }

    loadCount() {
        this.alertService.countPendingAlerts().subscribe({
            next: (response) => {
                if (response.success) {
                    this.alertCount.set(response.data);
                }
            }
        });
    }

    loadByType(type: string) {
        this.loading.set(true);

        this.alertService.getAlertsByType(type).subscribe({
            next: (response) => {
                if (response.success) {
                    this.alerts.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
            }
        });
    }

    onFilterChange() {
        const filter = this.selectedFilter();
        if (filter === 'all') {
            this.load();
        } else {
            this.loadByType(filter);
        }
    }

    markAsRead(alert: InventoryAlert) {
        this.alertService.markAsRead(alert.id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Info',
                        detail: 'Alerta marcada como leída',
                        life: 2000
                    });
                    this.load();
                    this.loadCount();
                }
            }
        });
    }

    markAsResolved(alert: InventoryAlert) {
        this.alertService.markAsResolved(alert.id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exitoso',
                        detail: 'Alerta resuelta',
                        life: 2000
                    });
                    this.load();
                    this.loadCount();
                }
            }
        });
    }

    getAlertSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (type) {
            case 'VENCIDO':
            case 'STOCK_AGOTADO':
                return 'danger';
            case 'PROXIMO_VENCER':
            case 'STOCK_BAJO':
                return 'warn';
            default:
                return 'info';
        }
    }

    getAlertIcon(type: string): string {
        switch (type) {
            case 'VENCIDO':
            case 'PROXIMO_VENCER':
                return 'pi pi-calendar-times';
            case 'STOCK_AGOTADO':
            case 'STOCK_BAJO':
                return 'pi pi-box';
            default:
                return 'pi pi-bell';
        }
    }

    getAlertLabel(type: string): string {
        switch (type) {
            case 'STOCK_BAJO': return 'Stock Bajo';
            case 'STOCK_AGOTADO': return 'Sin Stock';
            case 'PROXIMO_VENCER': return 'Próximo a Vencer';
            case 'VENCIDO': return 'Vencido';
            default: return type;
        }
    }
}
