import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { MenuItem, ConfirmationService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PopoverModule, Popover } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarService } from './services/sidebar.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { filter } from 'rxjs';

interface SidebarNavItem extends MenuItem {
  key: string;
  depth: number;
  items?: SidebarNavItem[];
}

@Component({
  imports: [NgClass, RouterLink, NgTemplateOutlet, AvatarModule, TooltipModule, ConfirmDialogModule, PopoverModule],
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  providers: [ConfirmationService]
})
export default class Sidebar {
  router = inject(Router);
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private confirmationService = inject(ConfirmationService);

  @ViewChild('op') popover!: Popover;

  collapsed = input(true);
  toggleSidebar = output();

  activeRoute = signal('');
  expandedKeys = signal<Record<string, boolean>>({});
  submenuOpen = signal(false);
  activeCollapsedRoot = signal<SidebarNavItem | null>(null);
  collapsedPanelItems = computed(() => this.activeCollapsedRoot()?.items ?? []);
  activeParentLabel = computed(() => this.activeCollapsedRoot()?.label ?? '');
  activeParentIcon = computed(() => this.activeCollapsedRoot()?.icon ?? '');
  menuTree = computed<SidebarNavItem[]>(() => this.buildMenuTree(this.menuItems));

  get menuItems(): MenuItem[] {
    return this.sidebarService.menuItems();
  }

  constructor() {
    this.activeRoute.set(this.router.url);

    this.sidebarService.loadMenu().subscribe({
      next: () => this.syncExpandedToActiveRoute(),
      error: (err) => console.error('Error loading sidebar menu', err)
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.activeRoute.set(this.router.url);
        this.syncExpandedToActiveRoute();
        this.closeCollapsedPanel();

        if (this.isMobileViewport() && !this.collapsed()) {
          this.toggleSidebar.emit();
        }
      });
  }

  onSidebarMouseLeave() {
    if (this.collapsed()) {
      this.closeCollapsedPanel();
    }
  }

  onItemClick(item: SidebarNavItem, event: Event, fromCollapsedPanel = false) {
    event.stopPropagation();

    if (this.hasChildren(item)) {
      if (this.collapsed() && !fromCollapsedPanel) {
        if (this.activeCollapsedRoot()?.key === item.key && this.submenuOpen()) {
          this.closeCollapsedPanel();
          return;
        }

        this.activeCollapsedRoot.set(item);
        this.submenuOpen.set(true);
      }

      this.setExpanded(item.key, !this.isItemOpen(item));
      return;
    }

    this.navigateTo(item.routerLink as string | undefined);
  }

  togglePopover(event: Event) {
    this.popover.toggle(event);
  }

  logout(event: Event) {
    if (this.popover) {
      this.popover.hide();
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar Salida',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.performLogout();
      }
    });
  }

  isItemOpen(item: SidebarNavItem): boolean {
    return Boolean(this.expandedKeys()[item.key]);
  }

  isItemActive(item: SidebarNavItem): boolean {
    if (this.isRouteActive(item.routerLink as string | undefined)) {
      return true;
    }

    return (item.items ?? []).some((child) => this.isItemActive(child));
  }

  hasChildren(item: SidebarNavItem): boolean {
    return Boolean(item.items && item.items.length > 0);
  }

  private performLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        this.router.navigate(['/login']).then(() => {
          window.location.reload();
        });
      }
    });
  }

  private isMobileViewport(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(max-width: 900px)').matches;
  }

  navigateSubItem(path: string) {
    this.navigateTo(path);
  }

  getChildren(item: SidebarNavItem): SidebarNavItem[] {
    return item.items ?? [];
  }

  private buildMenuTree(items: MenuItem[], depth = 1, parentKey = ''): SidebarNavItem[] {
    return items.map((item, index) => {
      const key = `${parentKey}${index}`;
      return {
        ...item,
        key,
        depth,
        items: item.items ? this.buildMenuTree(item.items, depth + 1, `${key}-`) : []
      };
    });
  }

  private syncExpandedToActiveRoute() {
    const path = this.findActivePath(this.menuTree());
    if (path.length === 0) {
      return;
    }

    const current = { ...this.expandedKeys() };
    for (const node of path.slice(0, -1)) {
      current[node.key] = true;
    }
    this.expandedKeys.set(current);
  }

  private findActivePath(items: SidebarNavItem[], trail: SidebarNavItem[] = []): SidebarNavItem[] {
    for (const item of items) {
      const nextTrail = [...trail, item];
      if (this.isRouteActive(item.routerLink as string | undefined)) {
        return nextTrail;
      }

      const children = item.items ?? [];
      if (children.length > 0) {
        const nested = this.findActivePath(children, nextTrail);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    return [];
  }

  private isRouteActive(path?: string): boolean {
    if (!path) {
      return false;
    }

    const current = this.normalizePath(this.activeRoute());
    const target = this.normalizePath(path);
    return current === target || current.startsWith(`${target}/`);
  }

  private normalizePath(path: string): string {
    return path.split('?')[0].split('#')[0];
  }

  private setExpanded(key: string, open: boolean) {
    const current = { ...this.expandedKeys() };
    current[key] = open;
    this.expandedKeys.set(current);
  }

  private closeCollapsedPanel() {
    this.submenuOpen.set(false);
    this.activeCollapsedRoot.set(null);
  }

  private navigateTo(path?: string) {
    if (path) {
      this.router.navigate([path]);
    }
    this.closeCollapsedPanel();
  }
}
