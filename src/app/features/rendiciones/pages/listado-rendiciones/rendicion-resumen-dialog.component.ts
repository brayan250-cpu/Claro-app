import { Component, Inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Rendicion, Solicitud, CategoriaGasto, EstadoRendicion } from '../../../../models';

interface RendicionResumenDialogData {
  solicitud: Solicitud;
  gastos: Rendicion[];
}

interface CategoriaBloque {
  key: CategoriaGasto;
  nombre: string;
  icono: string;
  presupuestado: number;
  rendido: number;
  porcentaje: number;
  gastos: Rendicion[];
}

@Component({
  selector: 'app-rendicion-resumen-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <!-- Lightbox overlay para ver imagen a pantalla completa -->
    <div class="lightbox-overlay" *ngIf="imagenSeleccionada()" (click)="cerrarLightbox()">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <button mat-icon-button class="lightbox-close" (click)="cerrarLightbox()">
          <mat-icon>close</mat-icon>
        </button>
        <img [src]="imagenSeleccionada()!" alt="Comprobante" />
      </div>
    </div>

    <div class="dialog-header">
      <div class="header-info">
        <div class="header-icon"><mat-icon>receipt_long</mat-icon></div>
        <div>
          <h2 mat-dialog-title>Gastos registrados</h2>
          <p class="subtitle">
            <mat-icon class="sm-icon">flight_takeoff</mat-icon>
            <strong>{{ data.solicitud.idViaje || data.solicitud.codigo }}</strong>
            &nbsp;·&nbsp; {{ data.solicitud.destino }}
          </p>
        </div>
      </div>
      <div class="header-totals">
        <p class="total-rendido">S/ {{ totalRendido().toFixed(2) }}</p>
        <p class="total-label">de S/ {{ data.solicitud.presupuestoTotal.toFixed(2) }} presupuestado</p>
        <p class="total-pct">{{ pctTotal() }}% ejecutado</p>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <!-- Empty state: sin gastos registrados -->
      <div class="empty-state" *ngIf="totalGastos() === 0">
        <mat-icon>inbox</mat-icon>
        <p>No hay gastos registrados para esta solicitud.</p>
        <button mat-flat-button color="primary" (click)="irARegistrar()">
          <mat-icon>add</mat-icon> Registrar primer gasto
        </button>
      </div>

      <!-- Bloques agrupados por categoría -->
      <div *ngIf="totalGastos() > 0">
        <div class="categoria-bloque" *ngFor="let bloque of bloques()">
          <div class="categoria-header">
            <div class="cat-title">
              <mat-icon class="cat-icon">{{ bloque.icono }}</mat-icon>
              <span class="cat-name">{{ bloque.nombre }}</span>
              <span class="cat-count" *ngIf="bloque.gastos.length > 0">({{ bloque.gastos.length }})</span>
            </div>
            <div class="cat-amounts">
              <span class="rendido-amt">S/ {{ bloque.rendido.toFixed(2) }}</span>
              <span class="presup-amt"> / S/ {{ bloque.presupuestado.toFixed(2) }}</span>
            </div>
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="bloque.porcentaje"
            [color]="bloque.porcentaje >= 100 ? 'warn' : 'primary'"
            class="cat-progress">
          </mat-progress-bar>

          <div *ngIf="bloque.gastos.length === 0" class="cat-empty">
            Sin gastos registrados en esta categoría
          </div>

          <div class="gasto-row" *ngFor="let gasto of bloque.gastos">
            <div class="gasto-left">
              <div class="thumb-wrap" *ngIf="isImage(gasto.comprobante)" (click)="verImagen(gasto)" title="Ver imagen">
                <img [src]="gasto.comprobante!" alt="Comprobante" class="thumb" />
                <div class="thumb-overlay"><mat-icon>zoom_in</mat-icon></div>
              </div>
              <div class="thumb-wrap doc-placeholder" *ngIf="!isImage(gasto.comprobante)">
                <mat-icon>{{ gasto.comprobante ? 'description' : 'image_not_supported' }}</mat-icon>
              </div>
              <div class="gasto-info">
                <strong class="gasto-concepto">{{ gasto.justificacion || gasto.concepto }}</strong>
                <span class="gasto-meta">
                  {{ formatDate(gasto.fecha) }}<span *ngIf="gasto.proveedor"> · {{ gasto.proveedor }}</span>
                </span>
              </div>
            </div>

            <div class="gasto-right">
              <span class="monto">{{ formatMontoGasto(gasto) }}</span>
              <span class="estado-chip" [class]="'estado-' + gasto.estado.toLowerCase()">
                {{ getEstadoLabel(gasto.estado) }}
              </span>
              <div class="gasto-actions">
                <button mat-stroked-button
                  [matTooltip]="gasto.comprobante ? (isImage(gasto.comprobante) ? 'Ver imagen' : 'Ver documento') : 'Sin comprobante adjunto'"
                  [disabled]="!gasto.comprobante"
                  (click)="verComprobante(gasto)">
                  <mat-icon>visibility</mat-icon> Ver
                </button>
                <button mat-stroked-button color="primary"
                  [matTooltip]="puedeEditar(gasto) ? 'Editar gasto' : 'No editable: ' + getEstadoLabel(gasto.estado)"
                  [disabled]="!puedeEditar(gasto)"
                  (click)="editarGasto(gasto)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" (click)="irARegistrar()">
        <mat-icon>add</mat-icon> Registrar gasto
      </button>
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* ── Lightbox ───────────────────────────────────────────── */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
    }

    .lightbox-content {
      position: relative;
      max-width: 92vw;
      max-height: 88vh;
      cursor: default;

      img {
        display: block;
        max-width: 100%;
        max-height: 86vh;
        border-radius: 8px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.5);
        object-fit: contain;
      }
    }

    .lightbox-close {
      position: absolute;
      top: -14px;
      right: -14px;
      background: white !important;
      color: #333 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 1;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px 14px;
      background: linear-gradient(135deg, #fff6f6 0%, #f7fbff 100%);
      border-bottom: 1px solid #e6ebf2;
    }

    .header-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;

      .header-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #e53935, #ff7043);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon { color: white; }
      }

      h2 { margin: 0; font-size: 16px; }

      .subtitle {
        margin: 4px 0 0;
        color: #4b5563;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .sm-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .header-totals {
      text-align: right;
      flex-shrink: 0;

      .total-rendido { margin: 0; font-size: 18px; font-weight: 800; color: #1d4ed8; }
      .total-label   { margin: 2px 0 0; font-size: 11px; color: #6b7280; }
      .total-pct     { margin: 2px 0 0; font-size: 11px; color: #374151; font-weight: 600; }
    }

    .close-btn { flex-shrink: 0; margin-top: -4px; }

    /* ── Content ─────────────────────────────────────────────── */
    mat-dialog-content {
      min-width: 580px;
      max-width: 90vw;
      max-height: 65vh;
      padding: 16px 20px;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 36px 20px;
      text-align: center;

      mat-icon { font-size: 52px; width: 52px; height: 52px; color: #9ca3af; }
      p { margin: 0; color: #6b7280; font-size: 14px; }
    }

    /* ── Bloque categoría ────────────────────────────────────── */
    .categoria-bloque { margin-bottom: 20px; }

    .categoria-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;

      .cat-title {
        display: flex;
        align-items: center;
        gap: 6px;

        .cat-icon  { font-size: 18px; width: 18px; height: 18px; color: #4b5563; }
        .cat-name  { font-size: 13px; font-weight: 700; color: #1f2937; }
        .cat-count { font-size: 11px; color: #9ca3af; }
      }

      .cat-amounts {
        font-size: 12px;

        .rendido-amt { font-weight: 700; color: #1d4ed8; }
        .presup-amt  { color: #9ca3af; }
      }
    }

    .cat-progress {
      height: 6px !important;
      border-radius: 3px;
      margin-bottom: 8px;
    }

    .cat-empty {
      font-size: 12px;
      color: #9ca3af;
      padding: 8px 4px;
      font-style: italic;
    }

    /* ── Fila de gasto ───────────────────────────────────────── */
    .gasto-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: 1px solid #e6e9ef;
      border-radius: 8px;
      margin-bottom: 6px;
      background: #fff;
      transition: border-color .15s, box-shadow .15s;

      &:hover {
        border-color: #c7d2fe;
        box-shadow: 0 2px 8px rgba(30,64,175,.07);
      }
    }

    .gasto-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .thumb-wrap {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #ddd;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      position: relative;
      cursor: pointer;

      &.doc-placeholder {
        background: #eff6ff;
        border-color: #bfdbfe;
        cursor: default;

        mat-icon { color: #3b82f6; font-size: 22px; }
      }
    }

    .thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.35);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity .15s;

      mat-icon { color: white; font-size: 20px; }
    }

    .thumb-wrap:not(.doc-placeholder):hover .thumb-overlay { opacity: 1; }

    .gasto-info {
      min-width: 0;

      .gasto-concepto {
        display: block;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .gasto-meta {
        display: block;
        font-size: 11px;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .gasto-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .monto {
      font-weight: 800;
      color: #e11d48;
      font-size: 13px;
      white-space: nowrap;
    }

    .estado-chip {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;

      &.estado-borrador   { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      &.estado-pendiente  { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; }
      &.estado-aprobado   { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
      &.estado-rechazado  { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    }

    .gasto-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;

      button {
        font-weight: 600;
        font-size: 12px;
        padding: 0 10px;
        height: 32px;
        line-height: 32px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
      }
    }

    /* ── Footer ──────────────────────────────────────────────── */
    mat-dialog-actions {
      padding: 12px 20px;
      border-top: 1px solid #e6ebf2;
      gap: 8px;
    }

    @media (max-width: 768px) {
      mat-dialog-content { min-width: auto; }
      .gasto-row { flex-wrap: wrap; }
      .gasto-right { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class RendicionResumenDialogComponent {
  imagenSeleccionada = signal<string | null>(null);

  bloques = computed<CategoriaBloque[]>(() => {
    const sol = this.data.solicitud;
    const gastos = this.data.gastos;
    const presupuesto = sol.presupuestoTotal;
    const duracionDias = this.calcularDias(sol.fechaSalida, sol.fechaRetorno);
    const pctAlojamiento = duracionDias > 5 ? 0.40 : 0.35;
    const pctTransporte  = duracionDias > 5 ? 0.15 : 0.20;

    const defs: Array<{ key: CategoriaGasto; nombre: string; icono: string; pct: number }> = [
      { key: CategoriaGasto.HOSPEDAJE,    nombre: 'Alojamiento',  icono: 'hotel',          pct: pctAlojamiento },
      { key: CategoriaGasto.ALIMENTACION, nombre: 'Alimentación', icono: 'restaurant',     pct: 0.30 },
      { key: CategoriaGasto.TRANSPORTE,   nombre: 'Transporte',   icono: 'directions_car', pct: pctTransporte },
      { key: CategoriaGasto.OTROS,        nombre: 'Otros',        icono: 'more_horiz',     pct: 0.05 },
    ];

    return defs.map(d => {
      const gCat = gastos
        .filter(g => g.categoria === d.key)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const rendido = gCat.reduce((s, g) => s + g.monto, 0);
      const presupuestado = presupuesto * d.pct;
      return {
        key: d.key,
        nombre: d.nombre,
        icono: d.icono,
        presupuestado,
        rendido,
        porcentaje: presupuestado > 0 ? Math.min(Math.round((rendido / presupuestado) * 100), 100) : 0,
        gastos: gCat
      };
    });
  });

  totalRendido = computed(() => this.data.gastos.reduce((s, g) => s + g.monto, 0));
  totalGastos  = computed(() => this.data.gastos.length);
  pctTotal     = computed(() => {
    const p = this.data.solicitud.presupuestoTotal;
    return p > 0 ? Math.round((this.totalRendido() / p) * 100) : 0;
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RendicionResumenDialogData,
    private dialogRef: MatDialogRef<RendicionResumenDialogComponent>,
    private router: Router
  ) {}

  verImagen(gasto: Rendicion): void {
    if (gasto.comprobante && this.isImage(gasto.comprobante)) {
      this.imagenSeleccionada.set(gasto.comprobante);
    }
  }

  cerrarLightbox(): void {
    this.imagenSeleccionada.set(null);
  }

  verComprobante(gasto: Rendicion): void {
    if (!gasto.comprobante) return;
    if (this.isImage(gasto.comprobante)) {
      this.imagenSeleccionada.set(gasto.comprobante);
    } else if (gasto.comprobante.startsWith('data:') || gasto.comprobante.startsWith('http')) {
      window.open(gasto.comprobante, '_blank', 'noopener,noreferrer');
    } else {
      // Mock filename — show as notification since file doesn't exist in prototype
      this.imagenSeleccionada.set(null);
      alert(`📄 Documento adjunto: ${gasto.comprobante}`);
    }
  }

  editarGasto(gasto: Rendicion): void {
    this.dialogRef.close();
    this.router.navigate(['/rendiciones/editar', gasto.id]);
  }

  irARegistrar(): void {
    this.dialogRef.close();
    this.router.navigate(['/rendiciones/nuevo'], {
      queryParams: { solicitudId: this.data.solicitud.id }
    });
  }

  puedeEditar(gasto: Rendicion): boolean {
    return gasto.estado === EstadoRendicion.BORRADOR ||
           gasto.estado === EstadoRendicion.RECHAZADO ||
           gasto.estado === EstadoRendicion.PENDIENTE;
  }

  getEstadoLabel(estado: EstadoRendicion): string {
    const labels: Record<EstadoRendicion, string> = {
      [EstadoRendicion.BORRADOR]:  'Borrador',
      [EstadoRendicion.PENDIENTE]: 'Pendiente',
      [EstadoRendicion.APROBADO]:  'Aprobado',
      [EstadoRendicion.RECHAZADO]: 'Rechazado'
    };
    return labels[estado] || estado;
  }

  formatMontoGasto(gasto: Rendicion): string {
    const symbol = gasto.moneda === 'USD' ? 'US$' : gasto.moneda === 'EUR' ? '€' : 'S/';
    return `${symbol} ${gasto.monto.toFixed(2)}`;
  }

  isImage(file?: string): boolean {
    if (!file) return false;
    return file.startsWith('data:image') || /\.(png|jpg|jpeg|webp)$/i.test(file);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  private calcularDias(fechaSalida: Date | string, fechaRetorno: Date | string): number {
    const s = new Date(fechaSalida);
    const r = new Date(fechaRetorno);
    return Math.ceil(Math.abs(r.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  }
}
