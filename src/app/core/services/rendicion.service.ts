import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Rendicion, CategoriaGasto, EstadoRendicion } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class RendicionService {

  // Store con Signals
  private rendicionesStore = signal<Rendicion[]>([]);

  constructor() {
    this.loadMockData();
  }

  /**
   * Carga datos mock iniciales
   */
  private loadMockData(): void {
    const mockRendiciones: Rendicion[] = [
      // Rendiciones de Juan Pérez (empleadoId='1')
      {
        id: 'REN-001',
        solicitudId: 'SOL-001',
        viajeId: 'VIA-2026-001',
        destino: 'Lima',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-28'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '1',
        fecha: new Date('2026-02-15'),
        categoria: CategoriaGasto.ALIMENTACION,
        concepto: 'Almuerzo ejecutivo con cliente - Restaurante Astrid & Gastón',
        monto: 180.50,
        moneda: 'PEN',
        comprobante: 'comprobante_001.pdf',
        estado: EstadoRendicion.APROBADO
      },
      {
        id: 'REN-002',
        solicitudId: 'SOL-001',
        viajeId: 'VIA-2026-001',
        destino: 'Lima',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-28'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '1',
        fecha: new Date('2026-02-15'),
        categoria: CategoriaGasto.TRANSPORTE,
        concepto: 'Taxi aeropuerto Jorge Chávez - Hotel Costa del Sol',
        monto: 45.00,
        moneda: 'PEN',
        comprobante: 'comprobante_002.pdf',
        estado: EstadoRendicion.APROBADO
      },
      // Borrador editable para SOL-001 (Juan Pérez lo puede editar)
      {
        id: 'REN-004',
        solicitudId: 'SOL-001',
        viajeId: 'VIA-2026-001',
        destino: 'Lima',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-28'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '1',
        fecha: new Date('2026-02-16'),
        categoria: CategoriaGasto.HOSPEDAJE,
        concepto: 'Hotel Costa del Sol - 2 noches',
        justificacion: 'Alojamiento durante reunion con equipo Lima',
        monto: 320.00,
        moneda: 'PEN',
        proveedor: 'Hotel Costa del Sol',
        comprobante: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjRmZiIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjQwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzFkNGVkOCIgZm9udC13ZWlnaHQ9ImJvbGQiPkhvdGVsIENvc3RhPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzc0MTUxIj5TLyAzMjAuMDA8L3RleHQ+PC9zdmc+',
        estado: EstadoRendicion.BORRADOR
      },
      // Gasto rechazado para SOL-001 (requiere corrección)
      {
        id: 'REN-005',
        solicitudId: 'SOL-001',
        viajeId: 'VIA-2026-001',
        destino: 'Lima',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-28'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '1',
        fecha: new Date('2026-02-17'),
        categoria: CategoriaGasto.OTROS,
        concepto: 'Materiales de presentacion',
        justificacion: 'Impresion de presentacion cliente - requiere ajuste de monto',
        monto: 85.00,
        moneda: 'PEN',
        proveedor: 'Copymax',
        estado: EstadoRendicion.RECHAZADO
      },
      {
        id: 'REN-003',
        solicitudId: 'SOL-002',
        viajeId: 'VIA-2026-002',
        destino: 'Cusco',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-19'),
        aprobadorNombre: 'María García',
        empleadoId: '1',
        fecha: new Date('2026-02-16'),
        categoria: CategoriaGasto.ALIMENTACION,
        concepto: 'Cena cliente corporativo - Osaka',
        monto: 220.00,
        moneda: 'PEN',
        estado: EstadoRendicion.BORRADOR
      },
      // Rendiciones de María García (empleadoId='2', APROBADOR_N1)
      {
        id: 'REN-007',
        solicitudId: 'SOL-003',
        viajeId: 'VIA-2026-003',
        destino: 'Trujillo',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-16'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '2',
        fecha: new Date('2026-02-28'),
        categoria: CategoriaGasto.TRANSPORTE,
        concepto: 'Taxi visita sucursal Miraflores',
        monto: 35.00,
        moneda: 'PEN',
        estado: EstadoRendicion.PENDIENTE
      },
      // Rendiciones de Carlos Rodríguez (empleadoId='3', APROBADOR_N2)
      {
        id: 'REN-008',
        solicitudId: 'SOL-004',
        viajeId: 'VIA-2026-004',
        destino: 'Buenos Aires',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-23'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '3',
        fecha: new Date('2026-03-01'),
        categoria: CategoriaGasto.HOSPEDAJE,
        concepto: 'Hotel Westin - Conferencia regional',
        monto: 450.00,
        moneda: 'PEN',
        estado: EstadoRendicion.PENDIENTE
      },
      // REN-009: ALIMENTACION + PENDIENTE
      {
        id: 'REN-009',
        solicitudId: 'SOL-006',
        viajeId: 'VIA-2026-006',
        destino: 'Ica',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-14'),
        aprobadorNombre: 'María García',
        empleadoId: '5',
        fecha: new Date('2026-03-10'),
        categoria: CategoriaGasto.ALIMENTACION,
        concepto: 'Almuerzo evento regional - Restaurante El Huarango',
        monto: 65.00,
        moneda: 'PEN',
        estado: EstadoRendicion.PENDIENTE
      },
      // REN-010: ALIMENTACION + RECHAZADO
      {
        id: 'REN-010',
        solicitudId: 'SOL-005',
        viajeId: 'VIA-2026-005',
        destino: 'Chiclayo',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-30'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '4',
        fecha: new Date('2026-03-26'),
        categoria: CategoriaGasto.ALIMENTACION,
        concepto: 'Cena de trabajo - comprobante no válido',
        justificacion: 'Recibo no cumple requisitos tributarios',
        monto: 95.00,
        moneda: 'PEN',
        estado: EstadoRendicion.RECHAZADO
      },
      // REN-011: TRANSPORTE + RECHAZADO
      {
        id: 'REN-011',
        solicitudId: 'SOL-002',
        viajeId: 'VIA-2026-002',
        destino: 'Cusco',
        salida: 'Arequipa',
        retorno: 'Arequipa',
        fechaMaxRendicion: new Date('2026-03-19'),
        aprobadorNombre: 'María García',
        empleadoId: '1',
        fecha: new Date('2026-03-15'),
        categoria: CategoriaGasto.TRANSPORTE,
        concepto: 'Taxi aeropuerto - sin comprobante',
        justificacion: 'No se adjuntó recibo de movilidad requerido',
        monto: 55.00,
        moneda: 'PEN',
        estado: EstadoRendicion.RECHAZADO
      },
      // REN-012: HOSPEDAJE + APROBADO
      {
        id: 'REN-012',
        solicitudId: 'SOL-003',
        viajeId: 'VIA-2026-003',
        destino: 'Trujillo',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-16'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '2',
        fecha: new Date('2026-03-12'),
        categoria: CategoriaGasto.HOSPEDAJE,
        concepto: 'Gran Bolívar Hotel - 1 noche supervisión',
        monto: 200.00,
        moneda: 'PEN',
        comprobante: 'comprobante_012.pdf',
        estado: EstadoRendicion.APROBADO
      },
      // REN-013: HOSPEDAJE + RECHAZADO
      {
        id: 'REN-013',
        solicitudId: 'SOL-004',
        viajeId: 'VIA-2026-004',
        destino: 'Buenos Aires',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-23'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '3',
        fecha: new Date('2026-03-19'),
        categoria: CategoriaGasto.HOSPEDAJE,
        concepto: 'Consumo minibar hotel - gasto no autorizado',
        justificacion: 'Gastos personales de minibar no son reembolsables por política',
        monto: 180.00,
        moneda: 'USD',
        estado: EstadoRendicion.RECHAZADO
      },
      // REN-014: OTROS + PENDIENTE
      {
        id: 'REN-014',
        solicitudId: 'SOL-006',
        viajeId: 'VIA-2026-006',
        destino: 'Ica',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-14'),
        aprobadorNombre: 'María García',
        empleadoId: '5',
        fecha: new Date('2026-03-10'),
        categoria: CategoriaGasto.OTROS,
        concepto: 'Materiales y útiles para evento regional',
        monto: 120.00,
        moneda: 'PEN',
        proveedor: 'Librería El Estudiante',
        estado: EstadoRendicion.PENDIENTE
      },
      // REN-015: OTROS + APROBADO
      {
        id: 'REN-015',
        solicitudId: 'SOL-005',
        viajeId: 'VIA-2026-005',
        destino: 'Chiclayo',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-30'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '4',
        fecha: new Date('2026-03-26'),
        categoria: CategoriaGasto.OTROS,
        concepto: 'Papelería y útiles para auditoría',
        monto: 75.00,
        moneda: 'PEN',
        proveedor: 'Tai Loy',
        comprobante: 'comprobante_015.pdf',
        estado: EstadoRendicion.APROBADO
      },
      // REN-016: ALIMENTACION + APROBADO
      {
        id: 'REN-016',
        solicitudId: 'SOL-004',
        viajeId: 'VIA-2026-004',
        destino: 'Buenos Aires',
        salida: 'Lima',
        retorno: 'Lima',
        fechaMaxRendicion: new Date('2026-03-23'),
        aprobadorNombre: 'Carlos Rodríguez',
        empleadoId: '3',
        fecha: new Date('2026-03-18'),
        categoria: CategoriaGasto.ALIMENTACION,
        concepto: 'Desayuno de trabajo - Conferencia telecomunicaciones BA',
        monto: 42.00,
        moneda: 'USD',
        comprobante: 'comprobante_016.pdf',
        estado: EstadoRendicion.APROBADO
      }
    ];

    this.rendicionesStore.set(mockRendiciones);
  }

  /**
   * Obtener todas las rendiciones
   */
  getAll(): Observable<Rendicion[]> {
    return of(this.rendicionesStore()).pipe(delay(300));
  }

  /**
   * Obtener rendiciones por solicitud
   */
  getBySolicitudId(solicitudId: string): Observable<Rendicion[]> {
    return of(this.rendicionesStore()).pipe(
      delay(300),
      map(rendiciones => rendiciones.filter(r => r.solicitudId === solicitudId))
    );
  }

  /**
   * Obtener rendiciones por estado
   */
  getByEstado(estado: EstadoRendicion): Observable<Rendicion[]> {
    return of(this.rendicionesStore()).pipe(
      delay(300),
      map(rendiciones => rendiciones.filter(r => r.estado === estado))
    );
  }

  /**
   * Obtener una rendición por ID
   */
  getById(id: string): Observable<Rendicion | undefined> {
    return of(this.rendicionesStore().find(r => r.id === id)).pipe(delay(300));
  }

  /**
   * Crear nueva rendición
   */
  create(rendicion: Omit<Rendicion, 'id'>): Observable<Rendicion> {
    const nuevaRendicion: Rendicion = {
      ...rendicion,
      id: `REN-${Date.now()}`
    };

    const rendicionesActuales = this.rendicionesStore();
    this.rendicionesStore.set([...rendicionesActuales, nuevaRendicion]);

    return of(nuevaRendicion).pipe(delay(400));
  }

  /**
   * Actualizar rendición existente
   */
  update(id: string, cambios: Partial<Rendicion>): Observable<Rendicion> {
    const rendiciones = this.rendicionesStore();
    const index = rendiciones.findIndex(r => r.id === id);

    if (index === -1) {
      return throwError(() => new Error('Rendición no encontrada'));
    }

    const rendicionActualizada = { ...rendiciones[index], ...cambios };
    const nuevasRendiciones = [...rendiciones];
    nuevasRendiciones[index] = rendicionActualizada;

    this.rendicionesStore.set(nuevasRendiciones);

    return of(rendicionActualizada).pipe(delay(400));
  }

  /**
   * Eliminar rendición
   */
  delete(id: string): Observable<void> {
    const rendiciones = this.rendicionesStore();
    const nuevasRendiciones = rendiciones.filter(r => r.id !== id);
    this.rendicionesStore.set(nuevasRendiciones);

    return of(void 0).pipe(delay(300));
  }

  /**
   * Obtener total gastado por solicitud
   */
  getTotalBySolicitud(solicitudId: string): Observable<number> {
    return this.getBySolicitudId(solicitudId).pipe(
      map(rendiciones => rendiciones.reduce((sum, r) => sum + r.monto, 0))
    );
  }

  /**
   * Obtener total gastado por categoría
   */
  getTotalByCategoria(solicitudId: string): Observable<Record<CategoriaGasto, number>> {
    return this.getBySolicitudId(solicitudId).pipe(
      map(rendiciones => {
        const totales: Record<string, number> = {};

        // Inicializar todas las categorías en 0
        Object.values(CategoriaGasto).forEach(cat => {
          totales[cat] = 0;
        });

        // Sumar montos por categoría
        rendiciones.forEach(r => {
          totales[r.categoria] = (totales[r.categoria] || 0) + r.monto;
        });

        return totales as Record<CategoriaGasto, number>;
      })
    );
  }

  /**
   * Obtener estadísticas generales
   */
  getEstadisticas(): Observable<{
    totalPendientes: number;
    totalAprobadas: number;
    montoTotal: number;
    montoPendiente: number;
  }> {
    return of(this.rendicionesStore()).pipe(
      delay(300),
      map(rendiciones => {
        const pendientes = rendiciones.filter(r => r.estado === EstadoRendicion.PENDIENTE);
        const aprobadas = rendiciones.filter(r => r.estado === EstadoRendicion.APROBADO);

        return {
          totalPendientes: pendientes.length,
          totalAprobadas: aprobadas.length,
          montoTotal: rendiciones.reduce((sum, r) => sum + r.monto, 0),
          montoPendiente: pendientes.reduce((sum, r) => sum + r.monto, 0)
        };
      })
    );
  }

  /**
   * Signal público de solo lectura
   */
  getRendicionesSignal() {
    return this.rendicionesStore.asReadonly();
  }
}
