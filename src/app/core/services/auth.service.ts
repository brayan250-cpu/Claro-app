import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole, AuthSession } from '../../models';
import { AuthStore } from '../stores/auth.store';

/**
 * Servicio de Autenticación (Mock)
 * Simula autenticación contra un backend
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Usuarios mock para demo
  private mockUsers: User[] = [
    {
      id: '1',
      username: 'empleado1',
      email: 'empleado1@claro.pe',
      nombreCompleto: 'Juan Pérez',
      rol: UserRole.EMPLEADO,
      centroCosto: 'CC-001',
      departamento: 'Ventas',
      avatar: 'https://i.pravatar.cc/150?img=12',
      activo: true
    },
    {
      id: '2',
      username: 'aprobador1',
      email: 'aprobador1@claro.pe',
      nombreCompleto: 'María García',
      rol: UserRole.APROBADOR_N1,
      centroCosto: 'CC-002',
      departamento: 'Gerencia Ventas',
      avatar: 'https://i.pravatar.cc/150?img=47',
      activo: true
    },
    {
      id: '3',
      username: 'aprobador2',
      email: 'aprobador2@claro.pe',
      nombreCompleto: 'Carlos Rodríguez',
      rol: UserRole.APROBADOR_N2,
      centroCosto: 'CC-003',
      departamento: 'Dirección Regional',
      avatar: 'https://i.pravatar.cc/150?img=33',
      activo: true
    },
    {
      id: '4',
      username: 'admin',
      email: 'admin@claro.pe',
      nombreCompleto: 'Ana Martínez',
      rol: UserRole.ADMIN,
      centroCosto: 'CC-000',
      departamento: 'TI',
      avatar: 'https://i.pravatar.cc/150?img=45',
      activo: true
    },
    {
      id: '5',
      username: 'asistente',
      email: 'asistente@claro.pe',
      nombreCompleto: 'Luis Torres',
      rol: UserRole.ASISTENTE,
      centroCosto: 'CC-001',
      departamento: 'Administración',
      avatar: 'https://i.pravatar.cc/150?img=68',
      activo: true
    }
  ];

  constructor(private authStore: AuthStore) {}

  /**
   * Login con credenciales mock
   */
  login(username: string, password: string): Observable<AuthSession> {
    this.authStore.setLoading(true);

    // Simular llamada HTTP con delay
    return of(null).pipe(
      delay(800),
      map(() => {
        // Validar credenciales (cualquier password funciona en mock)
        const user = this.mockUsers.find(u => u.username === username);
        
        if (!user || !password) {
          this.authStore.setLoading(false);
          throw new Error('Credenciales inválidas');
        }

        // Crear sesión
        const session: AuthSession = {
          user,
          token: 'mock-jwt-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 horas
        };

        this.authStore.setSession(session);
        this.authStore.setLoading(false);

        return session;
      })
    );
  }

  /**
   * Logout
   */
  logout(): Observable<void> {
    return of(null).pipe(
      delay(300),
      map(() => {
        this.authStore.clearSession();
      })
    );
  }

  /**
   * Obtiene usuario actual
   */
  getCurrentUser(): User | null {
    return this.authStore.currentUser();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  /**
   * Obtiene todos los usuarios mock (para demo)
   */
  getMockUsers(): User[] {
    return [...this.mockUsers];
  }
}
