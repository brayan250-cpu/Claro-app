import { Injectable } from '@angular/core';

/**
 * Servicio para manejo de LocalStorage
 * Proporciona persistencia de datos en el navegador
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly prefix = 'claro_viajes_';

  /**
   * Guarda un valor en LocalStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Obtiene un valor de LocalStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Elimina un valor de LocalStorage
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Limpia todos los valores del prefijo
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Verifica si existe una clave
   */
  has(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }
}
