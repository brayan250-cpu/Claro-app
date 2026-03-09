import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Guard de autenticación
 * Protege rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Redirigir al login
  return router.createUrlTree(['/login']);
};

/**
 * Guard de rol
 * Protege rutas según el rol del usuario
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    const userRole = authStore.userRole();

    if (!userRole) {
      return router.createUrlTree(['/login']);
    }

    if (allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirigir a página no autorizada o dashboard
    return router.createUrlTree(['/dashboard']);
  };
};
