import { Component, EventEmitter, Output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserRole, Notificacion } from '../../../models';

/**
 * Componente Header
 * Barra superior de navegación
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-toolbar class="header-toolbar">
      <!-- Logo y título -->
      <button mat-icon-button (click)="toggleSidebar.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      
      <div class="logo-section">
        <img class="logo-claro" src="assets/branding/logo-claro-rojo.svg" alt="Claro" />
        <span class="app-title">Gestión de Viajes</span>
      </div>

      <span class="spacer"></span>

      <!-- Búsqueda (placeholder) -->
      <button mat-icon-button>
        <mat-icon>search</mat-icon>
      </button>

      <!-- Notificaciones -->
      <button mat-icon-button [matMenuTriggerFor]="notificationMenu">
        <mat-icon 
          [matBadge]="contadorNotificaciones()" 
          [matBadgeHidden]="contadorNotificaciones() === 0"
          matBadgeColor="warn"
          matBadgeSize="small">
          notifications
        </mat-icon>
      </button>

      <!-- Menú de usuario -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-button">
        @if (currentUser()?.avatar) {
          <img [src]="currentUser()?.avatar" alt="Avatar" class="user-avatar" />
        } @else {
          <mat-icon>account_circle</mat-icon>
        }
      </button>
    </mat-toolbar>

    <!-- Menú de notificaciones -->
    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="menu-header" (click)="$event.stopPropagation()">
        <h3>Notificaciones</h3>
        @if (notificaciones().length > 0) {
          <button mat-button (click)="marcarTodasLeidas()">
            Marcar todas leídas
          </button>
        }
      </div>
      
      @if (notificaciones().length === 0) {
        <div class="empty-notifications">
          <mat-icon>notifications_none</mat-icon>
          <p>No hay notificaciones nuevas</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notif of notificaciones(); track notif.id) {
            <button 
              mat-menu-item 
              class="notification-item"
              [class.unread]="!notif.leida"
              (click)="verNotificacion(notif)">
              <div class="notification-content">
                <mat-icon [class]="getTipoIcon(notif.tipo).class">
                  {{ getTipoIcon(notif.tipo).icon }}
                </mat-icon>
                <div class="notification-text">
                  <span class="notification-title">{{ notif.titulo }}</span>
                  <span class="notification-message">{{ notif.mensaje }}</span>
                  <span class="notification-time">{{ getTimeAgo(notif.fecha) }}</span>
                </div>
              </div>
            </button>
          }
        </div>
      }
    </mat-menu>

    <!-- Menú de usuario -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <div class="user-menu-header">
        @if (currentUser()?.avatar) {
          <img [src]="currentUser()?.avatar" alt="Avatar" class="menu-avatar" />
        }
        <div class="user-info">
          <p class="user-name">{{ currentUser()?.nombreCompleto }}</p>
          <p class="user-role">{{ currentUser()?.rol }}</p>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item>
        <mat-icon>person</mat-icon>
        <span>Mi Perfil</span>
      </button>
      <button mat-menu-item>
        <mat-icon>settings</mat-icon>
        <span>Configuración</span>
      </button>
      <mat-divider></mat-divider>
      
      <!-- Demo: Selector de Rol -->
      <div class="role-selector">
        <div class="role-selector-header">
          <mat-icon>swap_horiz</mat-icon>
          <span>Demo: Cambiar Rol</span>
        </div>
        <div class="role-chips">
          <mat-chip-option (click)="switchRole('EMPLEADO')" [selected]="currentUser()?.rol === UserRole.EMPLEADO">
            <mat-icon>person</mat-icon>
            Empleado
          </mat-chip-option>
          <mat-chip-option (click)="switchRole('APROBADOR_N1')" [selected]="currentUser()?.rol === UserRole.APROBADOR_N1">
            <mat-icon>approval</mat-icon>
            Aprobador N1
          </mat-chip-option>
          <mat-chip-option (click)="switchRole('APROBADOR_N2')" [selected]="currentUser()?.rol === UserRole.APROBADOR_N2">
            <mat-icon>verified</mat-icon>
            Aprobador N2
          </mat-chip-option>
          <mat-chip-option (click)="switchRole('ADMIN')" [selected]="currentUser()?.rol === UserRole.ADMIN">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin
          </mat-chip-option>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Cerrar Sesión</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background-color: white !important;
      color: #333 !important;
      border-bottom: 1px solid #e0e0e0;

      ::ng-deep {
        button {
          color: #666;

          &:hover {
            color: #E2231A;
          }
        }

        mat-icon {
          color: #666;
        }
      }
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 8px;

      .logo-claro {
        height: 30px;
        width: auto;
        max-width: 118px;
        object-fit: contain;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          height: 26px;
          max-width: 102px;
        }

        @media (max-width: 480px) {
          height: 24px;
          max-width: 94px;
        }
      }

      .app-title {
        font-size: 14px;
        color: #666;
        font-weight: 500;
        border-left: 1px solid #e0e0e0;
        padding-left: 12px;

        @media (max-width: 768px) {
          display: none;
        }
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-button mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    ::ng-deep .notification-menu,
    ::ng-deep .user-menu {
      .mat-mdc-menu-content {
        padding: 0;
      }

      .menu-header {
        padding: 16px;
        background-color: var(--claro-bg-light);
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--claro-text-primary);
        }

        button {
          font-size: 12px;
        }
      }

      .empty-notifications {
        text-align: center;
        padding: 32px;
        color: var(--claro-text-tertiary);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.5;
        }

        p {
          margin: 8px 0 0 0;
          font-size: 14px;
        }
      }

      .notifications-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px 0;

        .notification-item {
          width: 100%;
          height: auto;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;

          &:hover {
            background-color: #f5f5f5;
          }

          &.unread {
            background-color: #e3f2fd;

            &:hover {
              background-color: #bbdefb;
            }

            .notification-title {
              font-weight: 600;
            }
          }

          .notification-content {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            width: 320px;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
              margin-top: 2px;
              flex-shrink: 0;

              &.icon-success {
                color: #4caf50;
              }

              &.icon-warning {
                color: #ff9800;
              }

              &.icon-error {
                color: #f44336;
              }

              &.icon-info {
                color: #2196f3;
              }
            }

            .notification-text {
              display: flex;
              flex-direction: column;
              gap: 4px;
              flex: 1;
              min-width: 0;

              .notification-title {
                font-size: 13px;
                color: var(--claro-text-primary);
                margin: 0;
              }

              .notification-message {
                font-size: 12px;
                color: var(--claro-text-secondary);
                margin: 0;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
              }

              .notification-time {
                font-size: 11px;
                color: var(--claro-text-tertiary);
                margin-top: 2px;
              }
            }
          }
        }
      }

      .user-menu-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background-color: var(--claro-bg-light);

        .menu-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          .user-name {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--claro-text-primary);
          }

          .user-role {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: var(--claro-text-secondary);
          }
        }
      }

      mat-divider {
        margin: 0;
      }

      button[mat-menu-item] {
        padding: 12px 16px;

        mat-icon {
          margin-right: 12px;
          color: var(--claro-text-secondary);
        }
      }
      
      .role-selector {
        padding: 12px 16px;
        background-color: #f5f5f5;
        
        .role-selector-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--claro-text-secondary);
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
        
        .role-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          mat-chip-option {
            font-size: 12px;
            height: 32px;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
            
            &[aria-selected="true"] {
              background-color: #D32F2F;
              color: white;
            }
          }
        }
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser = this.authStore.currentUser;
  notificaciones = signal<Notificacion[]>([]);
  contadorNotificaciones = computed(() => this.notificaciones().filter(n => !n.leida).length);
  
  // Exponer el enum para el template
  readonly UserRole = UserRole;
  
  @Output() toggleSidebar = new EventEmitter<void>();

  // Usuarios mock para cambio de rol
  private readonly mockUsers = [
    { username: 'empleado1', rol: UserRole.EMPLEADO, nombre: 'Juan Pérez' },
    { username: 'aprobador1', rol: UserRole.APROBADOR_N1, nombre: 'María García' },
    { username: 'aprobador2', rol: UserRole.APROBADOR_N2, nombre: 'Carlos Rodríguez' },
    { username: 'admin', rol: UserRole.ADMIN, nombre: 'Ana Martínez' }
  ];

  constructor(
    private authStore: AuthStore,
    private authService: AuthService,
    private notificacionService: NotificacionService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    const user = this.authStore.currentUser();
    if (user) {
      // Generar notificaciones según el usuario y rol
      this.notificacionService.generarNotificacionesPorUsuario(user.id, user.rol);
      
      // Cargar notificaciones
      this.notificacionService.getAll(user.id).subscribe(notifs => {
        this.notificaciones.set(notifs);
      });
    }
  }

  /**
   * Cambia el rol del usuario actual (solo para demo)
   */
  switchRole(newRole: string): void {
    const userMock = this.mockUsers.find(u => u.rol === newRole);
    if (!userMock) return;

    // Hacer login con el nuevo usuario
    this.authService.login(userMock.username, 'demo').subscribe({
      next: (session) => {
        this.toastService.success(`Rol cambiado a: ${this.getRoleLabel(newRole)}`);
        
        // Recargar la página para actualizar permisos en toda la app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: (err) => {
        console.error('Error al cambiar rol:', err);
        this.toastService.error('Error al cambiar el rol');
      }
    });
  }

  /**
   * Obtiene la etiqueta legible del rol
   */
  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'EMPLEADO': 'Empleado',
      'APROBADOR_N1': 'Aprobador Nivel 1',
      'APROBADOR_N2': 'Aprobador Nivel 2',
      'ADMIN': 'Administrador'
    };
    return labels[role] || role;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.toastService.success('Sesión cerrada correctamente');
      this.router.navigate(['/login']);
    });
  }

  /**
   * Ver notificación y marcar como leída
   */
  verNotificacion(notif: Notificacion): void {
    if (!notif.leida) {
      this.notificacionService.marcarComoLeida(notif.id).subscribe(() => {
        this.cargarNotificaciones();
      });
    }

    if (notif.link) {
      this.router.navigate([notif.link]);
    }
  }

  /**
   * Marcar todas como leídas
   */
  marcarTodasLeidas(): void {
    const user = this.authStore.currentUser();
    if (user) {
      this.notificacionService.marcarTodasComoLeidas(user.id).subscribe(() => {
        this.cargarNotificaciones();
        this.toastService.success('Todas las notificaciones marcadas como leídas');
      });
    }
  }

  /**
   * Obtiene el icono según el tipo de notificación
   */
  getTipoIcon(tipo: string): { icon: string; class: string } {
    switch (tipo) {
      case 'APROBACION_PENDIENTE':
        return { icon: 'pending_actions', class: 'icon-warning' };
      case 'SOLICITUD_APROBADA':
        return { icon: 'check_circle', class: 'icon-success' };
      case 'SOLICITUD_RECHAZADA':
        return { icon: 'cancel', class: 'icon-error' };
      case 'RENDICION_REQUERIDA':
        return { icon: 'receipt', class: 'icon-info' };
      case 'INFO':
      default:
        return { icon: 'info', class: 'icon-info' };
    }
  }

  /**
   * Convierte fecha a tiempo relativo
   */
  getTimeAgo(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  }
}
