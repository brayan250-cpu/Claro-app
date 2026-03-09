import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Rendicion, CategoriaGasto } from '../../models';

@Component({
  selector: 'app-rendicion-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <mat-icon [class]="'categoria-icon ' + getCategoriaClass(data.rendicion.categoria)">
          {{ getCategoriaIcon(data.rendicion.categoria) }}
        </mat-icon>
        <div>
          <h2 mat-dialog-title>Detalle de Gasto</h2>
          <p class="dialog-subtitle">{{ data.rendicion.id }} - Viaje {{ data.rendicion.viajeId || data.rendicion.solicitudId }}</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="detalle-section">
        <div class="decision-strip" *ngIf="data.showActions && data.rendicion.estado === 'PENDIENTE'">
          <mat-icon>approval</mat-icon>
          <span>Este gasto esta pendiente de tu decision.</span>
        </div>

        <div class="estado-badge">
          <mat-chip [class]="'estado-chip ' + data.rendicion.estado.toLowerCase()">
            <mat-icon>{{ getEstadoIcon(data.rendicion.estado) }}</mat-icon>
            {{ getEstadoLabel(data.rendicion.estado) }}
          </mat-chip>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <mat-icon>description</mat-icon>
            <div>
              <span class="label">Justificación</span>
              <span class="value">{{ data.rendicion.justificacion || data.rendicion.concepto }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>badge</mat-icon>
            <div>
              <span class="label">Viaje</span>
              <span class="value">{{ data.rendicion.viajeId || data.rendicion.solicitudId }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>groups</mat-icon>
            <div>
              <span class="label">Aprobador</span>
              <span class="value">{{ data.rendicion.aprobadorNombre || 'Por asignar' }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>payments</mat-icon>
            <div>
              <span class="label">Importe de la rendición</span>
              <span class="value monto">{{ data.rendicion.moneda }} {{ data.rendicion.monto.toFixed(2) }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>category</mat-icon>
            <div>
              <span class="label">Categoría</span>
              <span class="value">{{ data.rendicion.categoria }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>event</mat-icon>
            <div>
              <span class="label">Fecha del Gasto</span>
              <span class="value">{{ formatDate(data.rendicion.fecha) }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>badge</mat-icon>
            <div>
              <span class="label">Solicitud Relacionada</span>
              <span class="value">{{ data.rendicion.solicitudId }}</span>
            </div>
          </div>

          <div class="info-item">
            <mat-icon>person</mat-icon>
            <div>
              <span class="label">Empleado</span>
              <span class="value">{{ data.rendicion.empleadoId }}</span>
            </div>
          </div>
        </div>

        @if (data.rendicion.comprobante) {
          <div class="comprobante-section">
            <div class="section-header">
              <mat-icon>receipt_long</mat-icon>
              <h3>Comprobante</h3>
            </div>
            
            @if (isImage(data.rendicion.comprobante)) {
              <div class="comprobante-preview">
                <img [src]="data.rendicion.comprobante" alt="Comprobante" />
              </div>
            } @else {
              <div class="comprobante-file">
                <mat-icon>insert_drive_file</mat-icon>
                <span>{{ data.rendicion.comprobante }}</span>
                <button mat-stroked-button color="primary" (click)="openComprobante()">
                  <mat-icon>visibility</mat-icon>
                  Ver documento
                </button>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
      @if (data.showActions && data.rendicion.estado === 'PENDIENTE') {
        <button mat-stroked-button color="warn" (click)="onRechazar()">
          <mat-icon>close</mat-icon>
          Rechazar
        </button>
        <button mat-flat-button color="primary" (click)="onAprobar()">
          <mat-icon>check</mat-icon>
          Aprobar
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e0e0e0;

      .header-content {
        display: flex;
        gap: 16px;
        align-items: center;

        .categoria-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;

          &.transporte {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.hospedaje {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.alimentacion {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.otros {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
          }
        }

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .dialog-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: #666;
        }
      }
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .detalle-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .decision-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #ffd59f;
      background: #fff4e5;
      color: #6b3e00;
      font-size: 13px;
      font-weight: 500;

      mat-icon {
        color: #e65100;
      }
    }

    .estado-badge {
      display: flex;
      justify-content: center;

      .estado-chip {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &.pendiente {
          background: #fff3e0;
          color: #e65100;
        }

        &.aprobado {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.rechazado {
          background: #ffebee;
          color: #c62828;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .info-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid #667eea;

      mat-icon {
        color: #667eea;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .label {
        font-size: 12px;
        color: #666;
        font-weight: 500;
      }

      .value {
        font-size: 15px;
        color: #212121;
        font-weight: 500;
        word-break: break-word;

        &.monto {
          font-size: 18px;
          color: #667eea;
          font-weight: 600;
        }
      }
    }

    .comprobante-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 20px;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        mat-icon {
          color: #667eea;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #212121;
        }
      }

      .comprobante-preview {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e0e0e0;

        img {
          width: 100%;
          height: auto;
          display: block;
        }
      }

      .comprobante-file {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px dashed #bdbdbd;

        mat-icon {
          color: #666;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        span {
          flex: 1;
          font-size: 14px;
          color: #424242;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      gap: 16px;
      display: flex;
      align-items: center;

      button[mat-button] {
        margin-right: auto;
      }

      button[mat-stroked-button],
      button[mat-flat-button] {
        border-radius: 10px;
        font-weight: 600;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  `]
})
export class RendicionDetalleDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { rendicion: Rendicion, showActions: boolean },
    private dialogRef: MatDialogRef<RendicionDetalleDialogComponent>
  ) {}

  getCategoriaIcon(categoria: CategoriaGasto): string {
    const icons: Record<CategoriaGasto, string> = {
      [CategoriaGasto.TRANSPORTE]: 'directions_car',
      [CategoriaGasto.HOSPEDAJE]: 'hotel',
      [CategoriaGasto.ALIMENTACION]: 'restaurant',
      [CategoriaGasto.OTROS]: 'receipt'
    };
    return icons[categoria];
  }

  getCategoriaClass(categoria: CategoriaGasto): string {
    return categoria.toLowerCase();
  }

  getEstadoIcon(estado: string): string {
    const icons: Record<string, string> = {
      'PENDIENTE': 'schedule',
      'APROBADO': 'check_circle',
      'RECHAZADO': 'cancel'
    };
    return icons[estado] || 'help';
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado'
    };
    return labels[estado] || estado;
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  isImage(filename: string): boolean {
    if (!filename) return false;
    return filename.startsWith('data:image/') || 
           /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  }

  onAprobar(): void {
    this.dialogRef.close({ action: 'aprobar' });
  }

  onRechazar(): void {
    this.dialogRef.close({ action: 'rechazar' });
  }

  openComprobante(): void {
    if (!this.data.rendicion.comprobante) return;
    window.open(this.data.rendicion.comprobante, '_blank', 'noopener,noreferrer');
  }
}
