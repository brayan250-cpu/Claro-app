import { Component, Inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EstadoSolicitud, Solicitud } from '../../../../models';

interface FlujoAprobacionDialogData {
  solicitud: Solicitud;
}

@Component({
  selector: 'app-flujo-aprobacion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="header-text">
        <h2 mat-dialog-title>Flujo de Aprobadores</h2>
        <p><strong>{{ data.solicitud.idViaje || data.solicitud.codigo }}</strong> | {{ data.solicitud.destino }}</p>
      </div>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <section class="resumen-top">
        <div class="pill">
          <mat-icon>person</mat-icon>
          Aprobador actual: <strong>{{ data.solicitud.aprobadorActual || 'Por asignar' }}</strong>
        </div>
        <div class="kpi-cards">
          <div class="kpi-card done">
            <span class="kpi-label">Aprobaciones Completadas</span>
            <strong class="kpi-value">{{ progress().done }}/{{ progress().total }}</strong>
          </div>
          <div class="kpi-card pending">
            <span class="kpi-label">Pendientes</span>
            <strong class="kpi-value">{{ progress().pending }}</strong>
          </div>
        </div>
        <div class="progress-wrap">
          <div class="progress-head">
            <span><strong>Avance del Flujo</strong></span>
            <span>{{ progress().percent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress().percent"></div>
          </div>
        </div>
      </section>

      <section class="approvers-section">
        <p class="section-title"><strong>Usuarios Aprobantes</strong></p>
        <div class="approvers-grid">
          <div class="approver-card" *ngFor="let user of approvers()">
            <span class="avatar" [class]="user.colorClass">{{ user.initials }}</span>
            <div class="approver-info">
              <strong>{{ user.name }}</strong>
              <span>{{ user.level }}</span>
            </div>
            <span class="estado" [class]="user.colorClass">{{ user.status }}</span>
          </div>
        </div>
      </section>

      <section class="timeline" *ngIf="etapas().length > 0; else sinDatos">
        <div class="etapa" *ngFor="let etapa of etapas(); let isLast = last; let i = index" [style.--item-index]="i">
          <div class="dot" [class]="etapa.colorClass">
            <mat-icon>{{ etapa.icon }}</mat-icon>
          </div>
          <div class="line" *ngIf="!isLast"></div>
          <div class="card">
            <div class="card-head">
              <div class="head-left">
                <span class="nivel-badge">{{ etapa.nivel }}</span>
                <strong>{{ etapa.titulo }}</strong>
              </div>
              <span class="estado" [class]="etapa.colorClass">{{ etapa.estadoLabel }}</span>
            </div>
            <div class="usuario-row">
              <span class="avatar" [class]="etapa.colorClass">{{ etapa.iniciales }}</span>
              <p class="usuario">{{ etapa.usuario }}</p>
            </div>
            <p class="fecha">{{ etapa.fecha }}</p>
            <p class="comentario" *ngIf="etapa.comentario">{{ etapa.comentario }}</p>
          </div>
        </div>
      </section>

      <ng-template #sinDatos>
        <div class="empty-state">
          <mat-icon>info</mat-icon>
          <p>No hay historial de aprobación registrado todavía.</p>
        </div>
      </ng-template>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fbff 0%, #fff5f5 100%);

      h2 {
        margin: 0;
        font-size: 20px;
      }

      p {
        margin: 4px 0 0;
        color: #4b5563;
        font-size: 12px;
      }

      .header-text {
        min-width: 0;
      }
    }

    mat-dialog-content {
      min-width: 640px;
      max-width: 92vw;
      max-height: 70vh;
      padding: 12px 4px 0;
    }

    .resumen-top {
      margin-bottom: 14px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #eef2ff;
      border: 1px solid #dbe4ff;
      border-radius: 999px;
      padding: 6px 12px;
      color: #1e3a8a;
      font-size: 13px;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    .kpi-cards {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .kpi-card {
      border-radius: 10px;
      padding: 8px 10px;
      border: 1px solid;

      .kpi-label {
        display: block;
        font-size: 11px;
        color: #6b7280;
      }

      .kpi-value {
        font-size: 18px;
      }

      &.done {
        background: #ecfdf3;
        border-color: #bbf7d0;

        .kpi-value {
          color: #15803d;
        }
      }

      &.pending {
        background: #fffbeb;
        border-color: #fde68a;

        .kpi-value {
          color: #b45309;
        }
      }
    }

    .progress-wrap {
      margin-top: 10px;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
    }

    .progress-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #374151;
      margin-bottom: 6px;
    }

    .progress-bar {
      height: 8px;
      width: 100%;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #ef4444 0%, #f59e0b 45%, #22c55e 100%);
      transition: width 260ms ease;
    }

    .approvers-section {
      margin-bottom: 12px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    .section-title {
      margin: 0 0 8px;
      font-size: 13px;
      color: #334155;
    }

    .approvers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .approver-card {
      border: 1px solid #dde4ee;
      border-radius: 10px;
      background: #f9fbff;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;

      .approver-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;

        strong {
          font-size: 13px;
          color: #111827;
        }

        span {
          font-size: 11px;
          color: #6b7280;
        }
      }

      .estado {
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        color: #fff;
        padding: 2px 7px;

        &.ok { background: #16a34a; }
        &.wait { background: #f59e0b; }
        &.reject { background: #dc2626; }
        &.neutral { background: #64748b; }
      }
    }

    .etapa {
      display: grid;
      grid-template-columns: 24px 1fr;
      column-gap: 12px;
      align-items: start;
      position: relative;

      .card {
        animation: fadeSlideIn 380ms ease both;
        animation-delay: calc(var(--item-index, 0) * 70ms);
      }
    }

    .dot {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      z-index: 2;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.ok {
        background: #16a34a;
      }

      &.wait {
        background: #f59e0b;
      }

      &.reject {
        background: #dc2626;
      }

      &.neutral {
        background: #64748b;
      }
    }

    .line {
      position: absolute;
      left: 11px;
      top: 24px;
      width: 2px;
      height: calc(100% + 12px);
      background: #d1d5db;
      z-index: 1;
    }

    .card {
      border: 1px solid #dde4ee;
      border-radius: 10px;
      padding: 10px 12px;
      background: #fbfdff;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .head-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nivel-badge {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.3px;
        padding: 2px 8px;
        border-radius: 999px;
        background: #eef2ff;
        color: #1d4ed8;
      }

      .estado {
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        padding: 2px 8px;
        color: #fff;

        &.ok { background: #16a34a; }
        &.wait { background: #f59e0b; }
        &.reject { background: #dc2626; }
        &.neutral { background: #64748b; }
      }
    }

    .usuario {
      margin: 0;
      font-size: 13px;
      color: #111827;
      font-weight: 600;
    }

    .usuario-row {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      font-weight: 800;

      &.ok { background: #16a34a; }
      &.wait { background: #f59e0b; }
      &.reject { background: #dc2626; }
      &.neutral { background: #64748b; }
    }

    .fecha {
      margin: 2px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    .comentario {
      margin: 6px 0 0;
      font-size: 12px;
      color: #374151;
      background: #f8fafc;
      border-radius: 6px;
      padding: 6px 8px;
    }

    .empty-state {
      display: flex;
      gap: 8px;
      align-items: center;
      color: #6b7280;
      padding: 10px;
      border: 1px dashed #cfd8e3;
      border-radius: 10px;

      mat-icon { color: #3b82f6; }
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: auto;
        padding: 8px 0 0;
      }

      .kpi-cards,
      .approvers-grid {
        grid-template-columns: 1fr;
      }

      .dialog-header {
        padding: 10px 12px 8px;

        h2 {
          font-size: 18px;
        }
      }

      .pill {
        width: 100%;
      }
    }
  `]
})
export class FlujoAprobacionDialogComponent {
  etapas = computed(() => {
    const historial = this.data.solicitud.historialEstados || [];

    return historial
      .filter(h => this.esEstadoFlujo(h.estado))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((h) => ({
        titulo: this.getTitulo(h.estado),
        nivel: this.getNivel(h.estado),
        estadoLabel: this.getEstadoLabel(h.estado),
        usuario: h.usuario,
        iniciales: this.getInitials(h.usuario),
        fecha: this.formatDate(h.fecha),
        comentario: h.comentario,
        icon: this.getIcon(h.estado),
        colorClass: this.getColorClass(h.estado)
      }));
  });

  approvers = computed(() => {
    const etapas = this.etapas();
    const byNivel: Record<string, (typeof etapas)[number] | undefined> = {
      N1: etapas.find(e => e.nivel === 'N1'),
      N2: etapas.find(e => e.nivel === 'N2')
    };

    return ['N1', 'N2'].map((nivel) => {
      const etapa = byNivel[nivel];
      const fallbackName = nivel === 'N1' ? 'Aprobador N1' : 'Aprobador N2';
      return {
        name: etapa?.usuario || (nivel === 'N2' ? (this.data.solicitud.aprobadorActual || fallbackName) : fallbackName),
        initials: this.getInitials(etapa?.usuario || fallbackName),
        status: etapa?.estadoLabel || 'Por iniciar',
        colorClass: etapa?.colorClass || 'neutral',
        level: `Nivel ${nivel}`
      };
    });
  });

  progress = computed(() => {
    const etapas = this.approvers();
    const total = etapas.length;
    const done = etapas.filter(e => e.status === 'Aprobado').length;
    const pending = etapas.filter(e => e.status === 'Pendiente' || e.status === 'Por iniciar').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, pending, percent };
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: FlujoAprobacionDialogData) {}

  private esEstadoFlujo(estado: EstadoSolicitud): boolean {
    return estado.includes('PENDIENTE') || estado.includes('APROBADO') || estado.includes('RECHAZADO');
  }

  private getTitulo(estado: EstadoSolicitud): string {
    if (estado.endsWith('N1')) return 'Validacion de Jefatura';
    if (estado.endsWith('N2')) return 'Validacion de Gerencia';
    return 'Revision';
  }

  private getNivel(estado: EstadoSolicitud): string {
    if (estado.endsWith('N1')) return 'N1';
    if (estado.endsWith('N2')) return 'N2';
    return 'N/A';
  }

  private getEstadoLabel(estado: EstadoSolicitud): string {
    if (estado.includes('PENDIENTE')) return 'Pendiente';
    if (estado.includes('APROBADO')) return 'Aprobado';
    if (estado.includes('RECHAZADO')) return 'Rechazado';
    return estado;
  }

  private getIcon(estado: EstadoSolicitud): string {
    if (estado.includes('APROBADO')) return 'check';
    if (estado.includes('RECHAZADO')) return 'close';
    if (estado.includes('PENDIENTE')) return 'schedule';
    return 'info';
  }

  private getColorClass(estado: EstadoSolicitud): string {
    if (estado.includes('APROBADO')) return 'ok';
    if (estado.includes('RECHAZADO')) return 'reject';
    if (estado.includes('PENDIENTE')) return 'wait';
    return 'neutral';
  }

  private formatDate(fecha: Date | string): string {
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  }

  private getInitials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
