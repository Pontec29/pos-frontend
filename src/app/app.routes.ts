import { Routes } from '@angular/router';
import Layout from './layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login'),
    canActivate: [publicGuard],
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('@dashboard/dashboard') },
      {
        path: 'finanzas',
        children: [
          {
            path: 'cajas',
            children: [
              { path: 'reportes', loadComponent: () => import('@caja/reportes/reportes') },
              {
                path: 'apertura-cierre',
                loadComponent: () => import('@caja/apertura-caja/apertura-cierre'),
              },
            ],
          },
        ],
      },
      {
        path: 'ventas',
        children: [
          { path: 'reportes', loadComponent: () => import('@ventas/reportes/reportes') },
          { path: 'pos', loadComponent: () => import('@ventas/venta-rapida/venta-rapida.component') },
          {
            path: 'facturacion',
            loadComponent: () => import('@ventas/facturacion/facturacion.component'),
          },
          {
            path: 'listar-ventas',
            loadComponent: () => import('@ventas/lista-ventas/lista-ventas'),
          },
          { path: '', redirectTo: 'pos', pathMatch: 'full' },
        ],
      },
      { path: 'clientes', loadComponent: () => import('@clientes/clientes') },
      { path: 'proveedores', loadComponent: () => import('./features/proveedores/proveedores') },
      { path: 'sucursales', loadComponent: () => import('./features/configuracion/sucursales/sucursales') },
      // Módulo de Inventario
      {
        path: 'inventario',
        children: [
          {
            path: 'importacion-producto',
            loadComponent: () => import('@importacion-producto/importacion-producto'),
          },
          { path: 'productos', loadComponent: () => import('@inventario/productos/productos') },
          {
            path: 'producto/nuevo',
            loadComponent: () =>
              import('@inventario/productos/components/new-producto/new-producto'),
          },
          {
            path: 'producto/editar/:codigoBarras',
            loadComponent: () =>
              import('@inventario/productos/components/new-producto/new-producto'),
          },
          {
            path: 'nuevo-ingreso',
            loadComponent: () => import('./features/inventario/nuevo-ingreso/nuevo-ingreso'),
          },
          {
            path: 'nuevo-ingreso/nuevo',
            loadComponent: () =>
              import('./features/inventario/nuevo-ingreso/components/form-ingreso/form-ingreso'),
          },
          {
            path: 'nuevo-ingreso/ver/:id',
            loadComponent: () =>
              import('./features/inventario/nuevo-ingreso/components/form-ingreso/form-ingreso'),
          },
          {
            path: 'nuevo-egreso',
            loadComponent: () => import('./features/inventario/nuevo-egreso/nuevo-egreso'),
          },
          {
            path: 'nuevo-egreso/nuevo',
            loadComponent: () =>
              import('./features/inventario/nuevo-egreso/components/form-egreso/form-egreso'),
          },
          {
            path: 'nuevo-egreso/ver/:id',
            loadComponent: () =>
              import('./features/inventario/nuevo-egreso/components/form-egreso/form-egreso'),
          },
          { path: 'categorias', loadComponent: () => import('@inventario/categoria/categoria') },
          { path: 'lotes', loadComponent: () => import('./features/inventario/lotes/lotes') },
          { path: 'alertas', loadComponent: () => import('./features/inventario/alertas/alertas') },
          { path: 'marcas', loadComponent: () => import('./features/inventario/marca/marca') },
          {
            path: 'resumen-stock',
            loadComponent: () =>
              import('./features/reportes/inventario-valorizado/inventario-valorizado'),
          },
          {
            path: 'kardex-fisico',
            loadComponent: () =>
              import('./features/reportes/auditoria-kardex/kardex-fisico/kardex-fisico'),
          },
          {
            path: 'kardex-valorizado',
            loadComponent: () =>
              import('./features/reportes/auditoria-kardex/kardex-valorizado/kardex-valorizado'),
          },
          { path: '', redirectTo: 'productos', pathMatch: 'full' },
        ],
      },
      // Módulo de Compras
      {
        path: 'compras',
        children: [
          { path: '', loadComponent: () => import('@compras/compras') },
          {
            path: 'nueva',
            loadComponent: () => import('@compras/components/nueva-compra/nueva-compra'),
          },
          {
            path: 'proveedores',
            loadComponent: () => import('./features/proveedores/proveedores'),
          },
        ],
      },
      // Configuración
      {
        path: 'configuracion',
        children: [
          {
            path: 'usuarios',
            loadComponent: () => import('./features/configuracion/usuarios/usuarios'),
          },
          {
            path: 'empresas',
            loadComponent: () => import('./features/configuracion/empresas/empresas'),
          },
          {
            path: 'menu-empresa/:id',
            loadComponent: () => import('./features/configuracion/menu-empresa/menu-empresa'),
          },
          { path: 'almacenes', loadComponent: () => import('./features/configuracion/almacenes/almacenes') },
          { path: 'sucursales', loadComponent: () => import('./features/configuracion/sucursales/sucursales') },
          {
            path: 'unidades-medida',
            loadComponent: () => import('./features/configuracion/unidades-medida/unidades-medida'),
          },
          { path: 'roles', loadComponent: () => import('./features/configuracion/roles/roles') },
          {
            path: 'permisos',
            loadComponent: () => import('./features/configuracion/permisos/permisos.component'),
          },
          // Configuración de Farmacia
          {
            path: 'laboratorios',
            loadComponent: () => import('./features/configuracion/laboratorios/laboratorios'),
          },
          {
            path: 'acciones-farmacologicas',
            loadComponent: () =>
              import('./features/configuracion/acciones-farmacologicas/acciones-farmacologicas'),
          },
          {
            path: 'principios-activos',
            loadComponent: () =>
              import('./features/configuracion/principios-activos/principios-activos'),
          },
          { path: '', redirectTo: 'general', pathMatch: 'full' },
        ],
      },
      // Recursos Humanos
      {
        path: 'recursos-humanos',
        children: [
          { path: 'cargos', loadComponent: () => import('./features/recursos-humanos/cargos/cargos') },
          { path: 'empleados', loadComponent: () => import('./features/recursos-humanos/empleados/empleados') },
          { path: 'empleados/nuevo', loadComponent: () => import('./features/recursos-humanos/empleados/components/new-empleado/new-empleado') },
          { path: 'empleados/ver/:id', loadComponent: () => import('./features/recursos-humanos/empleados/components/new-empleado/new-empleado') },
          { path: 'empleados/editar/:id', loadComponent: () => import('./features/recursos-humanos/empleados/components/new-empleado/new-empleado') },
          { path: '', redirectTo: 'empleados', pathMatch: 'full' }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' },
];
