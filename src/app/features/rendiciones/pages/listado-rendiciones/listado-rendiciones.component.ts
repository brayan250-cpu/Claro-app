import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { RendicionService } from '../../../../core/services/rendicion.service';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RendicionResumenDialogComponent } from './rendicion-resumen-dialog.component';
import { FlujoAprobacionDialogComponent } from './flujo-aprobacion-dialog.component';
import { Rendicion, CategoriaGasto, EstadoRendicion, UserRole, Solicitud, EstadoSolicitud } from '../../../../models';

@Component({
  selector: 'app-listado-rendiciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <!-- MÓDULO 3.1: Pantalla principal de rendiciones con tarjetas de solicitudes aprobadas -->
    <div class="rendiciones-container">
      <!-- Header -->
      <div class="header-section">
        <div class="title-section">
          <h1>
            <mat-icon>receipt_long</mat-icon>
            Mis Rendiciones
          </h1>
          <p class="subtitle">Registra los gastos REALES de tus viajes aprobados</p>
        </div>
      </div>

      <!-- Tarjetas de Solicitudes Aprobadas -->
      <div class="solicitudes-grid" *ngIf="!loading()">
        @if (solicitudesAprobadas().length > 0) {
          <mat-card class="solicitud-card" *ngFor="let solicitud of solicitudesAprobadas()" 
                    (click)="irARendirSolicitud(solicitud)">
            <mat-card-content>
              <div class="card-top">
                <div class="card-top-left">
                  <span class="trip-icon"><mat-icon>flight_takeoff</mat-icon></span>
                  <div>
                    <h3>{{ getViajeId(solicitud) }}</h3>
                    <p class="trip-sub"><mat-icon>place</mat-icon>{{ getUbicacionSolicitud(solicitud) }}</p>
                  </div>
                </div>
                <div class="card-top-right">
                  <span class="amount">{{ formatMontoMoneda(getTotalRendido(solicitud.id), solicitud.monedaAnticipo || 'PEN') }}</span>
                  <span class="amount-label">Rendido</span>
                </div>
              </div>

              <div class="travel-line">
                <div class="travel-col">
                  <span class="travel-label">SALIDA</span>
                  <strong>{{ formatFechaCard(solicitud.fechaSalida) }}</strong>
                </div>
                <div class="travel-center">
                  <span class="travel-dot"></span>
                  <span class="travel-track"></span>
                </div>
                <div class="travel-col travel-col-right">
                  <span class="travel-label">RETORNO</span>
                  <strong>{{ formatFechaCard(solicitud.fechaRetorno) }}</strong>
                </div>
              </div>

              <div class="chip-row" (click)="$event.stopPropagation()">
                <mat-chip class="chip-soft blue-chip state-chip" [class.excedido-chip]="isExcedido(solicitud)">
                  Estado: {{ getEstadoRegistroTexto(solicitud) }}
                </mat-chip>
                <mat-chip class="chip-soft green-chip anticipo-chip" *ngIf="hasAnticipo(solicitud)">
                  Anticipo: {{ formatMontoMoneda(solicitud.presupuestoTotal, solicitud.monedaAnticipo || 'PEN') }}
                </mat-chip>
              </div>

              <div class="metrics-grid">
                <div class="metric-item">
                  <span>Saldo</span>
                  <strong [class.excedido-text]="getSaldoSolicitud(solicitud.id) < 0">{{ formatMonto(getSaldoSolicitud(solicitud.id)) }}</strong>
                </div>
                <div class="metric-item danger">
                  <span>Excedente</span>
                  <strong [class.excedido-text]="getExcedenteSolicitud(solicitud.id) > 0">{{ formatMonto(getExcedenteSolicitud(solicitud.id)) }}</strong>
                </div>
                <div class="metric-item">
                  <span>% Ejecutado</span>
                  <strong>{{ getPorcentajeRendido(solicitud) }}%</strong>
                </div>
                <div class="metric-item">
                  <span>Fecha max</span>
                  <strong>{{ getFechaMaxRendicionTexto(solicitud) }}</strong>
                </div>
              </div>

              <div class="card-actions" (click)="$event.stopPropagation()">
                <div class="actions-icons">
                  <button mat-mini-fab class="icon-btn eye" matTooltip="Ver resumen de viaticos" (click)="verResumenViaticos(solicitud); $event.stopPropagation()">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-mini-fab class="icon-btn pencil" matTooltip="Editar gasto antes de enviar" (click)="editarUltimoBorrador(solicitud); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-mini-fab class="icon-btn approve" matTooltip="Ver flujo de aprobadores" (click)="verFlujoAprobacion(solicitud); $event.stopPropagation()">
                    <mat-icon>groups</mat-icon>
                  </button>
                </div>
                <div class="send-inline">
                  <button mat-stroked-button class="btn-send-inline" [disabled]="!puedeEnviarAAprobar(solicitud)" (click)="enviarAAprobar(solicitud); $event.stopPropagation()">
                    <mat-icon>send</mat-icon>
                    Enviar a aprobar
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>No hay presupuestos aprobados pendientes de rendición</h3>
            <p>Cuando tus solicitudes de presupuesto sean aprobadas, aparecerán aquí para registrar los gastos reales del viaje</p>
          </div>
        }
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner></mat-spinner>
        <p>Cargando solicitudes aprobadas...</p>
      </div>
    </div>
  `,
  styles: [`
    /* MÓDULO 3.1: Estilos para tarjetas de solicitudes aprobadas con progreso */
    .rendiciones-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 32px;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      color: #333;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--claro-primary);
      }
    }

    .subtitle {
      margin: 4px 0 0 48px;
      color: #666;
      font-size: 14px;
    }

    /* Grid de tarjetas */
    .solicitudes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .solicitud-card {
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e8ebf0;
      background: #fff;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
      }

      mat-card-content {
        padding: 11px 12px;
      }
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }

    .card-top-left {
      display: flex;
      align-items: flex-start;
      gap: 10px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: #1f2937;
      }

      .trip-sub {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin: 2px 0 0;
        color: #7b8794;
        font-size: 12px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    .trip-icon {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      background: #ffe4e6;
      color: #e11d48;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
    }

    .card-top-right {
      text-align: right;

      .amount {
        display: block;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
        color: #ef4444;
      }

      .amount-label {
        display: block;
        margin-top: 2px;
        color: #98a2b3;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.4px;
      }
    }

    .travel-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      padding: 4px 0;
    }

    .travel-col {
      display: flex;
      flex-direction: column;
      gap: 1px;

      .travel-label {
        font-size: 10px;
        color: #9aa4b2;
        font-weight: 700;
      }

      strong {
        font-size: 16px;
        color: #1f2937;
      }
    }

    .travel-col-right {
      text-align: right;
    }

    .travel-center {
      flex: 1;
      position: relative;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;

      .travel-track {
        position: absolute;
        left: 2px;
        right: 2px;
        height: 2px;
        background: #e2e8f0;
      }

      .travel-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #cbd5e1;
        position: relative;
        z-index: 1;
      }
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      justify-content: space-between;

      .state-chip {
        margin-right: auto;
      }

      .anticipo-chip {
        margin-left: auto;
      }
    }

    .chip-soft {
      min-height: 22px;
      font-size: 10px;
      font-weight: 800;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
    }

    .green-chip {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }

    .blue-chip {
      background: #e0ecff;
      color: #1d4ed8;
      border-color: #c7ddff;
    }

    .urgent-chip {
      background: #ffedd5;
      color: #c2410c;
      border-color: #fed7aa;
    }

    .excedido-chip {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .metric-item {
      border: 1px solid #e6ebf2;
      background: #f8fafc;
      border-radius: 8px;
      padding: 6px 7px;
      min-height: 44px;

      span {
        display: block;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
      }

      strong {
        display: block;
        margin-top: 2px;
        color: #0f172a;
        font-size: 13px;
        font-weight: 800;
      }

      .excedido-text {
        color: #dc2626;
      }

      &.danger {
        background: #fff7f7;
        border-color: #ffd3d3;
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 4px;
      border-top: 1px solid #eef2f7;
    }

    .actions-icons {
      display: flex;
      gap: 6px;
    }

    .icon-btn {
      width: 30px;
      height: 30px;
      box-shadow: none;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      &.eye {
        background: #eef2f7;
        color: #475569;
      }

      &.pencil {
        background: #eef2f7;
        color: #475569;
      }

      &.approve {
        background: #eef2ff;
        color: #1d4ed8;
      }

    }

    .btn-send-inline {
      min-height: 28px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;

      &:disabled {
        color: #94a3b8;
      }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #999;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ddd;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: #666;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        margin: 0;
        color: #999;
      }
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;

      p {
        color: #666;
        font-size: 14px;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .rendiciones-container {
        padding: 16px;
      }

      .solicitudes-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .title-section h1 {
        font-size: 24px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .header-section {
        align-items: flex-start;
        flex-direction: column;
      }

      .card-top-right .amount {
        font-size: 24px;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .card-actions {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        .send-inline {
          width: auto;

          .btn-send-inline {
            width: auto;
          }
        }
      }
    }
  `]
})
export class ListadoRendicionesComponent implements OnInit {
  private rendicionService = inject(RendicionService);
  private solicitudService = inject(SolicitudService);
  private authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  
  // Exponer enum para template
  readonly CategoriaGasto = CategoriaGasto;
  
  // Verificar rol de aprobador
  get isAprobador(): boolean {
    const role = this.authStore.userRole();
    return role === UserRole.APROBADOR_N1 || 
           role === UserRole.APROBADOR_N2 || 
           role === UserRole.ADMIN;
  }
  
  loading = signal(true);
  rendiciones = signal<Rendicion[]>([]);
  solicitudes = signal<Solicitud[]>([]);
  estadisticas = signal<any>(null);
  filtroCategoria = signal<CategoriaGasto | null>(null);

  // Rendiciones filtradas por categoría
  rendicionesFiltradas = computed(() => {
    const todasRendiciones = this.rendiciones();
    const filtro = this.filtroCategoria();

    if (!filtro) {
      return todasRendiciones;
    }

    return todasRendiciones.filter(r => r.categoria === filtro);
  });

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRendiciones();
    this.loadSolicitudes();
    this.loadEstadisticas();
  }

  loadRendiciones(): void {
    this.loading.set(true);
    this.rendicionService.getAll().subscribe({
      next: (rendiciones) => {
        this.rendiciones.set(rendiciones);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar rendiciones:', error);
        this.snackBar.open('Error al cargar las rendiciones', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadSolicitudes(): void {
    this.solicitudService.getSolicitudes().subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
      }
    });
  }

  loadEstadisticas(): void {
    this.rendicionService.getEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticas.set(stats);
      }
    });
  }

  /**
   * MÓDULO 3.1: Computed para obtener solo solicitudes aprobadas (que requieren rendición)
   */
  solicitudesAprobadas = computed(() => {
    return this.solicitudes().filter(sol => 
      sol.estado === EstadoSolicitud.APROBADO_N2 || 
      sol.estado === EstadoSolicitud.APROBADO_N1 ||
      sol.estado === EstadoSolicitud.COMPLETADO
    );
  });

  /**
   * MÓDULO 3.1: Navegar al flujo de rendición de una solicitud específica
   */
  irARendirSolicitud(solicitud: Solicitud): void {
    console.log('📋 Navegando a formulario de rendición para solicitud:', solicitud.codigo);
    this.router.navigate(['/rendiciones/nuevo'], { 
      queryParams: { solicitudId: solicitud.id }
    });
  }

  /**
   * MÓDULO 3.1: Format fecha como DD/MM/YYYY (igual que solicitudes)
   */
  formatFecha(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatFechaCorta(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  formatFechaCard(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * MÓDULO 3.1: Format monto con separador de miles (igual que solicitudes)
   */
  formatMonto(monto: number): string {
    return `S/ ${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatMontoMoneda(monto: number, moneda: 'PEN' | 'USD' | 'EUR' | string): string {
    const symbol = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : 'S/';
    return `${symbol} ${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * MÓDULO 3.1: Calcular total rendido de una solicitud (alias de getTotalGastadoSolicitud)
   */
  getTotalRendido(solicitudId: string): number {
    return this.getTotalGastadoSolicitud(solicitudId);
  }

  /**
   * MÓDULO 3.1: Calcular porcentaje rendido de una solicitud
   */
  getPorcentajeRendido(solicitud: Solicitud): number {
    const totalRendido = this.getTotalRendido(solicitud.id);
    if (!solicitud.presupuestoTotal || solicitud.presupuestoTotal === 0) return 0;
    const porcentaje = (totalRendido / solicitud.presupuestoTotal) * 100;
    return Math.round(porcentaje);
  }

  isExcedido(solicitud: Solicitud): boolean {
    return this.getTotalRendido(solicitud.id) > solicitud.presupuestoTotal;
  }

  /**
   * MÓDULO 3.1: Obtener estado del progreso para el chip
   */
  getProgresoEstado(solicitud: Solicitud): string {
    const porcentaje = this.getPorcentajeRendido(solicitud);
    if (porcentaje === 0) return 'pendiente';
    if (porcentaje >= 100) return 'completo';
    if (porcentaje >= 50) return 'parcial';
    return 'pendiente';
  }

  /**
   * MÓDULO 3.1: Obtener texto del chip de progreso
   */
  getProgresoTexto(solicitud: Solicitud): string {
    const porcentaje = this.getPorcentajeRendido(solicitud);
    const excedido = this.getTotalRendido(solicitud.id) > solicitud.presupuestoTotal;
    
    if (excedido) return 'Excedido';
    if (porcentaje === 0) return 'Pendiente';
    if (porcentaje >= 100) return 'Rendido';
    return `${porcentaje}% Rendido`;
  }

  hasAnticipo(solicitud: Solicitud): boolean {
    return solicitud.presupuestoTotal >= 1000;
  }

  getEstadoRegistroTexto(solicitud: Solicitud): string {
    const gastos = this.rendiciones().filter(r => r.solicitudId === solicitud.id);
    if (gastos.some(g => g.estado === EstadoRendicion.PENDIENTE)) {
      return 'Pendiente de aprobacion';
    }

    if (gastos.length > 0 && gastos.every(g => g.estado === EstadoRendicion.APROBADO)) {
      return 'Aprobado';
    }

    return 'Registrado';
  }

  getViajeId(solicitud: Solicitud): string {
    return solicitud.idViaje || solicitud.codigo;
  }

  getSalidaTexto(solicitud: Solicitud): string {
    return solicitud.origen || solicitud.destino;
  }

  getRetornoTexto(solicitud: Solicitud): string {
    return solicitud.retorno || solicitud.destino;
  }

  getUbicacionSolicitud(solicitud: Solicitud): string {
    const region = solicitud.departamento || solicitud.provincia || solicitud.destino;
    const pais = this.getPaisSolicitud(solicitud);
    return `${region}, ${pais}`;
  }

  private getPaisSolicitud(solicitud: Solicitud): string {
    const destino = (solicitud.destino || '').trim();
    if (destino.includes(',')) {
      const partes = destino.split(',').map(p => p.trim()).filter(Boolean);
      if (partes.length > 1) {
        return partes[partes.length - 1];
      }
    }
    return 'Peru';
  }

  getFechaMaxRendicionTexto(solicitud: Solicitud): string {
    if (solicitud.fechaMaxRendicion) {
      return this.formatFecha(solicitud.fechaMaxRendicion);
    }
    const fallback = new Date(solicitud.fechaRetorno);
    fallback.setDate(fallback.getDate() + 3);
    return this.formatFecha(fallback);
  }

  getDiasRestantesRendicion(solicitud: Solicitud): number {
    const baseFecha = solicitud.fechaMaxRendicion
      ? new Date(solicitud.fechaMaxRendicion)
      : new Date(new Date(solicitud.fechaRetorno).setDate(new Date(solicitud.fechaRetorno).getDate() + 3));
    const hoy = new Date();
    const ms = baseFecha.getTime() - hoy.getTime();
    return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0);
  }

  getAprobadorNombre(solicitud: Solicitud): string {
    return solicitud.aprobadorActual || 'Usuario aprobador';
  }

  puedeEnviarAAprobar(solicitud: Solicitud): boolean {
    return this.rendiciones().some(r => r.solicitudId === solicitud.id && r.estado === EstadoRendicion.BORRADOR);
  }

  enviarAAprobar(solicitud: Solicitud): void {
    const borradores = this.rendiciones().filter(r => r.solicitudId === solicitud.id && r.estado === EstadoRendicion.BORRADOR);
    if (borradores.length === 0) {
      this.snackBar.open('No hay gastos en borrador para enviar', 'Cerrar', { duration: 2500 });
      return;
    }

    const actualizaciones = borradores.map(rendicion =>
      this.rendicionService.update(rendicion.id, { estado: EstadoRendicion.PENDIENTE })
    );

    forkJoin(actualizaciones).subscribe({
      next: () => {
        this.snackBar.open(`Se enviaron ${borradores.length} gasto(s) a aprobación`, 'Cerrar', { duration: 3000 });
        this.loadRendiciones();
      },
      error: () => {
        this.snackBar.open('No se pudo enviar uno o mas gastos a aprobación', 'Cerrar', { duration: 3000 });
        this.loadRendiciones();
      }
    });
  }

  editarUltimoBorrador(solicitud: Solicitud): void {
    const gastosSolicitud = this.rendiciones().filter(r => r.solicitudId === solicitud.id);
    const ordenarPorFechaDesc = (a: Rendicion, b: Rendicion) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime();

    const editable =
      gastosSolicitud.filter(r => r.estado === EstadoRendicion.BORRADOR).sort(ordenarPorFechaDesc)[0] ||
      gastosSolicitud.filter(r => r.estado === EstadoRendicion.RECHAZADO).sort(ordenarPorFechaDesc)[0] ||
      gastosSolicitud.filter(r => r.estado === EstadoRendicion.PENDIENTE).sort(ordenarPorFechaDesc)[0] ||
      gastosSolicitud.sort(ordenarPorFechaDesc)[0];

    if (!editable) {
      // Si aun no hay borrador, iniciar uno nuevo para esta solicitud.
      this.router.navigate(['/rendiciones/nuevo'], {
        queryParams: { solicitudId: solicitud.id }
      });
      return;
    }

    this.snackBar.open('Cargando ultimo gasto para editar', 'Cerrar', { duration: 1800 });
    this.router.navigate(['/rendiciones/editar', editable.id]);
  }

  verResumenViaticos(solicitud: Solicitud): void {
    const gastos = this.rendiciones().filter(r => r.solicitudId === solicitud.id);

    const dialogRef = this.dialog.open(RendicionResumenDialogComponent, {
      width: '900px',
      maxWidth: '96vw',
      data: { solicitud, gastos }
    });
  }

  verFlujoAprobacion(solicitud: Solicitud): void {
    this.dialog.open(FlujoAprobacionDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      data: {
        solicitud
      }
    });
  }

  setFiltroCategoria(categoria: CategoriaGasto | null): void {
    this.filtroCategoria.set(categoria);
  }

  navigateToNuevo(): void {
    this.router.navigate(['/rendiciones/nuevo']);
  }

  getCategoriaIcon(categoria: CategoriaGasto): string {
    const icons: Record<CategoriaGasto, string> = {
      [CategoriaGasto.ALIMENTACION]: 'restaurant',
      [CategoriaGasto.TRANSPORTE]: 'directions_car',
      [CategoriaGasto.HOSPEDAJE]: 'hotel',
      [CategoriaGasto.OTROS]: 'more_horiz'
    };
    return icons[categoria];
  }

  getCategoriaLabel(categoria: CategoriaGasto): string {
    const labels: Record<CategoriaGasto, string> = {
      [CategoriaGasto.ALIMENTACION]: 'Alimentación',
      [CategoriaGasto.TRANSPORTE]: 'Transporte',
      [CategoriaGasto.HOSPEDAJE]: 'Hospedaje',
      [CategoriaGasto.OTROS]: 'Otros'
    };
    return labels[categoria];
  }

  /**
   * Obtiene la solicitud asociada a una rendición
   */
  getSolicitud(solicitudId: string): Solicitud | undefined {
    return this.solicitudes().find(s => s.id === solicitudId);
  }

  /**
   * Obtiene información resumida del viaje para mostrar en la rendición
   */
  getViajeInfo(solicitudId: string): string {
    const solicitud = this.getSolicitud(solicitudId);
    if (!solicitud) {
      return `Solicitud: ${solicitudId}`;
    }
    const fechaSalida = new Date(solicitud.fechaSalida).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short' 
    });
    return `${solicitud.destino} • ${fechaSalida}`;
  }

  /**
   * Calcula el total gastado en una solicitud específica
   */
  getTotalGastadoSolicitud(solicitudId: string): number {
    return this.rendiciones()
      .filter(r => r.solicitudId === solicitudId)
      .reduce((sum, r) => sum + r.monto, 0);
  }

  /**
   * Obtiene el saldo restante de una solicitud
   */
  getSaldoSolicitud(solicitudId: string): number {
    const solicitud = this.getSolicitud(solicitudId);
    if (!solicitud) return 0;
    const totalGastado = this.getTotalGastadoSolicitud(solicitudId);
    return solicitud.presupuestoTotal - totalGastado;
  }

  getExcedenteSolicitud(solicitudId: string): number {
    const solicitud = this.getSolicitud(solicitudId);
    if (!solicitud) return 0;
    const totalGastado = this.getTotalGastadoSolicitud(solicitudId);
    return Math.max(totalGastado - solicitud.presupuestoTotal, 0);
  }

  /**
   * Verifica si una solicitud excedió el presupuesto
   */
  excedioPresupuesto(solicitudId: string): boolean {
    return this.getSaldoSolicitud(solicitudId) < 0;
  }

  /**
   * Genera el texto del tooltip con información de presupuesto
   */
  getTooltipPresupuesto(solicitudId: string): string {
    const solicitud = this.getSolicitud(solicitudId);
    if (!solicitud) return 'Información no disponible';
    
    const presupuesto = solicitud.presupuestoTotal;
    const gastado = this.getTotalGastadoSolicitud(solicitudId);
    const saldo = presupuesto - gastado;
    const porcentaje = (gastado / presupuesto * 100).toFixed(1);
    
    return `Presupuesto: S/ ${presupuesto.toFixed(2)}\nGastado: S/ ${gastado.toFixed(2)} (${porcentaje}%)\nSaldo: S/ ${saldo.toFixed(2)}`;
  }

  getEstadoLabel(estado: EstadoRendicion): string {
    const labels: Record<EstadoRendicion, string> = {
      [EstadoRendicion.BORRADOR]: 'Borrador',
      [EstadoRendicion.PENDIENTE]: 'Pendiente',
      [EstadoRendicion.APROBADO]: 'Aprobado',
      [EstadoRendicion.RECHAZADO]: 'Rechazado'
    };
    return labels[estado];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Verificar si puede editar un gasto (BORRADOR, RECHAZADO o PENDIENTE)
   */
  puedeEditar(rendicion: Rendicion): boolean {
    return (
      rendicion.estado === EstadoRendicion.BORRADOR ||
      rendicion.estado === EstadoRendicion.RECHAZADO ||
      rendicion.estado === EstadoRendicion.PENDIENTE
    ) && !this.isAprobador;
  }

  /**
   * Verificar si puede eliminar un gasto
   */
  puedeEliminar(rendicion: Rendicion): boolean {
    return rendicion.estado === EstadoRendicion.PENDIENTE && 
           !this.isAprobador;
  }

  /**
   * Verificar si el aprobador puede aprobar/rechazar este gasto
   */
  puedeAprobar(rendicion: Rendicion): boolean {
    return this.isAprobador && rendicion.estado === EstadoRendicion.PENDIENTE;
  }

  /**
   * Ver detalle individual de un gasto — abre el dialog de resumen filtrado al gasto
   */
  verDetalle(rendicion: Rendicion): void {
    const solicitud = this.getSolicitud(rendicion.solicitudId);
    if (!solicitud) {
      this.snackBar.open('No se encontró la solicitud asociada al gasto', 'Cerrar', { duration: 2500 });
      return;
    }
    const dialogRef = this.dialog.open(RendicionResumenDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: {
        solicitud,
        gastos: [rendicion]
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'edit' && result?.id) {
        this.router.navigate(['/rendiciones/editar', result.id]);
      }
    });
  }

  /**
   * Editar gasto (solo empleado)
   */
  editarGasto(rendicion: Rendicion): void {
    if (!this.puedeEditar(rendicion)) {
      this.snackBar.open('No puede editar este gasto', 'Cerrar', { duration: 2000 });
      return;
    }
    this.router.navigate(['/rendiciones/editar', rendicion.id]);
  }

  /**
   * Eliminar gasto (solo empleado)
   */
  eliminarGasto(rendicion: Rendicion): void {
    if (!this.puedeEliminar(rendicion)) {
      this.snackBar.open('No puede eliminar este gasto', 'Cerrar', { duration: 2000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Gasto',
        message: `¿Está seguro que desea eliminar el gasto "${rendicion.concepto}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rendicionService.delete(rendicion.id).subscribe({
          next: () => {
            this.snackBar.open('Gasto eliminado correctamente', 'Cerrar', { duration: 3000 });
            this.loadRendiciones();
            this.loadEstadisticas();
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            this.snackBar.open('Error al eliminar el gasto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  /**
   * Aprobar gasto (solo aprobador)
   */
  aprobarGasto(rendicion: Rendicion): void {
    if (!this.puedeAprobar(rendicion)) {
      this.snackBar.open('No tiene permisos para aprobar este gasto', 'Cerrar', { duration: 2000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Gasto',
        message: `¿Desea aprobar el gasto "${rendicion.concepto}" por S/ ${rendicion.monto.toFixed(2)}?`,
        confirmText: 'Aprobar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rendicionService.update(rendicion.id, { estado: EstadoRendicion.APROBADO }).subscribe({
          next: () => {
            this.snackBar.open('✓ Gasto aprobado correctamente', 'Cerrar', { 
              duration: 3000,
              panelClass: ['snackbar-success']
            });
            this.loadRendiciones();
            this.loadEstadisticas();
          },
          error: (error) => {
            console.error('Error al aprobar:', error);
            this.snackBar.open('Error al aprobar el gasto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  /**
   * Rechazar gasto (solo aprobador)
   */
  rechazarGasto(rendicion: Rendicion): void {
    if (!this.puedeAprobar(rendicion)) {
      this.snackBar.open('No tiene permisos para rechazar este gasto', 'Cerrar', { duration: 2000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Gasto',
        message: `¿Está seguro que desea rechazar el gasto "${rendicion.concepto}"?`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rendicionService.update(rendicion.id, { estado: EstadoRendicion.RECHAZADO }).subscribe({
          next: () => {
            this.snackBar.open('Gasto rechazado', 'Cerrar', { duration: 3000 });
            this.loadRendiciones();
            this.loadEstadisticas();
          },
          error: (error) => {
            console.error('Error al rechazar:', error);
            this.snackBar.open('Error al rechazar el gasto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
}
