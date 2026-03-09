import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Servicio para mostrar notificaciones toast
 * Wrapper de MatSnackBar
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Muestra mensaje de éxito
   */
  success(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['toast-success']
    });
  }

  /**
   * Muestra mensaje de error
   */
  error(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['toast-error']
    });
  }

  /**
   * Muestra mensaje de advertencia
   */
  warning(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['toast-warning']
    });
  }

  /**
   * Muestra mensaje informativo
   */
  info(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['toast-info']
    });
  }
}
