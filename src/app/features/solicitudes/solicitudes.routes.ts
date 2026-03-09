import { Routes } from '@angular/router';

export const SOLICITUDES_ROUTES: Routes = [
  {
    path: 'listado',
    loadComponent: () =>
      import('./pages/listado-solicitudes/listado-solicitudes.component').then(
        (m) => m.ListadoSolicitudesComponent
      )
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/formulario-solicitud/formulario-solicitud.component').then(
        (m) => m.FormularioSolicitudComponent
      )
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/formulario-solicitud/formulario-solicitud.component').then(
        (m) => m.FormularioSolicitudComponent
      )
  },
  {
    path: 'detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-solicitud/detalle-solicitud.component').then(
        (m) => m.DetalleSolicitudComponent
      )
  },
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  }
];
