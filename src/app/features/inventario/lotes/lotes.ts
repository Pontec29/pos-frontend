import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FILTER_MODULES } from '../../../shared/ui/prime-imports';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { LotService } from './services/lot.service';
import { Lot } from '../../../core/models/inventory.model';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-lotes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        ...PRIMENG_TABLE_MODULES,
        ...PRIMENG_FILTER_MODULES,
        LoadingSpinner,
        SelectModule,
        ToastModule,
        TagModule
    ],
    providers: [MessageService],
    templateUrl: './lotes.html',
    styleUrl: './lotes.scss'
})
export default class Lotes implements OnInit {
    private messageService = inject(MessageService);
    private lotService = inject(LotService);

    lots = signal<Lot[]>([]);
    loading = signal(false);
    searchQuery = signal('');
    selectedBranchId = signal<number>(1);

    branches = [
        { id: 1, name: 'Sucursal Principal' },
        { id: 2, name: 'Sucursal Norte' },
        { id: 3, name: 'Sucursal Sur' }
    ];

    filterOptions = [
        { label: 'Todos los Activos', value: 'active' },
        { label: 'Próximos a Vencer (90 días)', value: 'near' },
        { label: 'Vencidos', value: 'expired' }
    ];
    selectedFilter = signal('active');

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        const branchId = this.selectedBranchId();

        this.lotService.getActiveByBranch(branchId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.lots.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los lotes',
                    life: 3000
                });
            }
        });
    }

    loadNearExpiration() {
        this.loading.set(true);
        const branchId = this.selectedBranchId();

        this.lotService.getLotsToExpireByBranch(branchId, 90).subscribe({
            next: (response) => {
                if (response.success) {
                    this.lots.set(response.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
            }
        });
    }

    loadExpired() {
        this.loading.set(true);

        this.lotService.getExpiredLots().subscribe({
            next: (response) => {
                if (response.success) {
                    this.lots.set(response.data);
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
        switch (filter) {
            case 'near':
                this.loadNearExpiration();
                break;
            case 'expired':
                this.loadExpired();
                break;
            default:
                this.load();
        }
    }

    onBranchChange() {
        this.onFilterChange();
    }

    getExpirationSeverity(lot: Lot): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (lot.isExpired) return 'danger';
        if (lot.isNearExpiration) return 'warn';
        return 'success';
    }

    getExpirationLabel(lot: Lot): string {
        if (lot.isExpired) return 'Vencido';
        if (lot.isNearExpiration) return `${lot.daysUntilExpiration} días`;
        return 'Vigente';
    }
}
