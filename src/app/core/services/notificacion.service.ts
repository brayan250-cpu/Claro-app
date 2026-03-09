import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Notificacion, TipoNotificacion, UserRole } from '../../models';

/**
 * Servicio de Notificaciones
 * Gestiona notificaciones del usuario en tiempo real
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private notificacionesStore = signal<Notificacion[]>([]);

  // Computed para notificaciones no leídas
  readonly notificacionesNoLeidas = computed(() => 
    this.notificacionesStore().filter(n => !n.leida)
  );

  readonly contadorNoLeidas = computed(() => 
    this.notificacionesNoLeidas().length
  );

  constructor() {
    this.loadMockData();
  }

  /**
   * Carga datos mock por usuario
   */
  private loadMockData(): void {
    // Estos datos se cargarían según el usuario logueado
    // Por ahora son datos estáticos
    const mockNotificaciones: Notificacion[] = [];

    this.notificacionesStore.set(mockNotificaciones);
  }

  /**
   * Genera notificaciones según el usuario actual
   */
  generarNotificacionesPorUsuario(usuarioId: string, rol: string): void {
    const ahora = new Date();
    const notificaciones: Notificacion[] = [];

    // Notificaciones para EMPLEADO (id='1')
    if (usuarioId === '1') {
      notificaciones.push(
        {
          id: 'NOT-001',
          usuarioId: '1',
          tipo: TipoNotificacion.SOLICITUD_APROBADA,
          titulo: 'Solicitud Aprobada',
          mensaje: 'Tu solicitud SOL-2026-0001 (Lima) ha sido aprobada por dirección',
          fecha: new Date(ahora.getTime() - 2 * 60 * 60 * 1000), // hace 2 horas
          leida: false,
          link: '/solicitudes/detalle/SOL-001'
        },
        {
          id: 'NOT-002',
          usuarioId: '1',
          tipo: TipoNotificacion.RENDICION_REQUERIDA,
          titulo: 'Rendición Pendiente',
          mensaje: 'Recuerda completar la rendición de tu viaje a Lima antes del 25/03',
          fecha: new Date(ahora.getTime() - 24 * 60 * 60 * 1000), // hace 1 día
          leida: false,
          link: '/rendiciones/nueva'
        },
        {
          id: 'NOT-003',
          usuarioId: '1',
          tipo: TipoNotificacion.INFO,
          titulo: 'Bienvenido al Sistema',
          mensaje: 'Sistema de Gestión de Viajes CLARO actualizado a v2.0',
          fecha: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000), // hace 3 días
          leida: true
        }
      );
    }

    // Notificaciones para APROBADOR_N1 (id='2')
    if (usuarioId === '2' || rol === UserRole.APROBADOR_N1) {
      notificaciones.push(
        {
          id: 'NOT-010',
          usuarioId: '2',
          tipo: TipoNotificacion.APROBACION_PENDIENTE,
          titulo: 'Aprobación Requerida',
          mensaje: 'Ana Martínez solicita aprobación para viaje a Chiclayo (SOL-2026-0005)',
          fecha: new Date(ahora.getTime() - 30 * 60 * 1000), // hace 30 min
          leida: false,
          link: '/aprobaciones'
        },
        {
          id: 'NOT-011',
          usuarioId: '2',
          tipo: TipoNotificacion.APROBACION_PENDIENTE,
          titulo: 'Aprobación Requerida',
          mensaje: 'Luis Torres solicita aprobación para viaje a Ica (SOL-2026-0006)',
          fecha: new Date(ahora.getTime() - 60 * 60 * 1000), // hace 1 hora
          leida: false,
          link: '/aprobaciones'
        }
      );
    }

    // Notificaciones para APROBADOR_N2 (id='3')
    if (usuarioId === '3' || rol === UserRole.APROBADOR_N2) {
      notificaciones.push(
        {
          id: 'NOT-020',
          usuarioId: '3',
          tipo: TipoNotificacion.APROBACION_PENDIENTE,
          titulo: 'Aprobación Nivel 2 Requerida',
          mensaje: 'María García solicita aprobación final para viaje a Trujillo (SOL-2026-0003)',
          fecha: new Date(ahora.getTime() - 45 * 60 * 1000), // hace 45 min
          leida: false,
          link: '/aprobaciones'
        }
      );
    }

    // Notificaciones para ADMIN (id='4')
    if (usuarioId === '4' || rol === UserRole.ADMIN) {
      notificaciones.push(
        {
          id: 'NOT-030',
          usuarioId: '4',
          tipo: TipoNotificacion.INFO,
          titulo: 'Revisión Mensual',
          mensaje: '15 solicitudes pendientes de cierre contable para febrero 2026',
          fecha: new Date(ahora.getTime() - 2 * 60 * 60 * 1000), // hace 2 horas
          leida: false
        }
      );
    }

    // Notificaciones para ASISTENTE (id='5')
    if (usuarioId === '5' || rol === UserRole.ASISTENTE) {
      notificaciones.push(
        {
          id: 'NOT-040',
          usuarioId: '5',
          tipo: TipoNotificacion.INFO,
          titulo: 'Soporte Administrativo',
          mensaje: 'Evento regional en Ica confirmado para 10/03',
          fecha: new Date(ahora.getTime() - 5 * 60 * 60 * 1000), // hace 5 horas
          leida: true
        }
      );
    }

    this.notificacionesStore.set(notificaciones);
  }

  /**
   * Obtener todas las notificaciones del usuario
   */
  getAll(usuarioId: string): Observable<Notificacion[]> {
    return of(this.notificacionesStore()).pipe(delay(200));
  }

  /**
   * Obtener notificaciones no leídas
   */
  getNoLeidas(usuarioId: string): Observable<Notificacion[]> {
    return of(this.notificacionesNoLeidas()).pipe(delay(200));
  }

  /**
   * Marcar notificación como leída
   */
  marcarComoLeida(id: string): Observable<void> {
    const notificaciones = this.notificacionesStore();
    const updated = notificaciones.map(n => 
      n.id === id ? { ...n, leida: true } : n
    );
    this.notificacionesStore.set(updated);
    return of(void 0).pipe(delay(100));
  }

  /**
   * Marcar todas como leídas
   */
  marcarTodasComoLeidas(usuarioId: string): Observable<void> {
    const notificaciones = this.notificacionesStore();
    const updated = notificaciones.map(n => 
      n.usuarioId === usuarioId ? { ...n, leida: true } : n
    );
    this.notificacionesStore.set(updated);
    return of(void 0).pipe(delay(100));
  }

  /**
   * Eliminar notificación
   */
  eliminar(id: string): Observable<void> {
    const notificaciones = this.notificacionesStore();
    const filtered = notificaciones.filter(n => n.id !== id);
    this.notificacionesStore.set(filtered);
    return of(void 0).pipe(delay(100));
  }

  /**
   * Crear nueva notificación (para sistema)
   */
  crear(notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>): void {
    const nueva: Notificacion = {
      ...notificacion,
      id: `NOT-${Date.now()}`,
      fecha: new Date(),
      leida: false
    };

    const notificaciones = this.notificacionesStore();
    this.notificacionesStore.set([nueva, ...notificaciones]);
  }

  /**
   * Signal público de solo lectura
   */
  getNotificacionesSignal() {
    return this.notificacionesStore.asReadonly();
  }

  /**
   * Obtener contador de no leídas
   */
  getContadorNoLeidas() {
    return this.contadorNoLeidas;
  }
}
