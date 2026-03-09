import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Solicitud, EstadoSolicitud, ViaticosItem } from '../../models';

@Component({
  selector: 'app-solicitud-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="sol-dialog-container">
      <!-- Header -->
      <div class="sol-dialog-header">
        <div class="header-left">
          <mat-icon class="header-icon">assignment</mat-icon>
          <div>
            <h2 class="header-title">Solicitud de Gastos de Viaje N°. {{ data.solicitud.idViaje || data.solicitud.codigo }}</h2>
            <span class="header-estado" [class]="'estado-' + getEstadoClass()">{{ getEstadoLabel() }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Tabs -->
      <mat-tab-group class="sol-tabs" animationDuration="200ms">

        <!-- Tab 1: Datos Generales -->
        <mat-tab label="Datos Generales">
          <div class="tab-content">
            <h3 class="section-title">Datos Generales</h3>
            <div class="datos-grid">
              <div class="dato-field">
                <label>Código C :</label>
                <input type="text" readonly [value]="data.solicitud.centroCosto" />
              </div>
              <div class="dato-field">
                <label>Nombre :</label>
                <input type="text" readonly [value]="data.solicitud.empleadoNombre" />
              </div>
              <div class="dato-field">
                <label>Área :</label>
                <input type="text" readonly [value]="data.solicitud.area || data.solicitud.departamento || '-'" />
              </div>
              <div class="dato-field">
                <label>Motivo de viaje :</label>
                <input type="text" readonly [value]="data.solicitud.motivoCorto || data.solicitud.motivoViaje" />
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Detalle del Viaje -->
        <mat-tab label="Detalle del Viaje">
          <div class="tab-content">
            <h3 class="section-title">Detalle del Viaje</h3>
            <div class="table-wrapper">
              <table class="detalle-table">
                <thead>
                  <tr>
                    <th>País Destino</th>
                    <th>Ciudad Destino</th>
                    <th>Provincia Destino</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin Viaje</th>
                    <th>Actividad</th>
                    <th>Modalidad</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ getPaisDestino() }}</td>
                    <td>{{ data.solicitud.destino }}</td>
                    <td>{{ data.solicitud.provincia || data.solicitud.departamento || data.solicitud.destino }}</td>
                    <td>{{ formatDate(data.solicitud.fechaSalida) }}</td>
                    <td>{{ formatDate(data.solicitud.fechaRetorno) }}</td>
                    <td>{{ data.solicitud.actividad || data.solicitud.motivoCorto || '-' }}</td>
                    <td>{{ data.solicitud.modalidad || getModalidadFromPasajes() }}</td>
                    <td>{{ data.solicitud.tipoViaje || getTipoViaje() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 3: Detalle de Viáticos -->
        <mat-tab label="Detalle de Viáticos">
          <div class="tab-content">
            <div class="table-wrapper">
              <table class="detalle-table viaticos-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Moneda</th>
                    <th>Monto</th>
                    <th>Justificacion</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of getViaticos(); track item.concepto) {
                    <tr>
                      <td>{{ item.concepto }}</td>
                      <td>{{ item.moneda }}</td>
                      <td class="monto-cell">{{ item.monto | number:'1.2-2' }}</td>
                      <td>{{ item.justificacion || '-' }}</td>
                    </tr>
                  }
                  @if (getViaticos().length === 0) {
                    <tr>
                      <td colspan="4" class="empty-row">Sin detalle de viáticos</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Monto Total -->
            <div class="monto-total-row">
              <span class="monto-total-label">Monto Total</span>
              <span class="monto-total-valor">
                {{ data.solicitud.presupuestoTotal | number:'1.2-2' }}
                {{ data.solicitud.monedaAnticipo || 'PEN' }}
              </span>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>

      <!-- Footer Actions -->
      <div class="sol-dialog-footer">
        <button mat-stroked-button (click)="close()">Cerrar</button>
        @if (data.showActions && esPendiente()) {
          <button mat-stroked-button color="warn" (click)="onRechazar()">
            <mat-icon>close</mat-icon>
            Rechazar
          </button>
          <button mat-raised-button color="primary" (click)="onAprobar()">
            <mat-icon>check</mat-icon>
            Aprobar
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .sol-dialog-container {
      display: flex;
      flex-direction: column;
      min-height: 480px;
      font-family: 'Roboto', sans-serif;
    }

    /* Header */
    .sol-dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #da291c;
    }

    .header-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }

    .header-estado {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 12px;
    }

    .estado-pendiente { background: #fff3cd; color: #856404; }
    .estado-aprobado  { background: #d1fae5; color: #065f46; }
    .estado-rechazado { background: #fee2e2; color: #991b1b; }
    .estado-default   { background: #e2e8f0; color: #475569; }

    .close-btn { color: #64748b; }

    /* Tabs */
    .sol-tabs { flex: 1; }

    ::ng-deep .sol-tabs .mat-mdc-tab-labels {
      border-bottom: 2px solid #e2e8f0;
    }

    ::ng-deep .sol-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: #da291c !important;
    }

    ::ng-deep .sol-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content--underline {
      border-color: #da291c !important;
    }

    /* Tab Content */
    .tab-content {
      padding: 20px 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Datos Generales Grid */
    .datos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .dato-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dato-field label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .dato-field input {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      color: #1e293b;
      background: #f8fafc;
      outline: none;
      cursor: default;
    }

    /* Tables */
    .table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .detalle-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .detalle-table thead tr {
      background: #64748b;
    }

    .detalle-table th {
      color: white;
      font-weight: 600;
      font-size: 12px;
      padding: 10px 14px;
      text-align: left;
      white-space: nowrap;
    }

    .detalle-table td {
      padding: 10px 14px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }

    .detalle-table tbody tr:hover {
      background: #f8fafc;
    }

    .detalle-table tbody tr:last-child td {
      border-bottom: none;
    }

    .monto-cell {
      text-align: right;
      font-weight: 600;
    }

    .empty-row {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      padding: 24px !important;
    }

    /* Monto Total */
    .monto-total-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 24px;
      margin-top: 0;
      padding: 12px 16px;
      background: #22c55e;
      border-radius: 0 0 8px 8px;
    }

    .monto-total-label {
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .monto-total-valor {
      color: white;
      font-weight: 700;
      font-size: 16px;
    }

    /* Footer */
    .sol-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .sol-dialog-footer button {
      border-radius: 20px;
      padding: 4px 20px;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .datos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SolicitudDetalleDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<SolicitudDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      solicitud: Solicitud;
      showActions: boolean;
    }
  ) {}

  getEstadoClass(): string {
    const e = this.data.solicitud.estado;
    if (e.includes('PENDIENTE')) return 'pendiente';
    if (e.includes('APROBADO')) return 'aprobado';
    if (e.includes('RECHAZADO')) return 'rechazado';
    return 'default';
  }

  getEstadoLabel(): string {
    const map: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE_N1: 'Pendiente N1',
      APROBADO_N1: 'Aprobado N1',
      RECHAZADO_N1: 'Rechazado N1',
      PENDIENTE_N2: 'Pendiente N2',
      APROBADO_N2: 'Aprobado N2',
      RECHAZADO_N2: 'Rechazado N2',
      CANCELADO: 'Cancelado',
      COMPLETADO: 'Completado'
    };
    return map[this.data.solicitud.estado] || this.data.solicitud.estado;
  }

  getPaisDestino(): string {
    const destino = this.data.solicitud.destino?.toLowerCase() || '';
    const internacionales = ['buenos aires', 'bogotá', 'santiago', 'quito', 'ciudad de mexico', 'miami', 'madrid'];
    if (internacionales.some(d => destino.includes(d))) {
      if (destino.includes('buenos aires')) return 'Argentina';
      if (destino.includes('bogotá')) return 'Colombia';
      if (destino.includes('santiago')) return 'Chile';
      if (destino.includes('quito')) return 'Ecuador';
      return 'Internacional';
    }
    return 'Peru';
  }

  getModalidadFromPasajes(): string {
    if (!this.data.solicitud.pasajes?.length) return '-';
    const tipo = this.data.solicitud.pasajes[0].tipo;
    return tipo === 'AEREO' ? 'Aéreo' : 'Terrestre';
  }

  getTipoViaje(): string {
    const pais = this.getPaisDestino();
    return pais === 'Peru' ? 'Nacional' : 'Internacional';
  }

  getViaticos(): ViaticosItem[] {
    return this.data.solicitud.viaticos || [];
  }

  esPendiente(): boolean {
    return this.data.solicitud.estado === EstadoSolicitud.PENDIENTE_N1 ||
           this.data.solicitud.estado === EstadoSolicitud.PENDIENTE_N2;
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  close(): void {
    this.dialogRef.close();
  }

  onAprobar(): void {
    this.dialogRef.close({ action: 'aprobar' });
  }

  onRechazar(): void {
    this.dialogRef.close({ action: 'rechazar' });
  }
}
