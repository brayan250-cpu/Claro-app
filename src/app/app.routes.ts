import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Ruta por defecto → redirect a dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Login (sin auth)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // Rutas protegidas con MainLayout
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'solicitudes',
        loadChildren: () => import('./features/solicitudes/solicitudes.routes').then(m => m.SOLICITUDES_ROUTES)
      },
      {
        path: 'rendiciones',
        loadChildren: () => import('./features/rendiciones/rendiciones.routes').then(m => m.RENDICIONES_ROUTES)
      },
      {
        path: 'aprobaciones',
        loadComponent: () => import('./features/aprobaciones/aprobaciones.component').then(m => m.AprobacionesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      // TODO: Agregar rutas de otros módulos (FASE 4+)
    ]
  },

  // Ruta 404
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

