import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../auth/services/auth.service';
import { LoaderService } from '@shared/services/loader.service';

interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconClass: string;
  route: string;
  loading: boolean;
  stats?: {
    value: string;
    label: string;
  };
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface DashboardStat {
  id: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  change: number;
  trend: 'positive' | 'negative' | 'neutral';
  trendIcon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    TagModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export default class DashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private readonly loaderService = inject(LoaderService);

  currentDate = new Date();

  // Signals para el estado del componente
  userName = signal<string>('Usuario');

  // Form para información de la empresa
  companyForm: FormGroup;

  // Signal para los accesos directos
  quickAccessItems = signal<QuickAccessItem[]>([
    {
      id: 'productos',
      title: 'Productos',
      description: 'Gestionar inventario y catálogo',
      icon: 'pi pi-box',
      iconClass: '',
      route: '/productos',
      loading: false,
      stats: { value: '1,234', label: 'productos' }
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Base de datos de clientes',
      icon: 'pi pi-users',
      iconClass: '',
      route: '/clientes',
      loading: false,
      stats: { value: '856', label: 'clientes' }
    },
    {
      id: 'ventas',
      title: 'Ventas',
      description: 'Procesar nueva venta',
      icon: 'pi pi-shopping-cart',
      iconClass: '',
      route: '/ventas',
      loading: false,
      stats: { value: '$25,430', label: 'hoy' }
    },
    {
      id: 'reportes',
      title: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: 'pi pi-chart-bar',
      iconClass: '',
      route: '/reportes',
      loading: false,
      stats: { value: '12', label: 'reportes' }
    },
    {
      id: 'inventario',
      title: 'Inventario',
      description: 'Control de stock y almacén',
      icon: 'pi pi-database',
      iconClass: '',
      route: '/inventario',
      loading: false,
      stats: { value: '98%', label: 'disponible' }
    },
    {
      id: 'categorias',
      title: 'Categorías',
      description: 'Organizar productos por categoría',
      icon: 'pi pi-tags',
      iconClass: '',
      route: '/categoria',
      loading: false,
      stats: { value: '24', label: 'categorías' }
    }
  ]);

  constructor() {
    this.companyForm = this.fb.group({
      name: ['Mi Empresa S.A.', [Validators.required, Validators.minLength(2)]],
      address: ['Av. Principal 123, Ciudad, País', [Validators.required]],
      phone: ['+1 (555) 123-4567', [Validators.required]],
      email: ['contacto@miempresa.com', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loaderService.hide();
    this.loadUserData();
    this.loadDashboardData();
  }

  private loadUserData() {
    this.authService.getSession().subscribe((session: any) => {
      if (session && session.username) {
        this.userName.set(session.username);
      }
    });
  }

  // Métodos para navegación
  navigateToModule(route: string): void {
    // Simular loading
    this.setItemLoading(route, true);

    setTimeout(() => {
      this.setItemLoading(route, false);
      this.router.navigate([route]);
    }, 800);
  }

  private setItemLoading(route: string, loading: boolean): void {
    this.quickAccessItems.update(items =>
      items.map(item =>
        item.route === route ? { ...item, loading } : item
      )
    );
  }

  // Método para cargar datos del dashboard
  private loadDashboardData(): void {
    // Aquí se cargarían los datos reales desde el servicio
    console.log('Cargando datos del dashboard...');
  }

  // TrackBy functions para optimizar el rendering
  trackByFn(index: number, item: QuickAccessItem): string {
    return item.id;
  }
}
