import { Injectable, signal, computed } from '@angular/core';
import { User, AuthSession } from '../../models';
import { StorageService } from '../services/storage.service';

/**
 * Store de Autenticación usando Signals
 * Maneja el estado global de autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  // Signals privados
  private readonly _session = signal<AuthSession | null>(null);
  private readonly _loading = signal<boolean>(false);

  // Signals públicos (readonly)
  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed signals
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly currentUser = computed(() => this._session()?.user ?? null);
  readonly userRole = computed(() => this._session()?.user.rol ?? null);

  constructor(private storageService: StorageService) {
    this.loadSessionFromStorage();
  }

  /**
   * Establece la sesión actual
   */
  setSession(session: AuthSession): void {
    this._session.set(session);
    this.storageService.set('auth_session', session);
  }

  /**
   * Limpia la sesión
   */
  clearSession(): void {
    this._session.set(null);
    this.storageService.remove('auth_session');
  }

  /**
   * Establece el estado de carga
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Carga la sesión desde LocalStorage
   */
  private loadSessionFromStorage(): void {
    const session = this.storageService.get<AuthSession>('auth_session');
    if (session) {
      // Validar que la sesión no haya expirado
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt > new Date()) {
        this._session.set(session);
      } else {
        this.clearSession();
      }
    }
  }

  /**
   * Recarga la sesión desde LocalStorage (útil para demos/testing)
   */
  reloadSession(): void {
    this.loadSessionFromStorage();
  }
}
