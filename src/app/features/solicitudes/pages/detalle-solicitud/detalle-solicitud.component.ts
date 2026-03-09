import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { RendicionService } from '../../../../core/services/rendicion.service';
import { SolicitudStore } from '../../../../core/stores/solicitud.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmCancelDialogComponent, ConfirmCancelDialogData } from '../../components/confirm-cancel-dialog/confirm-cancel-dialog.component';
import { Solicitud, EstadoSolicitud, UserRole, Rendicion } from '../../../../models';

/**
 * P-SOL-003: Detalle de Solicitud
 * Muestra el detalle completo de una solicitud con su historial
 */
@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './detalle-solicitud.component.html',
  styleUrls: ['./detalle-solicitud.component.scss']
})
export class DetalleSolicitudComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private solicitudService = inject(SolicitudService);
  private rendicionService = inject(RendicionService);
  private solicitudStore = inject(SolicitudStore);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  // Para usar en el template
  Math = Math;

  solicitud = signal<Solicitud | null>(null);
  rendicionesSolicitud = signal<Rendicion[]>([]);
  loading = signal(false);

  // Computed para el mini reporte de presupuesto vs gastos
  totalGastado = computed(() => {
    const sol = this.solicitud();
    if (!sol || !sol.rendiciones || sol.rendiciones.length === 0) return 0;
    return sol.rendiciones.reduce((sum, r) => sum + r.monto, 0);
  });

  saldoRestante = computed(() => {
    const sol = this.solicitud();
    if (!sol) return 0;
    return sol.presupuestoTotal - this.totalGastado();
  });

  porcentajeUsado = computed(() => {
    const sol = this.solicitud();
    if (!sol || sol.presupuestoTotal === 0) return 0;
    return (this.totalGastado() / sol.presupuestoTotal) * 100;
  });

  excedioPresupuesto = computed(() => this.saldoRestante() < 0);

  // Feedback Jorge 0849: distribución de gastos por categoría con porcentajes
  // MÓDULO 2.1: Desglose de viáticos por 5 conceptos con auto-cálculo
  distribucionGastos = computed(() => {
    const sol = this.solicitud();
    if (!sol) {
      return this.getConceptosViaticos(0, undefined, undefined);
    }

    // Si hay rendiciones, mostrar gastos reales
    if (sol.rendiciones && sol.rendiciones.length > 0) {
      const total = this.totalGastado();
      if (total === 0) {
        return this.getConceptosViaticos(sol.presupuestoTotal || 0, sol.fechaSalida, sol.fechaRetorno);
      }

      const categorias = ['Alojamiento', 'Alimentación', 'Transporte', 'Impuestos', 'Otros'];
      return categorias.map(cat => {
        const montoCategoria = sol.rendiciones!
          .filter(r => r.categoria === cat)
          .reduce((sum, r) => sum + r.monto, 0);
        return {
          categoria: cat,
          monto: montoCategoria,
          porcentaje: (montoCategoria / total) * 100
        };
      });
    }

    // Si no hay rendiciones, mostrar presupuesto estimado auto-calculado
    return this.getConceptosViaticos(sol.presupuestoTotal || 0, sol.fechaSalida, sol.fechaRetorno);
  });

  /**
   * MÓDULO 2.1: Auto-cálculo de montos por concepto según presupuesto total y duración del viaje
   */
  getConceptosViaticos(presupuestoTotal: number, fechaSalida?: Date, fechaRetorno?: Date): any[] {
    const dias = this.calcularDiasViaje(fechaSalida, fechaRetorno);
    
    // Distribución porcentual basada en duración (ajustable según políticas)
    let porcentajes = {
      Alojamiento: 35,
      Alimentación: 30,
      Transporte: 20,
      Impuestos: 10,
      Otros: 5
    };

    // Ajustar según duración: viajes más largos tienen más gastos de alojamiento/comida
    if (dias > 5) {
      porcentajes = {
        Alojamiento: 40,
        Alimentación: 30,
        Transporte: 15,
        Impuestos: 10,
        Otros: 5
      };
    }

    return Object.entries(porcentajes).map(([categoria, porcentaje]) => ({
      categoria,
      porcentaje,
      monto: (presupuestoTotal * porcentaje) / 100
    }));
  }

  /**
   * Calcula la cantidad de días del viaje
   */
  calcularDiasViaje(fechaSalida?: Date, fechaRetorno?: Date): number {
    if (!fechaSalida || !fechaRetorno) return 1;
    const salida = new Date(fechaSalida);
    const retorno = new Date(fechaRetorno);
    const diff = retorno.getTime() - salida.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día de salida
  }

  // Feedback Jorge 0248: verificar si el usuario es aprobador para mostrar/ocultar campos
  esAprobador = computed(() => {
    const user = this.authStore.currentUser();
    return user?.rol === UserRole.APROBADOR_N1 || user?.rol === UserRole.APROBADOR_N2;
  });

  // Computed para verificar permisos
  puedeEditar = computed(() => {
    const sol = this.solicitud();
    return sol?.estado === EstadoSolicitud.BORRADOR;
  });

  puedeEnviar = computed(() => {
    const sol = this.solicitud();
    return sol?.estado === EstadoSolicitud.BORRADOR;
  });

  puedeCancelar = computed(() => {
    const sol = this.solicitud();
    return sol?.estado === EstadoSolicitud.PENDIENTE_N1 ||
           sol?.estado === EstadoSolicitud.PENDIENTE_N2 ||
           sol?.estado === EstadoSolicitud.APROBADO_N1 ||
           sol?.estado === EstadoSolicitud.APROBADO_N2;
  });

  puedeEliminar = computed(() => {
    const sol = this.solicitud();
    return sol?.estado === EstadoSolicitud.BORRADOR;
  });

  // Columnas de tablas
  pasajesColumns = ['tipo', 'origen', 'destino', 'fecha', 'monto'];
  hospedajesColumns = ['hotel', 'ciudad', 'fechas', 'noches', 'monto'];

  ngOnInit(): void {
    this.cargarSolicitud();
  }

  /**
   * Carga la solicitud desde la ruta
   */
  cargarSolicitud(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.toast.error('ID de solicitud no válido');
      this.router.navigate(['/solicitudes']);
      return;
    }

    this.loading.set(true);
    
    this.solicitudService.getSolicitudById(id).subscribe({
      next: (solicitud) => {
        this.solicitud.set(solicitud);
        this.solicitudStore.selectSolicitud(solicitud);
        if (solicitud?.id) {
          this.cargarRendicionesSolicitud(solicitud.id);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar solicitud:', error);
        this.toast.error('Error al cargar la solicitud');
        this.router.navigate(['/solicitudes']);
        this.loading.set(false);
      }
    });
  }

  cargarRendicionesSolicitud(solicitudId: string): void {
    this.rendicionService.getBySolicitudId(solicitudId).subscribe({
      next: (rendiciones) => this.rendicionesSolicitud.set(rendiciones),
      error: () => this.rendicionesSolicitud.set([])
    });
  }

  /**
   * Navega al listado
   */
  volver(): void {
    this.router.navigate(['/solicitudes']);
  }

  /**
   * Editar solicitud
   */
  editar(): void {
    const sol = this.solicitud();
    if (!sol) return;

    if (sol.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden editar solicitudes en borrador');
      return;
    }

    this.router.navigate(['/solicitudes/editar', sol.id]);
  }

  /**
   * Enviar a aprobación
   */
  enviarAAprobacion(): void {
    const sol = this.solicitud();
    if (!sol) return;

    if (sol.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden enviar solicitudes en borrador');
      return;
    }

    const user = this.authStore.currentUser();
    if (!user) return;

    this.solicitudService.enviarAAprobacion(sol.id, user.id, user.nombreCompleto).subscribe({
      next: (actualizada) => {
        this.solicitud.set(actualizada);
        this.solicitudStore.updateSolicitud(actualizada.id, actualizada);
        this.toast.success('Solicitud enviada a aprobación');
      },
      error: (error) => {
        console.error('Error al enviar solicitud:', error);
        this.toast.error(error);
      }
    });
  }

  /**
   * Cancelar solicitud
   */
  cancelar(): void {
    const sol = this.solicitud();
    if (!sol) return;

    const dialogData: ConfirmCancelDialogData = {
      title: 'Cancelar Solicitud',
      message: '¿Está seguro que desea cancelar esta solicitud? Esta acción no se puede deshacer.',
      solicitudCodigo: sol.codigo,
      requireMotivo: true
    };

    const dialogRef = this.dialog.open(ConfirmCancelDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        const user = this.authStore.currentUser();
        if (!user) return;

        this.solicitudService.cancelarSolicitud(sol.id, motivo, user.id, user.nombreCompleto).subscribe({
          next: (actualizada) => {
            this.solicitud.set(actualizada);
            this.solicitudStore.updateSolicitud(actualizada.id, actualizada);
            this.toast.success('Solicitud cancelada');
          },
          error: (error) => {
            console.error('Error al cancelar solicitud:', error);
            this.toast.error(error);
          }
        });
      }
    });
  }

  /**
   * Eliminar solicitud
   */
  eliminar(): void {
    const sol = this.solicitud();
    if (!sol) return;

    if (sol.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden eliminar solicitudes en borrador');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Solicitud',
        message: `¿Está seguro que desea eliminar la solicitud ${sol.codigo}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.solicitudService.deleteSolicitud(sol.id).subscribe({
          next: () => {
            this.solicitudStore.removeSolicitud(sol.id);
            this.toast.success('Solicitud eliminada');
            this.router.navigate(['/solicitudes']);
          },
          error: (error) => {
            console.error('Error al eliminar solicitud:', error);
            this.toast.error(error);
          }
        });
      }
    });
  }

  /**
   * Obtiene la clase CSS para el chip de estado
   */
  getEstadoClass(estado: EstadoSolicitud): string {
    switch (estado) {
      case EstadoSolicitud.BORRADOR:
        return 'estado-borrador';
      case EstadoSolicitud.PENDIENTE_N1:
      case EstadoSolicitud.PENDIENTE_N2:
        return 'estado-pendiente';
      case EstadoSolicitud.APROBADO_N1:
      case EstadoSolicitud.APROBADO_N2:
        return 'estado-aprobado';
      case EstadoSolicitud.RECHAZADO_N1:
      case EstadoSolicitud.RECHAZADO_N2:
        return 'estado-rechazado';
      case EstadoSolicitud.CANCELADO:
        return 'estado-cancelado';
      case EstadoSolicitud.COMPLETADO:
        return 'estado-completado';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto legible del estado
   */
  getEstadoLabel(estado: EstadoSolicitud): string {
    switch (estado) {
      case EstadoSolicitud.BORRADOR:
        return 'Borrador';
      case EstadoSolicitud.PENDIENTE_N1:
        return 'Pendiente Aprobación Nivel 1';
      case EstadoSolicitud.PENDIENTE_N2:
        return 'Pendiente Aprobación Nivel 2';
      case EstadoSolicitud.APROBADO_N1:
        return 'Aprobado Nivel 1';
      case EstadoSolicitud.APROBADO_N2:
        return 'Aprobado';
      case EstadoSolicitud.RECHAZADO_N1:
        return 'Rechazado Nivel 1';
      case EstadoSolicitud.RECHAZADO_N2:
        return 'Rechazado';
      case EstadoSolicitud.CANCELADO:
        return 'Cancelado';
      case EstadoSolicitud.COMPLETADO:
        return 'Completado';
      default:
        return estado;
    }
  }

  /**
   * Formatea fecha DD/MM (feedback Jorge 0157)
   */
  formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  /**
   * Formatea monto
   */
  formatMonto(monto: number): string {
    return `S/ ${monto.toFixed(2)}`;
  }

  formatMontoRendicion(r: Rendicion): string {
    const symbol = r.moneda === 'USD' ? 'US$' : 'S/';
    return `${symbol} ${r.monto.toFixed(2)}`;
  }

  getEstadoRendicionLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado'
    };
    return labels[estado] || estado;
  }

  isImageComprobante(comprobante?: string): boolean {
    return !!comprobante && comprobante.startsWith('data:image/');
  }

  abrirComprobante(r: Rendicion): void {
    if (!r.comprobante) {
      this.toast.warning('Este gasto no tiene comprobante adjunto');
      return;
    }
    window.open(r.comprobante, '_blank', 'noopener,noreferrer');
  }

  /**
   * Calcula el monto total de hospedaje
   */
  calcularMontoHospedaje(noches: number, montoPorNoche: number): number {
    return noches * montoPorNoche;
  }

  /**
   * Formatea rango de fechas de hospedaje
   */
  formatFechasHospedaje(checkIn: Date, checkOut: Date): string {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${checkInDate.toLocaleDateString('es-PE', options)} - ${checkOutDate.toLocaleDateString('es-PE', options)}`;
  }

  /**
   * Obtiene el icono de Material para cada categoría de gasto (Feedback Jorge 0849)
   */
  getCategoriaIcon(categoria: string): string {
    const iconMap: Record<string, string> = {
      'Alojamiento': 'hotel',
      'Alimentación': 'restaurant',
      'Transporte': 'directions_car',
      'Impuestos': 'receipt_long',
      'Otros': 'more_horiz'
    };
    return iconMap[categoria] || 'category';
  }
}
