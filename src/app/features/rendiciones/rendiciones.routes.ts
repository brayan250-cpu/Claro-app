import { Routes } from '@angular/router';

export const RENDICIONES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'listado',
    loadComponent: () => import('./pages/listado-rendiciones/listado-rendiciones.component').then(m => m.ListadoRendicionesComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/formulario-rendicion/formulario-rendicion.component').then(m => m.FormularioRendicionComponent)
  },
  {
    path: 'formulario',
    loadComponent: () => import('./pages/formulario-rendicion/formulario-rendicion.component').then(m => m.FormularioRendicionComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/formulario-rendicion/formulario-rendicion.component').then(m => m.FormularioRendicionComponent)
  }
];
