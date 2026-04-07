import { Component, signal, inject, OnInit, OnDestroy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TagModule } from 'primeng/tag';
import { ContextoOperativoService } from '@core/services/contexto-operativo.service';
import { JerarquiaAlmacen, JerarquiaSucursal } from '@core/models/auth.models';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { filter, interval, startWith, Subscription, switchMap } from 'rxjs';
import { LoaderService } from '@shared/services/loader.service';
import { GeneralService } from '@shared/services/general.service';
import { ResponseEmpresaAsignadaDto } from '@shared/domains/general.dto';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    ToolbarModule,
    BadgeModule,
    OverlayBadgeModule,
    MenuModule,
    AvatarModule,
    FloatLabelModule,
    BreadcrumbModule,
    TagModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loaderService = inject(LoaderService);
  private readonly generalService = inject(GeneralService);
  protected readonly contexto = inject(ContextoOperativoService);

  protected readonly cajaSeverity = computed(() =>
    this.authService.cajaAbierta() ? 'success' : 'danger'
  );
  protected readonly cajaLabel = computed(() =>
    this.authService.cajaAbierta() ? 'Caja Abierta' : 'Caja Cerrada'
  );
  protected readonly cajaIcon = computed(() =>
    this.authService.cajaAbierta() ? 'pi pi-lock-open' : 'pi pi-lock'
  );

  headerForm = new FormGroup({
    company: new FormControl<ResponseEmpresaAsignadaDto | null>(null),
    sucursal: new FormControl<JerarquiaSucursal | null>(null),
    almacen: new FormControl<JerarquiaAlmacen | null>(null)
  });

  // ! MENU
  userMenuItems: MenuItem[] = [];
  home = signal({
    icon: 'pi pi-home',
    routerLink: '/dashboard'
  });

  items = signal<{ label: string, routerLink: string }[]>([]);
  isHome = signal(false);

  lastSegment = computed(() => {
    if (this.isHome()) {
      return 'Inicio';
    }
    const currentItems = this.items();
    if (currentItems.length > 0) {
      return currentItems[currentItems.length - 1].label;
    }
    return '';
  });

  // ! SIDEBAR
  isSidebarCollapsed = input<boolean>(true);
  toggleSidebar = output();

  isCompact = signal(false);
  private responsiveMq: MediaQueryList | null = null;
  private responsiveMqHandler: ((e: MediaQueryListEvent) => void) | null = null;
  private estadoCajaSub: Subscription | null = null;

  // ! COMPANY
  companies = signal<ResponseEmpresaAsignadaDto[]>([]);
  selectedCompany: ResponseEmpresaAsignadaDto | null = null;

  ngOnInit() {
    this.initResponsiveState();
    this.loadUserCompanies();
    this.initContextoOperativo();

    this.updateBreadcrumbs();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumbs();
    });
  }

  ngOnDestroy(): void {
    if (!this.responsiveMq || !this.responsiveMqHandler) return;

    if (typeof this.responsiveMq.removeEventListener === 'function') {
      this.responsiveMq.removeEventListener('change', this.responsiveMqHandler);
    } else {
      this.responsiveMq.removeEventListener('change', this.responsiveMqHandler);
    }
    this.estadoCajaSub?.unsubscribe();
    this.estadoCajaSub = null;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onCompanyChange(event: any) {
    this.loaderService.show();
    const targetCompany = event.value;
    if (targetCompany && targetCompany.tenantId) {
      this.authService.switchCompany(targetCompany.tenantId).subscribe({
        next: () => {
          window.location.reload();
        },
        error: (err) => {
          this.loaderService.hide();
          console.error('Error switching company', err);
        }
      });
    }
  }

  onSucursalChange(event: any) {
    this.loaderService.show();
    const sucursal: JerarquiaSucursal = event.value;
    if (sucursal) {
      this.contexto.cambiarSucursal(sucursal);
    }
  }

  onAlmacenChange(event: any) {
    const almacen: JerarquiaAlmacen = event.value;
    if (almacen) {
      this.contexto.cambiarAlmacen(almacen);
    }
  }

  logout() {
    this.contexto.limpiar();
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  private loadUserCompanies() {
    this.generalService.getEmpresasAsignadas().subscribe(list => {
      this.companies.set(list.data);

      this.authService.getSession().subscribe(session => {
        if (session && session.tenantId) {
          const current = list.data.find((company: ResponseEmpresaAsignadaDto) => company.tenantId === session.tenantId);
          if (current) {
            this.selectedCompany = current;
            this.headerForm.get('company')?.setValue(current, { emitEvent: false });
          }
        }
      });
    });

    // Sincronizar cambios del formulario
    this.headerForm.get('company')?.valueChanges.subscribe(val => {
      if (val) this.onCompanyChange({ value: val });
    });

    this.headerForm.get('sucursal')?.valueChanges.subscribe(val => {
      if (val) this.onSucursalChange({ value: val });
    });

    this.headerForm.get('almacen')?.valueChanges.subscribe(val => {
      if (val) this.onAlmacenChange({ value: val });
    });
  }

  private initContextoOperativo() {
    this.authService.getSession().subscribe(session => {
      if (session?.jerarquia) {
        this.contexto.init(session.jerarquia).then(() => {
          // Sincronizar valores iniciales del contexto al formulario
          this.headerForm.patchValue({
            sucursal: this.contexto.selectedSucursal(),
            almacen: this.contexto.selectedAlmacen()
          }, { emitEvent: false });
        });
      }
    });
  }

  private updateBreadcrumbs() {
    const breadcrumbs: { label: string, routerLink: string }[] = [];
    let currentRoute = this.activatedRoute.root;
    let url = '';

    const currentUrl = this.router.url;
    const isHomePage = currentUrl === '/Inicio' || currentUrl === '/';
    this.isHome.set(isHomePage);

    if (isHomePage) {
      this.items.set([]);
      return;
    }

    while (currentRoute.children.length > 0) {
      const children = currentRoute.children;

      currentRoute = children.find(child => child.outlet === 'primary') || children[0];

      const routeConfig = currentRoute.snapshot.routeConfig;
      if (!routeConfig) continue;

      const path = routeConfig.path;

      if (path) {
        url += `/${path}`;
        const label = routeConfig.data?.['breadcrumb'] || this.capitalize(path);
        if (label) {
          breadcrumbs.push({
            label: label,
            routerLink: url
          });
        }
      }
    }
    this.items.set(breadcrumbs);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private initResponsiveState(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    this.responsiveMq = window.matchMedia('(max-width: 899.98px)');
    this.isCompact.set(this.responsiveMq.matches);

    this.responsiveMqHandler = (e: MediaQueryListEvent) => {
      this.isCompact.set(e.matches);
    };

    if (typeof this.responsiveMq.addEventListener === 'function') {
      this.responsiveMq.addEventListener('change', this.responsiveMqHandler);
    } else {
      this.responsiveMq.addListener(this.responsiveMqHandler);
    }
  }
}
