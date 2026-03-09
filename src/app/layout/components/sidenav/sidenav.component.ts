import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AuthStore } from '../../../core/stores/auth.store';
import { UserRole } from '../../../models';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

/**
 * Componente Sidenav
 * Menú lateral de navegación
 */
@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatRippleModule
  ],
  template: `
    <div class="sidenav-container">
      <!-- Sección de módulos principales -->
      <div class="menu-section">
        <h3 class="section-header">
          <mat-icon>menu</mat-icon>
          MENÚ PRINCIPAL
        </h3>
        <nav class="menu-list">
          @for (item of mainMenuItems; track item.label) {
            @if (canShowMenuItem(item)) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="menu-button"
                (click)="onMenuItemClick()"
                matRipple
              >
                <mat-icon class="menu-icon">{{ item.icon }}</mat-icon>
                <span class="menu-label">{{ item.label }}</span>
                <mat-icon class="chevron-icon">chevron_right</mat-icon>
              </a>
            }
          }
        </nav>
      </div>

      <mat-divider></mat-divider>

      <!-- Sección de administración -->
      @if (isAdmin()) {
        <div class="menu-section">
          <h3 class="section-header">
            <mat-icon>admin_panel_settings</mat-icon>
            ADMINISTRACIÓN
          </h3>
          <nav class="menu-list">
            @for (item of adminMenuItems; track item.label) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="menu-button"
                (click)="onMenuItemClick()"
                matRipple
              >
                <mat-icon class="menu-icon">{{ item.icon }}</mat-icon>
                <span class="menu-label">{{ item.label }}</span>
                <mat-icon class="chevron-icon">chevron_right</mat-icon>
              </a>
            }
          </nav>
        </div>
      }
    </div>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
      background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
      overflow-y: auto;
      padding: 8px;
    }

    .menu-section {
      margin-bottom: 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #6c757d;
      letter-spacing: 1px;
      padding: 12px 12px 8px 12px;
      text-transform: uppercase;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--claro-primary);
      }
    }

    .menu-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 0;
    }

    .menu-button {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin: 0 4px;
      border-radius: 12px;
      background-color: #ffffff;
      border: 1.5px solid #e9ecef;
      color: var(--claro-text-primary);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .menu-icon {
        color: #6c757d;
        transition: all 0.3s ease;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .menu-label {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        transition: all 0.3s ease;
      }

      .chevron-icon {
        color: #adb5bd;
        font-size: 18px;
        width: 18px;
        height: 18px;
        opacity: 0;
        transform: translateX(-8px);
        transition: all 0.3s ease;
      }

      &:hover {
        background-color: #f8f9fa;
        border-color: #dee2e6;
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        .menu-icon {
          color: var(--claro-primary);
          transform: scale(1.1);
        }

        .menu-label {
          color: var(--claro-primary);
        }

        .chevron-icon {
          opacity: 1;
          transform: translateX(0);
          color: var(--claro-primary);
        }
      }

      &.active {
        background: linear-gradient(135deg, rgba(227, 6, 19, 0.1) 0%, rgba(227, 6, 19, 0.05) 100%);
        border-color: var(--claro-primary);
        border-width: 2px;
        box-shadow: 0 4px 16px rgba(227, 6, 19, 0.15);

        .menu-icon {
          color: var(--claro-primary);
          transform: scale(1.15);
          animation: pulse 2s infinite;
        }

        .menu-label {
          font-weight: 600;
          color: var(--claro-primary);
        }

        .chevron-icon {
          opacity: 1;
          transform: translateX(0);
          color: var(--claro-primary);
        }

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, var(--claro-primary) 0%, #c21807 100%);
          border-radius: 12px 0 0 12px;
        }
      }

      &:active {
        transform: translateX(2px) scale(0.98);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1.15);
      }
      50% {
        transform: scale(1.25);
      }
    }

    mat-divider {
      margin: 16px 8px;
      border-color: #dee2e6;
    }

    /* Responsive para móvil */
    @media (max-width: 768px) {
      .sidenav-container {
        padding: 12px;
      }

      .menu-button {
        padding: 14px 16px;
        margin: 0 2px;
        border-radius: 16px;

        .menu-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .menu-label {
          font-size: 15px;
        }

        &:hover {
          transform: translateX(6px);
        }

        &:active {
          transform: translateX(3px) scale(0.97);
        }
      }

      .section-header {
        padding: 16px 12px 12px 12px;
        font-size: 12px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    /* Scrollbar personalizado */
    .sidenav-container::-webkit-scrollbar {
      width: 6px;
    }

    .sidenav-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidenav-container::-webkit-scrollbar-thumb {
      background: #dee2e6;
      border-radius: 3px;
    }

    .sidenav-container::-webkit-scrollbar-thumb:hover {
      background: #adb5bd;
    }
  `]
})
export class SidenavComponent {
  @Output() menuItemClicked = new EventEmitter<void>();

  mainMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Mis Solicitudes', icon: 'list_alt', route: '/solicitudes/listado', roles: [UserRole.EMPLEADO, UserRole.ASISTENTE, UserRole.ADMIN] },
    { label: 'Nueva Solicitud', icon: 'add_circle', route: '/solicitudes/nueva', roles: [UserRole.EMPLEADO, UserRole.ASISTENTE, UserRole.ADMIN] },
    { label: 'Aprobaciones', icon: 'approval', route: '/aprobaciones', roles: [UserRole.APROBADOR_N1, UserRole.APROBADOR_N2, UserRole.ADMIN] },
    { label: 'Cotizaciones', icon: 'receipt', route: '/cotizaciones', roles: [UserRole.ASISTENTE, UserRole.ADMIN] },
    { label: 'Rendiciones', icon: 'receipt_long', route: '/rendiciones' },
    { label: 'Liquidaciones', icon: 'account_balance', route: '/liquidaciones', roles: [UserRole.OPERADOR_LIQ, UserRole.ADMIN] },
    { label: 'Reportes', icon: 'analytics', route: '/reportes' },
  ];

  adminMenuItems: MenuItem[] = [
    { label: 'Usuarios', icon: 'people', route: '/admin/usuarios' },
    { label: 'Catálogos', icon: 'category', route: '/admin/catalogos' },
    { label: 'Configuración', icon: 'settings', route: '/admin/configuracion' },
    { label: 'Auditoría', icon: 'history', route: '/admin/auditoria' },
  ];

  constructor(private authStore: AuthStore) {}

  canShowMenuItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    const userRole = this.authStore.userRole();
    return userRole ? item.roles.includes(userRole as UserRole) : false;
  }

  isAdmin(): boolean {
    return this.authStore.userRole() === UserRole.ADMIN;
  }

  onMenuItemClick() {
    this.menuItemClicked.emit();
  }
}
