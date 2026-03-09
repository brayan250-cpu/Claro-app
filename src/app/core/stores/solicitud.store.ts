import { Injectable, signal, computed } from '@angular/core';
import { Solicitud, EstadoSolicitud } from '../../models';

/**
 * Store de Solicitudes usando Signals
 * Maneja el estado global de solicitudes
 */
@Injectable({
  providedIn: 'root'
})
export class SolicitudStore {
  // Signals privados
  private readonly _solicitudes = signal<Solicitud[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _selectedSolicitud = signal<Solicitud | null>(null);
  private readonly _filter = signal<EstadoSolicitud | 'ALL'>('ALL');

  // Signals públicos (readonly)
  readonly solicitudes = this._solicitudes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedSolicitud = this._selectedSolicitud.asReadonly();
  readonly filter = this._filter.asReadonly();

  // Computed signals
  readonly filteredSolicitudes = computed(() => {
    const solicitudes = this._solicitudes();
    const filter = this._filter();

    if (filter === 'ALL') {
      return solicitudes;
    }

    return solicitudes.filter(s => s.estado === filter);
  });

  readonly solicitudesPorEstado = computed(() => {
    const solicitudes = this._solicitudes();
    return {
      borrador: solicitudes.filter(s => s.estado === EstadoSolicitud.BORRADOR).length,
      pendientes: solicitudes.filter(s => 
        s.estado === EstadoSolicitud.PENDIENTE_N1 || 
        s.estado === EstadoSolicitud.PENDIENTE_N2
      ).length,
      aprobadas: solicitudes.filter(s => 
        s.estado === EstadoSolicitud.APROBADO_N1 || 
        s.estado === EstadoSolicitud.APROBADO_N2
      ).length,
      rechazadas: solicitudes.filter(s => 
        s.estado === EstadoSolicitud.RECHAZADO_N1 || 
        s.estado === EstadoSolicitud.RECHAZADO_N2
      ).length,
      canceladas: solicitudes.filter(s => s.estado === EstadoSolicitud.CANCELADO).length,
      total: solicitudes.length
    };
  });

  /**
   * Establece la lista de solicitudes
   */
  setSolicitudes(solicitudes: Solicitud[]): void {
    this._solicitudes.set(solicitudes);
  }

  /**
   * Agrega una nueva solicitud
   */
  addSolicitud(solicitud: Solicitud): void {
    this._solicitudes.update(solicitudes => [solicitud, ...solicitudes]);
  }

  /**
   * Actualiza una solicitud existente
   */
  updateSolicitud(id: string, updates: Partial<Solicitud>): void {
    this._solicitudes.update(solicitudes => 
      solicitudes.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  }

  /**
   * Elimina una solicitud
   */
  removeSolicitud(id: string): void {
    this._solicitudes.update(solicitudes => 
      solicitudes.filter(s => s.id !== id)
    );
  }

  /**
   * Selecciona una solicitud
   */
  selectSolicitud(solicitud: Solicitud | null): void {
    this._selectedSolicitud.set(solicitud);
  }

  /**
   * Establece el filtro de estado
   */
  setFilter(filter: EstadoSolicitud | 'ALL'): void {
    this._filter.set(filter);
  }

  /**
   * Establece el estado de carga
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Limpia el store
   */
  clear(): void {
    this._solicitudes.set([]);
    this._selectedSolicitud.set(null);
    this._filter.set('ALL');
  }

  /**
   * Obtiene una solicitud por ID
   */
  getSolicitudById(id: string): Solicitud | undefined {
    return this._solicitudes().find(s => s.id === id);
  }
}
