import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthStore } from '../../core/stores/auth.store';
import { SolicitudService } from '../../core/services/solicitud.service';
import { RendicionService } from '../../core/services/rendicion.service';
import { EstadoSolicitud, EstadoRendicion, Solicitud, Rendicion, UserRole } from '../../models';

/**
 * Componente Dashboard (P-GEN-002)
 * Página de inicio después del login
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <h1>Bienvenido, {{ currentUser()?.nombreCompleto }}</h1>
          <p class="subtitle">Sistema de Gestión de Viajes CLARO</p>
        </div>
        <div class="quick-actions">
          <button mat-fab color="primary" (click)="navigateTo('/solicitudes/nueva')" matTooltip="Nueva Solicitud">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card clickable" (click)="navigateTo('/solicitudes/listado')">
          <mat-card-content>
            <div class="stat-icon primary">
              <mat-icon>flight_takeoff</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalSolicitudesActivas() }}</span>
              <span class="stat-label">Solicitudes Activas</span>
            </div>
          </mat-card-content>
        </mat-card>

        @if (isAprobador()) {
          <mat-card class="stat-card clickable pulse" (click)="navigateTo('/aprobaciones')">
            <mat-card-content>
              <div class="stat-icon accent">
                <mat-icon>approval</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-number">{{ totalAprobacionesPendientes() }}</span>
                <span class="stat-label">Aprobaciones Pendientes</span>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <mat-card class="stat-card clickable" (click)="navigateTo('/rendiciones/listado')">
          <mat-card-content>
            <div class="stat-icon success">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalRendicionesPendientes() }}</span>
              <span class="stat-label">Rendiciones Pendientes</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon info">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ montoTotalGastado() | number:'1.2-2' }}</span>
              <span class="stat-label">Total Gastado (PEN)</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-content">
        <!-- Columna Izquierda -->
        <div class="left-column">
          <!-- Últimas Solicitudes -->
          <mat-card class="section-card">
            <mat-card-content>
              <div class="section-header">
                <h2><mat-icon>flight_takeoff</mat-icon> Últimas Solicitudes</h2>
                <button mat-button (click)="navigateTo('/solicitudes/listado')">Ver todas</button>
              </div>

              @if (ultimasSolicitudes().length === 0) {
                <div class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <p>No hay solicitudes recientes</p>
                  <button mat-raised-button color="primary" (click)="navigateTo('/solicitudes/nueva')">
                    <mat-icon>add</mat-icon>
                    Crear Solicitud
                  </button>
                </div>
              } @else {
                <div class="solicitudes-list">
                  @for (sol of ultimasSolicitudes(); track sol.id) {
                    <div class="solicitud-item" (click)="navigateTo('/solicitudes/detalle/' + sol.id)">
                      <div class="item-header">
                        <span class="item-code">{{ sol.codigo }}</span>
                        <mat-chip [class]="getEstadoClass(sol.estado)">
                          {{ getEstadoLabel(sol.estado) }}
                        </mat-chip>
                      </div>
                      <div class="item-body">
                        <h4>{{ sol.destino }}</h4>
                        <p>{{ sol.motivoViaje }}</p>
                      </div>
                      <div class="item-footer">
                        <span><mat-icon>calendar_today</mat-icon> {{ formatDate(sol.fechaSalida) }}</span>
                        <span><mat-icon>attach_money</mat-icon> {{ sol.presupuestoTotal | number:'1.0-0' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Breakdown de Gastos -->
          <mat-card class="section-card">
            <mat-card-content>
              <div class="section-header">
                <h2><mat-icon>pie_chart</mat-icon> Gastos por Categoría</h2>
              </div>

              @if (gastosPorCategoria().length === 0) {
                <div class="empty-state-small">
                  <mat-icon>pie_chart_outline</mat-icon>
                  <p>Sin gastos registrados</p>
                </div>
              } @else {
                <div class="category-breakdown">
                  @for (cat of gastosPorCategoria(); track cat.categoria) {
                    <div class="category-item">
                      <div class="category-header">
                        <span class="category-name">
                          <mat-icon>{{ getCategoriaIcon(cat.categoria) }}</mat-icon>
                          {{ cat.categoria }}
                        </span>
                        <span class="category-amount">S/ {{ cat.total | number:'1.2-2' }}</span>
                      </div>
                      <div class="category-bar">
                        <div class="bar-fill" [style.width.%]="cat.porcentaje"></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Columna Derecha -->
        <div class="right-column">
          <!-- Últimas Rendiciones -->
          <mat-card class="section-card">
            <mat-card-content>
              <div class="section-header">
                <h2><mat-icon>receipt</mat-icon> Últimas Rendiciones</h2>
                <button mat-button (click)="navigateTo('/rendiciones/listado')">Ver todas</button>
              </div>

              @if (ultimasRendiciones().length === 0) {
                <div class="empty-state-small">
                  <mat-icon>receipt_long</mat-icon>
                  <p>No hay rendiciones registradas</p>
                </div>
              } @else {
                <div class="rendiciones-list">
                  @for (ren of ultimasRendiciones(); track ren.id) {
                    <div class="rendicion-item">
                      <div class="rendicion-icon" [class]="'cat-' + ren.categoria.toLowerCase()">
                        <mat-icon>{{ getCategoriaIcon(ren.categoria) }}</mat-icon>
                      </div>
                      <div class="rendicion-info">
                        <span class="rendicion-concepto">{{ ren.concepto }}</span>
                        <span class="rendicion-fecha">{{ formatDate(ren.fecha) }}</span>
                      </div>
                      <div class="rendicion-monto">
                        <span class="monto">S/ {{ ren.monto | number:'1.2-2' }}</span>
                        <mat-chip [class]="getEstadoRendicionClass(ren.estado)" class="small-chip">
                          {{ ren.estado }}
                        </mat-chip>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Quick Info -->
          <mat-card class="section-card info-card-compact">
            <mat-card-content>
              <h2><mat-icon>person</mat-icon> Mi Información</h2>
              <div class="info-grid">
                <div class="info-item">
                  <mat-icon>badge</mat-icon>
                  <div>
                    <span class="info-label">Rol</span>
                    <span class="info-value">{{ getRolLabel(currentUser()?.rol) }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <mat-icon>business</mat-icon>
                  <div>
                    <span class="info-label">Departamento</span>
                    <span class="info-value">{{ currentUser()?.departamento }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <mat-icon>account_balance</mat-icon>
                  <div>
                    <span class="info-label">Centro de Costo</span>
                    <span class="info-value">{{ currentUser()?.centroCosto }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;

      h1 {
        font-size: 32px;
        font-weight: 600;
        color: var(--claro-text-primary);
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 16px;
        color: var(--claro-text-secondary);
        margin: 0;
      }

      .quick-actions {
        display: flex;
        gap: 12px;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s, box-shadow 0.2s;

      &.clickable {
        cursor: pointer;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        &:active {
          transform: translateY(-2px);
        }
      }

      &.pulse {
        animation: pulse 2s ease-in-out infinite;
      }

      mat-card-content {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }

        &.primary {
          background: linear-gradient(135deg, #D32F2F 0%, #E91E63 100%);
        }

        &.accent {
          background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%);
        }

        &.success {
          background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
        }

        &.info {
          background: linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%);
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-number {
          font-size: 36px;
          font-weight: 700;
          color: var(--claro-text-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: var(--claro-text-secondary);
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      50% {
        box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
      }
    }

    .dashboard-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .section-card {
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--claro-text-primary);
        margin: 0 0 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: var(--claro-primary);
        }
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
          margin: 0;
        }

        button {
          font-size: 13px;
        }
      }
    }

    .solicitudes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .solicitud-item {
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #f5f5f5;
        border-color: var(--claro-primary);
        transform: translateX(4px);
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .item-code {
          font-size: 13px;
          font-weight: 600;
          color: var(--claro-primary);
        }
      }

      .item-body {
        margin-bottom: 10px;

        h4 {
          font-size: 15px;
          font-weight: 600;
          color: var(--claro-text-primary);
          margin: 0 0 4px 0;
        }

        p {
          font-size: 13px;
          color: var(--claro-text-secondary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .item-footer {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--claro-text-tertiary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    .category-breakdown {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-item {
      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .category-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--claro-text-primary);
          display: flex;
          align-items: center;
          gap: 8px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: var(--claro-primary);
          }
        }

        .category-amount {
          font-size: 14px;
          font-weight: 600;
          color: var(--claro-text-primary);
        }
      }

      .category-bar {
        height: 8px;
        background-color: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--claro-primary) 0%, #E91E63 100%);
          transition: width 0.6s ease-out;
          border-radius: 4px;
        }
      }
    }

    .rendiciones-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rendicion-item {
      padding: 12px;
      border-radius: 8px;
      background-color: #fafafa;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f0f0f0;
      }

      .rendicion-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
          color: white;
        }

        &.cat-transporte {
          background-color: #2196F3;
        }

        &.cat-hospedaje {
          background-color: #9C27B0;
        }

        &.cat-alimentacion {
          background-color: #FF9800;
        }

        &.cat-otros {
          background-color: #607D8B;
        }
      }

      .rendicion-info {
        flex: 1;
        min-width: 0;

        .rendicion-concepto {
          font-size: 13px;
          font-weight: 500;
          color: var(--claro-text-primary);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rendicion-fecha {
          font-size: 12px;
          color: var(--claro-text-tertiary);
          display: block;
          margin-top: 2px;
        }
      }

      .rendicion-monto {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;

        .monto {
          font-size: 14px;
          font-weight: 600;
          color: var(--claro-text-primary);
        }

        .small-chip {
          font-size: 10px;
          height: 20px;
          padding: 0 8px;
        }
      }
    }

    .info-card-compact {
      h2 {
        font-size: 16px;
        margin-bottom: 16px;
      }

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
          color: var(--claro-primary);
        }

        div {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .info-label {
            font-size: 11px;
            color: var(--claro-text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: var(--claro-text-primary);
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--claro-text-tertiary);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
      }

      p {
        margin: 16px 0 24px 0;
        font-size: 14px;
      }
    }

    .empty-state-small {
      text-align: center;
      padding: 32px 16px;
      color: var(--claro-text-tertiary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.3;
      }

      p {
        margin: 12px 0 0 0;
        font-size: 13px;
      }
    }

    // Chips de estado
    ::ng-deep mat-chip {
      &.chip-success {
        background-color: #E8F5E9 !important;
        color: #2E7D32 !important;
      }

      &.chip-warning {
        background-color: #FFF3E0 !important;
        color: #E65100 !important;
      }

      &.chip-error {
        background-color: #FFEBEE !important;
        color: #C62828 !important;
      }

      &.chip-info {
        background-color: #E3F2FD !important;
        color: #1565C0 !important;
      }

      &.chip-default {
        background-color: #F5F5F5 !important;
        color: #616161 !important;
      }
    }

    @media (max-width: 1024px) {
      .dashboard-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;

        h1 {
          font-size: 24px;
        }
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card mat-card-content {
        padding: 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser = this.authStore.currentUser;

  // Signals para contadores
  solicitudes = signal<Solicitud[]>([]);
  rendiciones = signal<Rendicion[]>([]);

  // Computed para contadores
  totalSolicitudesActivas = computed(() => 
    this.solicitudes().filter(s => 
      s.estado !== EstadoSolicitud.COMPLETADO && 
      s.estado !== EstadoSolicitud.CANCELADO &&
      s.estado !== EstadoSolicitud.RECHAZADO_N1 &&
      s.estado !== EstadoSolicitud.RECHAZADO_N2
    ).length
  );

  totalAprobacionesPendientes = computed(() => 
    this.solicitudes().filter(s => 
      s.estado === EstadoSolicitud.PENDIENTE_N1 || 
      s.estado === EstadoSolicitud.PENDIENTE_N2
    ).length
  );

  totalRendicionesPendientes = computed(() => 
    this.rendiciones().filter(r => r.estado === EstadoRendicion.PENDIENTE).length
  );

  montoTotalGastado = computed(() => 
    this.rendiciones()
      .filter(r => r.estado === EstadoRendicion.APROBADO)
      .reduce((sum, r) => sum + r.monto, 0)
  );

  // Computed para listas interactivas
  ultimasSolicitudes = computed(() => 
    this.solicitudes().slice(0, 5)
  );

  ultimasRendiciones = computed(() => 
    this.rendiciones()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
  );

  gastosPorCategoria = computed(() => {
    const rendiciones = this.rendiciones().filter(r => r.estado === EstadoRendicion.APROBADO);
    const total = rendiciones.reduce((sum, r) => sum + r.monto, 0);
    
    if (total === 0) return [];

    const categorias = new Map<string, number>();
    rendiciones.forEach(r => {
      const actual = categorias.get(r.categoria) || 0;
      categorias.set(r.categoria, actual + r.monto);
    });

    return Array.from(categorias.entries())
      .map(([categoria, monto]) => ({
        categoria,
        total: monto,
        porcentaje: (monto / total) * 100
      }))
      .sort((a, b) => b.total - a.total);
  });

  constructor(
    private authStore: AuthStore,
    private router: Router,
    private solicitudService: SolicitudService,
    private rendicionService: RendicionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const user = this.authStore.currentUser();
    if (!user) return;

    const empleadoId = user.id;
    const rol = user.rol;

    // Lógica según rol
    if (rol === UserRole.APROBADOR_N1 || rol === UserRole.APROBADOR_N2 || rol === UserRole.ADMIN) {
      // Aprobadores y Admin ven TODAS las solicitudes
      this.solicitudService.getSolicitudes().subscribe(solicitudes => {
        this.solicitudes.set(solicitudes);
      });

      // Ver todas las rendiciones
      this.rendicionService.getAll().subscribe(rendiciones => {
        this.rendiciones.set(rendiciones);
      });
    } else {
      // Empleados y asistentes ven solo las suyas
      this.solicitudService.getSolicitudes(empleadoId).subscribe(solicitudes => {
        this.solicitudes.set(solicitudes);
      });

      this.rendicionService.getAll().subscribe(rendiciones => {
        const misRendiciones = rendiciones.filter(r => r.empleadoId === empleadoId);
        this.rendiciones.set(misRendiciones);
      });
    }
  }

  isAprobador(): boolean {
    const rol = this.authStore.userRole();
    return rol === UserRole.APROBADOR_N1 || rol === UserRole.APROBADOR_N2;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Helper methods para UI
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short' 
    });
  }

  getEstadoLabel(estado: EstadoSolicitud): string {
    const labels: Record<string, string> = {
      'BORRADOR': 'Borrador',
      'PENDIENTE_N1': 'Pendiente N1',
      'APROBADO_N1': 'Aprobado N1',
      'RECHAZADO_N1': 'Rechazado N1',
      'PENDIENTE_N2': 'Pendiente N2',
      'APROBADO_N2': 'Aprobado',
      'RECHAZADO_N2': 'Rechazado N2',
      'CANCELADO': 'Cancelado',
      'COMPLETADO': 'Completado'
    };
    return labels[estado] || estado;
  }

  getEstadoClass(estado: EstadoSolicitud): string {
    if (estado === EstadoSolicitud.APROBADO_N1 || estado === EstadoSolicitud.APROBADO_N2) {
      return 'chip-success';
    }
    if (estado === EstadoSolicitud.PENDIENTE_N1 || estado === EstadoSolicitud.PENDIENTE_N2) {
      return 'chip-warning';
    }
    if (estado === EstadoSolicitud.RECHAZADO_N1 || estado === EstadoSolicitud.RECHAZADO_N2) {
      return 'chip-error';
    }
    if (estado === EstadoSolicitud.COMPLETADO) {
      return 'chip-info';
    }
    return 'chip-default';
  }

  getEstadoRendicionClass(estado: EstadoRendicion): string {
    switch (estado) {
      case EstadoRendicion.APROBADO:
        return 'chip-success';
      case EstadoRendicion.PENDIENTE:
        return 'chip-warning';
      case EstadoRendicion.RECHAZADO:
        return 'chip-error';
      default:
        return 'chip-default';
    }
  }

  getCategoriaIcon(categoria: string): string {
    const icons: Record<string, string> = {
      'TRANSPORTE': 'directions_car',
      'HOSPEDAJE': 'hotel',
      'ALIMENTACION': 'restaurant',
      'OTROS': 'receipt'
    };
    return icons[categoria] || 'receipt';
  }

  getRolLabel(rol: UserRole | null | undefined): string {
    if (!rol) return '-';
    const labels: Record<string, string> = {
      'EMPLEADO': 'Empleado',
      'APROBADOR_N1': 'Aprobador Nivel 1',
      'APROBADOR_N2': 'Aprobador Nivel 2',
      'ADMIN': 'Administrador',
      'ASISTENTE': 'Asistente',
      'OPERADOR_LIQ': 'Operador Liquidación',
      'AUDITOR': 'Auditor'
    };
    return labels[rol] || rol;
  }
}
