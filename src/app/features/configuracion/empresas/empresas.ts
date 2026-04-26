import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { PRIMENG_TABLE_MODULES, PRIMENG_FORM_MODULES, PRIMENG_FILTER_MODULES } from '@shared/ui/prime-imports';
import { PaginatorState } from 'primeng/paginator';
import { AppButton } from '../../../shared/ui/button';
import { Breadcrumb } from "primeng/breadcrumb";
import { EmpresaDialogComponent } from './components/empresa-dialog/empresa-dialog';
import { CompanyService } from './services/company.service';
import { Empresa } from './models/empresa.model';

@Component({
    standalone: true,
    selector: 'app-config-empresas',
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
        EmpresaDialogComponent
    ],
    templateUrl: './empresas.html',
    styleUrl: './empresas.scss'
})
export default class EmpresasPage implements OnInit {
    private readonly companyService = inject(CompanyService);
    private readonly router = inject(Router);
    fb = new FormBuilder();


    rows = signal(10);
    first = signal(0);
    rows2 = signal(10);
    searchValue = signal('');

    // Estado de la aplicación
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    cols = [
        { field: 'tenantId', header: '#' },
        { field: 'razonSocial', header: 'Razón Social' },
        { field: 'ruc', header: 'NIT/RUC' },
        { field: 'direccion', header: 'Dirección' },
        { field: 'telefono', header: 'Teléfono' },
        { field: 'email', header: 'Correo' },
        { field: 'tipoEmpresa', header: 'Tipo' },
        { field: 'empresaPrincipal', header: 'Principal' },
        { field: 'activo', header: 'Estado' },
        { field: 'actions', header: 'Acciones' }
    ];
    selectedColumns = this.cols.slice();
    isSelected = (field: string) => this.selectedColumns.some(c => c.field === field);

    statusOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];
    selectedStatus: boolean | null = null;

    dateRange: Date[] | null = null;

    empresas = signal<Empresa[]>([]);

    filtered = computed(() => {
        const q = this.searchValue().toLowerCase().trim();
        let data = this.empresas();

        if (this.selectedStatus !== null) {
            data = data.filter(e => e.activo === this.selectedStatus);
        }

        if (!q) return data;
        return data.filter(e =>
            [
                e.tenantId?.toString(),
                e.razonSocial,
                e.ruc,
                e.direccion,
                e.telefono,
                e.email,
                e.tipoEmpresa,
                e.empresaPrincipal ? 'principal' : 'secundaria',
                e.activo ? 'activo' : 'inactivo'
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
        this.loadEmpresas();
    }

    private loadEmpresas(): void {
        this.loading.set(true);
        this.error.set(null);

        this.companyService.getEmpresas().subscribe({
            next: (response) => {
                if (response.success) {
                    this.empresas.set(response.data);
                } else {
                    this.error.set('Error al cargar las empresas: ' + response.message);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading companies:', err);
                this.error.set('Error de conexión al cargar las empresas');
                this.loading.set(false);
            }
        });
    }

    onRefresh(): void {
        this.loadEmpresas();
    }

    manageModules(e: Empresa) {
        if (!e.tenantId) return;
        this.router.navigate(['/configuracion/menu-empresa', e.tenantId]);
    }

    onPageChange(event: PaginatorState) {
        this.first.set(event.first ?? 0);
        this.rows2.set(event.rows ?? 10);
    }

    showDialog = signal(false);
    editing: any | null = null;

    form = this.fb.group({
        tenantId: [null as number | null],
        razonSocial: ['', Validators.required],
        ruc: ['', Validators.required],
        direccion: [''],
        telefono: [''],
        email: ['', [Validators.email]],
        tipoEmpresa: [''],
        empresaPrincipal: [false],
        activo: [true],
        logoUrl: ['']
    });

    openNew = () => {
        this.editing = null;
        this.form.reset({
            tenantId: null as number | null,
            razonSocial: '',
            ruc: '',
            direccion: '',
            telefono: '',
            email: '',
            tipoEmpresa: '',
            empresaPrincipal: false,
            activo: true,
            logoUrl: ''
        });
        this.showDialog.set(true);
    };

    editEmpresa = (e: Empresa) => {
        this.editing = e;
        this.form.patchValue({
            tenantId: e.tenantId,
            razonSocial: e.razonSocial,
            ruc: e.ruc,
            direccion: e.direccion,
            telefono: e.telefono,
            email: e.email,
            tipoEmpresa: e.tipoEmpresa,
            empresaPrincipal: e.empresaPrincipal,
            activo: e.activo,
            logoUrl: e.logoUrl
        });
        this.showDialog.set(true);
    };

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.form.patchValue({ logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    save = () => {
        if (this.form.invalid) return;
        const value = this.form.value as Partial<Empresa>;
        this.loading.set(true);

        const request$ = this.editing
            ? this.companyService.actualizarEmpresa(this.editing.tenantId, value)
            : this.companyService.crearEmpresa(value);

        request$.subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success || response.data?.tenantId) { // Adjust based on API response structure
                    this.loadEmpresas();
                    this.showDialog.set(false);
                    this.editing = null;
                } else {
                    this.error.set('Error al guardar: ' + (response.message || 'Error desconocido'));
                }
            },
            error: (err) => {
                this.loading.set(false);
                console.error('Error saving company:', err);
                this.error.set('Error al guardar la empresa');
            }
        });
    };

    remove = (e: Empresa) => {
        // TODO: Implementar llamada a API para eliminar empresa
        // Por ahora solo removemos localmente
        this.empresas.set(this.empresas().filter(x => x.tenantId !== e.tenantId));
    };

    getCompanyTypeLabel(type: string): string {
        const types: Record<string, string> = {
            'FARMACIA': 'Farmacia',
            'RESTAURANT': 'Restaurante',
            'RETAIL': 'Comercio',
            'SERVICE': 'Servicios'
        };
        return types[type] || type;
    }

    trackByTenantId(index: number, company: Empresa): number {
        return company?.tenantId || index;
    }
}
