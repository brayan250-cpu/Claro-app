import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { SolicitudStore } from '../../../../core/stores/solicitud.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmCancelDialogComponent, ConfirmCancelDialogData } from '../../components/confirm-cancel-dialog/confirm-cancel-dialog.component';
import { Solicitud, EstadoSolicitud, UserRole } from '../../../../models';

/**
 * P-SOL-002: Listado de Solicitudes
 * Pantalla principal que muestra todas las solicitudes del usuario
 */
@Component({
  selector: 'app-listado-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    MatDividerModule
  ],
  templateUrl: './listado-solicitudes.component.html',
  styleUrls: ['./listado-solicitudes.component.scss']
})
export class ListadoSolicitudesComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private solicitudStore = inject(SolicitudStore);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  // Estado local
  searchText = signal('');
  vistaActual = signal<'EN_CURSO' | 'PENDIENTES' | 'TODOS'>('TODOS');
  
  // Estado del store
  loading = this.solicitudStore.loading;
  solicitudes = this.solicitudStore.filteredSolicitudes;
  currentFilter = this.solicitudStore.filter;
  estadisticas = this.solicitudStore.solicitudesPorEstado;

  // Tipos de vista del planner
  vistas = [
    { value: 'EN_CURSO', label: 'Viajes en curso', icon: 'flight' },
    { value: 'PENDIENTES', label: 'Pendientes', icon: 'pending_actions' },
    { value: 'TODOS', label: 'Todos los viajes', icon: 'travel_explore' }
  ] as const;

  // Rol del usuario actual
  get userRole(): UserRole | null {
    return this.authStore.userRole();
  }

  get isAprobador(): boolean {
    const role = this.userRole;
    return role === UserRole.APROBADOR_N1 || role === UserRole.APROBADOR_N2 || role === UserRole.ADMIN;
  }

  // Exponer enum para template
  readonly EstadoSolicitud = EstadoSolicitud;

  // Solicitudes filtradas por vista y búsqueda
  solicitudesFiltradas = computed(() => {
    let solicitudes = this.solicitudes();
    const vista = this.vistaActual();
    const search = this.searchText().toLowerCase().trim();

    // Filtrar por vista
    switch (vista) {
      case 'EN_CURSO':
        solicitudes = solicitudes.filter(s => 
          s.estado === EstadoSolicitud.APROBADO_N2 ||
          s.estado === EstadoSolicitud.APROBADO_N1 ||
          s.estado === EstadoSolicitud.COMPLETADO
        );
        break;
      case 'PENDIENTES':
        solicitudes = solicitudes.filter(s => 
          s.estado === EstadoSolicitud.PENDIENTE_N1 ||
          s.estado === EstadoSolicitud.PENDIENTE_N2 ||
          s.estado === EstadoSolicitud.BORRADOR
        );
        break;
      case 'TODOS':
      default:
        // Mostrar todas
        break;
    }

    // Filtrar por búsqueda
    if (search) {
      solicitudes = solicitudes.filter(s => 
        s.codigo.toLowerCase().includes(search) ||
        s.destino.toLowerCase().includes(search) ||
        s.motivoViaje.toLowerCase().includes(search)
      );
    }

    return solicitudes;
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  /**
   * Carga las solicitudes del usuario actual
   */
  cargarSolicitudes(): void {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) {
      this.toast.error('Usuario no autenticado');
      return;
    }

    this.solicitudStore.setLoading(true);
    this.solicitudService.getSolicitudes(userId).subscribe({
      next: (solicitudes) => {
        this.solicitudStore.setSolicitudes(solicitudes);
        this.actualizarContadores();
        this.solicitudStore.setLoading(false);
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.toast.error('Error al cargar las solicitudes');
        this.solicitudStore.setLoading(false);
      }
    });
  }

  /**
   * Actualiza los contadores de los filtros
   */
  actualizarContadores(): void {
    // Ya no es necesario actualizar contadores de chips individuales
  }

  /**
   * Cambia la vista del planner
   */
  cambiarVista(vista: 'EN_CURSO' | 'PENDIENTES' | 'TODOS'): void {
    this.vistaActual.set(vista);
    // Resetear filtro del store para que no interfiera
    this.solicitudStore.setFilter('ALL');
  }

  /**
   * Navega a la pantalla de nueva solicitud
   */
  nuevaSolicitud(): void {
    this.router.navigate(['/solicitudes/nueva']);
  }

  /**
   * Ver detalle de una solicitud
   */
  verDetalle(solicitud: Solicitud): void {
    this.solicitudStore.selectSolicitud(solicitud);
    this.router.navigate(['/solicitudes/detalle', solicitud.id]);
  }

  /**
   * Editar una solicitud (solo BORRADOR)
   */
  editarSolicitud(solicitud: Solicitud): void {
    if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden editar solicitudes en borrador');
      return;
    }
    this.router.navigate(['/solicitudes/editar', solicitud.id]);
  }

  /**
   * Enviar solicitud a aprobación
   */
  enviarAAprobacion(solicitud: Solicitud): void {
    if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden enviar solicitudes en borrador');
      return;
    }

    const user = this.authStore.currentUser();
    if (!user) return;

    this.solicitudService.enviarAAprobacion(solicitud.id, user.id, user.nombreCompleto).subscribe({
      next: (actualizada) => {
        this.solicitudStore.updateSolicitud(actualizada.id, actualizada);
        this.toast.success('Solicitud enviada a aprobación');
        this.actualizarContadores();
      },
      error: (error) => {
        console.error('Error al enviar solicitud:', error);
        this.toast.error(error);
      }
    });
  }

  /**
   * Cancelar una solicitud
   */
  cancelarSolicitud(solicitud: Solicitud): void {
    const dialogData: ConfirmCancelDialogData = {
      title: 'Cancelar Solicitud',
      message: '¿Está seguro que desea cancelar esta solicitud? Esta acción no se puede deshacer.',
      solicitudCodigo: solicitud.codigo,
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

        this.solicitudService.cancelarSolicitud(solicitud.id, motivo, user.id, user.nombreCompleto).subscribe({
          next: (actualizada) => {
            this.solicitudStore.updateSolicitud(actualizada.id, actualizada);
            this.toast.success('Solicitud cancelada');
            this.actualizarContadores();
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
   * Eliminar una solicitud (solo BORRADOR)
   */
  eliminarSolicitud(solicitud: Solicitud): void {
    if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
      this.toast.warning('Solo se pueden eliminar solicitudes en borrador');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Solicitud',
        message: `¿Está seguro que desea eliminar la solicitud ${solicitud.codigo}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.solicitudService.deleteSolicitud(solicitud.id).subscribe({
          next: () => {
            this.solicitudStore.removeSolicitud(solicitud.id);
            this.toast.success('Solicitud eliminada');
            this.actualizarContadores();
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
   * Obtiene la configuración del badge de estado (color + clase)
   */
  getEstadoBadge(estado: EstadoSolicitud): { color: string; class: string; icon: string } {
    switch (estado) {
      case EstadoSolicitud.BORRADOR:
        return { color: '#9e9e9e', class: 'badge-borrador', icon: 'edit_note' };
      case EstadoSolicitud.PENDIENTE_N1:
      case EstadoSolicitud.PENDIENTE_N2:
        return { color: '#ff9800', class: 'badge-pendiente', icon: 'pending' };
      case EstadoSolicitud.APROBADO_N1:
      case EstadoSolicitud.APROBADO_N2:
        return { color: '#4caf50', class: 'badge-aprobado', icon: 'check_circle' };
      case EstadoSolicitud.RECHAZADO_N1:
      case EstadoSolicitud.RECHAZADO_N2:
        return { color: '#f44336', class: 'badge-rechazado', icon: 'cancel' };
      case EstadoSolicitud.CANCELADO:
        return { color: '#607d8b', class: 'badge-cancelado', icon: 'block' };
      case EstadoSolicitud.COMPLETADO:
        return { color: '#2196f3', class: 'badge-completado', icon: 'done_all' };
      default:
        return { color: '#757575', class: 'badge-default', icon: 'help' };
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
        return 'Pend. Nivel 1';
      case EstadoSolicitud.PENDIENTE_N2:
        return 'Pend. Nivel 2';
      case EstadoSolicitud.APROBADO_N1:
        return 'Aprob. N1';
      case EstadoSolicitud.APROBADO_N2:
        return 'Aprobado';
      case EstadoSolicitud.RECHAZADO_N1:
        return 'Rechazado N1';
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
   * Formatea las fechas de viaje con año
   */
  formatFechas(fechaSalida: Date, fechaRetorno: Date): string {
    const salida = new Date(fechaSalida);
    const retorno = new Date(fechaRetorno);
    
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const salidaStr = salida.toLocaleDateString('es-PE', options);
    const retornoStr = retorno.toLocaleDateString('es-PE', options);
    
    return `${salidaStr} → ${retornoStr}`;
  }

  /**
   * MÓDULO 1.1: Formatea fecha individual en formato DD/MM/YYYY
   */
  formatFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Calcula los días hasta la fecha de salida
   */
  getDiasParaSalida(fechaSalida: Date): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const salida = new Date(fechaSalida);
    salida.setHours(0, 0, 0, 0);
    const diff = salida.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene el nivel de aprobación actual
   */
  getNivelAprobacion(estado: EstadoSolicitud): string {
    if (estado === EstadoSolicitud.APROBADO_N2 || estado === EstadoSolicitud.COMPLETADO) {
      return 'Nivel 2';
    } else if (estado === EstadoSolicitud.APROBADO_N1 || estado === EstadoSolicitud.PENDIENTE_N2) {
      return 'Nivel 1';
    } else if (estado === EstadoSolicitud.PENDIENTE_N1) {
      return 'Pendiente N1';
    }
    return '-';
  }

  /**
   * CONSIDERACIONES GENERALES: Formatea el monto con separador de miles y 2 decimales
   * Ejemplo: 1,400.00
   */
  formatMonto(monto: number): string {
    return `S/ ${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Verifica si se puede editar una solicitud
   */
  puedeEditar(solicitud: Solicitud): boolean {
    return solicitud.estado === EstadoSolicitud.BORRADOR;
  }

  /**
   * Verifica si se puede enviar una solicitud
   */
  puedeEnviar(solicitud: Solicitud): boolean {
    return solicitud.estado === EstadoSolicitud.BORRADOR;
  }

  /**
   * Verifica si se puede cancelar una solicitud
   */
  puedeCancelar(solicitud: Solicitud): boolean {
    return solicitud.estado === EstadoSolicitud.PENDIENTE_N1 ||
           solicitud.estado === EstadoSolicitud.PENDIENTE_N2 ||
           solicitud.estado === EstadoSolicitud.APROBADO_N1 ||
           solicitud.estado === EstadoSolicitud.APROBADO_N2;
  }

  /**
   * Verifica si el usuario puede aprobar esta solicitud
   */
  puedeAprobar(solicitud: Solicitud): boolean {
    if (!this.isAprobador) return false;
    
    const role = this.userRole;
    if (role === UserRole.APROBADOR_N1) {
      return solicitud.estado === EstadoSolicitud.PENDIENTE_N1;
    } else if (role === UserRole.APROBADOR_N2 || role === UserRole.ADMIN) {
      return solicitud.estado === EstadoSolicitud.PENDIENTE_N2 || solicitud.estado === EstadoSolicitud.PENDIENTE_N1;
    }
    return false;
  }

  /**
   * Verifica si el usuario puede rechazar esta solicitud
   */
  puedeRechazar(solicitud: Solicitud): boolean {
    return this.puedeAprobar(solicitud);
  }

  /**
   * Aprobar solicitud (acción de aprobador)
   */
  aprobarSolicitud(solicitud: Solicitud): void {
    if (!this.puedeAprobar(solicitud)) {
      this.toast.warning('No tiene permisos para aprobar esta solicitud');
      return;
    }

    this.toast.success(`Solicitud ${solicitud.codigo} aprobada correctamente`);
    // TODO: Implementar llamada al servicio de aprobación
  }

  /**
   * Rechazar solicitud (acción de aprobador)
   */
  rechazarSolicitud(solicitud: Solicitud): void {
    if (!this.puedeRechazar(solicitud)) {
      this.toast.warning('No tiene permisos para rechazar esta solicitud');
      return;
    }

    const dialogData: ConfirmCancelDialogData = {
      title: 'Rechazar Solicitud',
      message: '¿Está seguro que desea rechazar esta solicitud?',
      solicitudCodigo: solicitud.codigo,
      requireMotivo: true
    };

    const dialogRef = this.dialog.open(ConfirmCancelDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.toast.success(`Solicitud ${solicitud.codigo} rechazada`);
        // TODO: Implementar llamada al servicio de rechazo
      }
    });
  }

  /**
   * Registrar gastos (solo para viajes aprobados)
   */
  registrarGastos(solicitud: Solicitud): void {
    if (solicitud.estado !== EstadoSolicitud.APROBADO_N2 && solicitud.estado !== EstadoSolicitud.COMPLETADO) {
      this.toast.warning('Solo puede registrar gastos en viajes aprobados');
      return;
    }
    this.router.navigate(['/rendiciones/nuevo'], { queryParams: { solicitudId: solicitud.id } });
  }
}
