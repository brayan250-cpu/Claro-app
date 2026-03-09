import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Solicitud, EstadoSolicitud, PasajeInfo, HospedajeInfo, HistorialEstado, TipoPasaje } from '../../models';
import { StorageService } from './storage.service';

/**
 * Servicio de Solicitudes (Mock)
 * Simula operaciones CRUD contra un backend
 */
@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private readonly STORAGE_KEY = 'solicitudes';
  private solicitudes: Solicitud[] = [];

  constructor(private storageService: StorageService) {
    this.loadSolicitudes();
    if (this.solicitudes.length < 10) {
      this.initializeMockData();
    }
  }

  /**
   * Obtiene todas las solicitudes del usuario actual
   */
  getSolicitudes(empleadoId?: string): Observable<Solicitud[]> {
    return of(null).pipe(
      delay(600),
      map(() => {
        let result = [...this.solicitudes];
        if (empleadoId) {
          result = result.filter(s => s.empleadoId === empleadoId);
        }
        return result.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
      })
    );
  }

  /**
   * Obtiene una solicitud por ID
   */
  getSolicitudById(id: string): Observable<Solicitud | null> {
    return of(null).pipe(
      delay(400),
      map(() => {
        const solicitud = this.solicitudes.find(s => s.id === id);
        return solicitud || null;
      })
    );
  }

  /**
   * Crea una nueva solicitud
   */
  createSolicitud(solicitud: Partial<Solicitud>, empleadoId: string, empleadoNombre: string): Observable<Solicitud> {
    return of(null).pipe(
      delay(800),
      map(() => {
        const newSolicitud: Solicitud = {
          id: this.generateId(),
          codigo: this.generateCodigo(),
          empleadoId,
          empleadoNombre,
          fechaCreacion: new Date(),
          fechaSalida: solicitud.fechaSalida || new Date(),
          fechaRetorno: solicitud.fechaRetorno || new Date(),
          destino: solicitud.destino || '',
          motivoViaje: solicitud.motivoViaje || '',
          centroCosto: solicitud.centroCosto || '',
          presupuestoTotal: solicitud.presupuestoTotal || 0,
          monedaAnticipo: solicitud.monedaAnticipo || 'PEN',
          estado: EstadoSolicitud.BORRADOR,
          pasajes: solicitud.pasajes || [],
          hospedajes: solicitud.hospedajes || [],
          rendiciones: [],
          historialEstados: [{
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date(),
            usuario: empleadoNombre,
            comentario: 'Solicitud creada'
          }]
        };

        this.solicitudes.push(newSolicitud);
        this.saveSolicitudes();
        return newSolicitud;
      })
    );
  }

  /**
   * Actualiza una solicitud existente
   */
  updateSolicitud(id: string, updates: Partial<Solicitud>): Observable<Solicitud> {
    return of(null).pipe(
      delay(600),
      map(() => {
        const index = this.solicitudes.findIndex(s => s.id === id);
        if (index === -1) {
          throw new Error('Solicitud no encontrada');
        }

        this.solicitudes[index] = {
          ...this.solicitudes[index],
          ...updates
        };

        this.saveSolicitudes();
        return this.solicitudes[index];
      })
    );
  }

  /**
   * Envía una solicitud a aprobación
   */
  enviarAAprobacion(id: string, usuarioId: string, usuarioNombre: string): Observable<Solicitud> {
    return of(null).pipe(
      delay(800),
      map(() => {
        const solicitud = this.solicitudes.find(s => s.id === id);
        if (!solicitud) {
          throw new Error('Solicitud no encontrada');
        }

        if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
          throw new Error('Solo se pueden enviar solicitudes en borrador');
        }

        // Validaciones
        if (!solicitud.destino || !solicitud.motivoViaje) {
          throw new Error('Faltan datos obligatorios');
        }

        solicitud.estado = EstadoSolicitud.PENDIENTE_N1;
        solicitud.historialEstados.push({
          estado: EstadoSolicitud.PENDIENTE_N1,
          fecha: new Date(),
          usuario: usuarioNombre,
          comentario: 'Enviado a aprobación Nivel 1'
        });

        this.saveSolicitudes();
        return solicitud;
      })
    );
  }

  /**
   * Cancela una solicitud
   */
  cancelarSolicitud(id: string, motivo: string, usuarioId: string, usuarioNombre: string): Observable<Solicitud> {
    return of(null).pipe(
      delay(600),
      map(() => {
        const solicitud = this.solicitudes.find(s => s.id === id);
        if (!solicitud) {
          throw new Error('Solicitud no encontrada');
        }

        solicitud.estado = EstadoSolicitud.CANCELADO;
        solicitud.historialEstados.push({
          estado: EstadoSolicitud.CANCELADO,
          fecha: new Date(),
          usuario: usuarioNombre,
          comentario: `Cancelado: ${motivo}`
        });

        this.saveSolicitudes();
        return solicitud;
      })
    );
  }

  /**
   * Elimina una solicitud (solo en borrador)
   */
  deleteSolicitud(id: string): Observable<boolean> {
    return of(null).pipe(
      delay(400),
      map(() => {
        const index = this.solicitudes.findIndex(s => s.id === id);
        if (index === -1) {
          return false;
        }

        const solicitud = this.solicitudes[index];
        if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
          throw new Error('Solo se pueden eliminar solicitudes en borrador');
        }

        this.solicitudes.splice(index, 1);
        this.saveSolicitudes();
        return true;
      })
    );
  }

  /**
   * Genera ID único
   */
  private generateId(): string {
    return 'SOL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Genera código de solicitud
   */
  private generateCodigo(): string {
    const year = new Date().getFullYear();
    const count = this.solicitudes.length + 1;
    return `SOL-${year}-${count.toString().padStart(4, '0')}`;
  }

  /**
   * Carga solicitudes desde LocalStorage
   */
  private loadSolicitudes(): void {
    const stored = this.storageService.get<Solicitud[]>(this.STORAGE_KEY);
    if (stored) {
      // Convertir strings de fecha a objetos Date
      this.solicitudes = stored.map(s => ({
        ...s,
        fechaCreacion: new Date(s.fechaCreacion),
        fechaSalida: new Date(s.fechaSalida),
        fechaRetorno: new Date(s.fechaRetorno),
        monedaAnticipo: s.monedaAnticipo || 'PEN',
        fechaMaxRendicion: s.fechaMaxRendicion ? new Date(s.fechaMaxRendicion) : undefined,
        historialEstados: s.historialEstados.map(h => ({
          ...h,
          fecha: new Date(h.fecha)
        }))
      }));
    }
  }

  /**
   * Guarda solicitudes en LocalStorage
   */
  private saveSolicitudes(): void {
    this.storageService.set(this.STORAGE_KEY, this.solicitudes);
  }

  /**
   * Inicializa datos mock de ejemplo
   */
  private initializeMockData(): void {
    const mockSolicitudes: Solicitud[] = [
      // Solicitudes de Juan Pérez (empleadoId='1', EMPLEADO)
      {
        id: 'SOL-001',
        codigo: 'SOL-2026-0001',
        idViaje: 'VIA-2026-001',
        empleadoId: '1',
        empleadoNombre: 'Juan Pérez',
        fechaCreacion: new Date('2026-02-15'),
        fechaSalida: new Date('2026-03-20'),
        fechaRetorno: new Date('2026-03-25'),
        destino: 'Lima',
        origen: 'Arequipa',
        retorno: 'Arequipa',
        departamento: 'Lima',
        provincia: 'Lima',
        motivoCorto: 'Reunion comercial',
        motivoViaje: 'Reunión con clientes corporativos',
        actividad: 'Negocios',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Ingeniería de Radio Centro y Norte',
        centroCosto: 'CC-001',
        presupuestoTotal: 2500,
        fechaMaxRendicion: new Date('2026-03-28'),
        aprobadorActual: 'Carlos Rodríguez',
        estado: EstadoSolicitud.APROBADO_N2,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 540.00, justificacion: 'Hospedaje' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 220.00, justificacion: 'Refrigerios' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 170.00, justificacion: 'Movilidad' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 100.00, justificacion: 'Impresión de constancias' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Arequipa',
            destino: 'Lima',
            fecha: new Date('2026-03-20'),
            monto: 350,
            compania: 'LATAM'
          },
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Lima',
            destino: 'Arequipa',
            fecha: new Date('2026-03-25'),
            monto: 350,
            compania: 'LATAM'
          }
        ],
        hospedajes: [
          {
            hotel: 'Hotel Costa del Sol',
            ciudad: 'Lima',
            fechaCheckIn: new Date('2026-03-20'),
            fechaCheckOut: new Date('2026-03-25'),
            montoPorNoche: 250,
            numNoches: 5
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-02-15T10:00:00'),
            usuario: 'Juan Pérez',
            comentario: 'Solicitud creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-02-15T14:30:00'),
            usuario: 'Juan Pérez',
            comentario: 'Enviado a aprobación Nivel 1'
          },
          {
            estado: EstadoSolicitud.APROBADO_N1,
            fecha: new Date('2026-02-16T09:15:00'),
            usuario: 'María García',
            comentario: 'Aprobado por gerencia'
          },
          {
            estado: EstadoSolicitud.APROBADO_N2,
            fecha: new Date('2026-02-17T11:45:00'),
            usuario: 'Carlos Rodríguez',
            comentario: 'Aprobado por dirección'
          }
        ]
      },
      {
        id: 'SOL-002',
        codigo: 'SOL-2026-0002',
        idViaje: 'VIA-2026-002',
        empleadoId: '1',
        empleadoNombre: 'Juan Pérez',
        fechaCreacion: new Date('2026-03-01'),
        fechaSalida: new Date('2026-03-15'),
        fechaRetorno: new Date('2026-03-16'),
        destino: 'Cusco',
        origen: 'Arequipa',
        retorno: 'Arequipa',
        departamento: 'Cusco',
        provincia: 'Cusco',
        motivoCorto: 'Capacitacion',
        motivoViaje: 'Capacitación técnica',
        actividad: 'Capacitación',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Tecnología e Innovación',
        centroCosto: 'CC-001',
        presupuestoTotal: 800,
        fechaMaxRendicion: new Date('2026-03-19'),
        aprobadorActual: 'María García',
        estado: EstadoSolicitud.PENDIENTE_N1,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 180.00, justificacion: 'Hotel una noche' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 120.00, justificacion: 'Viáticos diarios' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 280.00, justificacion: 'Pasaje aéreo' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 50.00, justificacion: 'Materiales capacitación' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Arequipa',
            destino: 'Cusco',
            fecha: new Date('2026-03-15'),
            monto: 280,
            compania: 'Star Perú'
          }
        ],
        hospedajes: [
          {
            hotel: 'Hotel El Pardo',
            ciudad: 'Cusco',
            fechaCheckIn: new Date('2026-03-15'),
            fechaCheckOut: new Date('2026-03-16'),
            montoPorNoche: 180,
            numNoches: 1
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-03-01T08:20:00'),
            usuario: 'Juan Pérez',
            comentario: 'Solicitud creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-03-01T16:00:00'),
            usuario: 'Juan Pérez',
            comentario: 'Enviado a aprobación'
          }
        ]
      },
      // Solicitudes de María García (empleadoId='2', APROBADOR_N1)
      {
        id: 'SOL-003',
        codigo: 'SOL-2026-0003',
        idViaje: 'VIA-2026-003',
        empleadoId: '2',
        empleadoNombre: 'María García',
        fechaCreacion: new Date('2026-02-28'),
        fechaSalida: new Date('2026-03-12'),
        fechaRetorno: new Date('2026-03-13'),
        destino: 'Trujillo',
        origen: 'Lima',
        retorno: 'Lima',
        departamento: 'La Libertad',
        provincia: 'Trujillo',
        motivoCorto: 'Supervision ventas',
        motivoViaje: 'Supervisión equipo ventas norte',
        actividad: 'Supervisión',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Comercial Norte',
        centroCosto: 'CC-002',
        presupuestoTotal: 950,
        fechaMaxRendicion: new Date('2026-03-16'),
        aprobadorActual: 'Carlos Rodríguez',
        estado: EstadoSolicitud.PENDIENTE_N2,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 200.00, justificacion: 'Hotel una noche' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 150.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 280.00, justificacion: 'Pasaje aéreo' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 50.00, justificacion: 'Movilidad local' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Lima',
            destino: 'Trujillo',
            fecha: new Date('2026-03-12'),
            monto: 280,
            compania: 'LATAM'
          }
        ],
        hospedajes: [
          {
            hotel: 'Gran Bolívar Hotel',
            ciudad: 'Trujillo',
            fechaCheckIn: new Date('2026-03-12'),
            fechaCheckOut: new Date('2026-03-13'),
            montoPorNoche: 200,
            numNoches: 1
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-02-28T09:00:00'),
            usuario: 'María García',
            comentario: 'Creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-02-28T10:00:00'),
            usuario: 'María García',
            comentario: 'Enviada a N1'
          },
          {
            estado: EstadoSolicitud.APROBADO_N1,
            fecha: new Date('2026-02-28T15:00:00'),
            usuario: 'María García',
            comentario: 'Auto-aprobación N1'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N2,
            fecha: new Date('2026-02-28T15:01:00'),
            usuario: 'Sistema',
            comentario: 'Escalado a N2'
          }
        ]
      },
      // Solicitudes de Carlos Rodríguez (empleadoId='3', APROBADOR_N2)
      {
        id: 'SOL-004',
        codigo: 'SOL-2026-0004',
        idViaje: 'VIA-2026-004',
        empleadoId: '3',
        empleadoNombre: 'Carlos Rodríguez',
        fechaCreacion: new Date('2026-03-01'),
        fechaSalida: new Date('2026-03-18'),
        fechaRetorno: new Date('2026-03-20'),
        destino: 'Buenos Aires',
        origen: 'Lima',
        retorno: 'Lima',
        departamento: 'Buenos Aires',
        provincia: 'Buenos Aires',
        motivoCorto: 'Conferencia',
        motivoViaje: 'Conferencia internacional telecomunicaciones',
        actividad: 'Negocios',
        modalidad: 'Aéreo',
        tipoViaje: 'Internacional',
        area: 'Dirección General',
        centroCosto: 'CC-003',
        presupuestoTotal: 3200,
        fechaMaxRendicion: new Date('2026-03-23'),
        aprobadorActual: 'Carlos Rodríguez',
        estado: EstadoSolicitud.APROBADO_N2,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'USD', monto: 760.00, justificacion: 'Dos noches hotel' },
          { concepto: 'Alimentación', moneda: 'USD', monto: 200.00, justificacion: 'Viáticos internacionales' },
          { concepto: 'Transporte', moneda: 'USD', monto: 650.00, justificacion: 'Pasaje internacional' },
          { concepto: 'Otros Gastos', moneda: 'USD', monto: 100.00, justificacion: 'Materiales conferencia' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Lima',
            destino: 'Buenos Aires',
            fecha: new Date('2026-03-18'),
            monto: 650,
            compania: 'LATAM'
          }
        ],
        hospedajes: [
          {
            hotel: 'Sheraton Buenos Aires',
            ciudad: 'Buenos Aires',
            fechaCheckIn: new Date('2026-03-18'),
            fechaCheckOut: new Date('2026-03-20'),
            montoPorNoche: 380,
            numNoches: 2
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-03-01T08:00:00'),
            usuario: 'Carlos Rodríguez',
            comentario: 'Creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-03-01T09:00:00'),
            usuario: 'Carlos Rodríguez',
            comentario: 'Enviada'
          },
          {
            estado: EstadoSolicitud.APROBADO_N1,
            fecha: new Date('2026-03-01T11:00:00'),
            usuario: 'María García',
            comentario: 'Aprobado N1'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N2,
            fecha: new Date('2026-03-01T11:01:00'),
            usuario: 'Sistema',
            comentario: 'Escalado a N2'
          },
          {
            estado: EstadoSolicitud.APROBADO_N2,
            fecha: new Date('2026-03-01T14:30:00'),
            usuario: 'Carlos Rodríguez',
            comentario: 'Auto-aprobado N2'
          }
        ]
      },
      // Solicitudes de Ana Martínez (empleadoId='4', ADMIN)
      {
        id: 'SOL-005',
        codigo: 'SOL-2026-0005',
        empleadoId: '4',
        empleadoNombre: 'Ana Martínez',
        fechaCreacion: new Date('2026-03-02'),
        fechaSalida: new Date('2026-03-25'),
        fechaRetorno: new Date('2026-03-27'),
        destino: 'Chiclayo',
        motivoViaje: 'Auditoría sistemas regionales',
        actividad: 'Auditoría',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Auditoría Interna',
        centroCosto: 'CC-000',
        presupuestoTotal: 1100,
        estado: EstadoSolicitud.PENDIENTE_N1,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 360.00, justificacion: 'Hotel dos noches' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 160.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 320.00, justificacion: 'Pasaje aéreo' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 60.00, justificacion: 'Gastos varios' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.AEREO,
            origen: 'Lima',
            destino: 'Chiclayo',
            fecha: new Date('2026-03-25'),
            monto: 320,
            compania: 'LC Perú'
          }
        ],
        hospedajes: [
          {
            hotel: 'Casa Andina Select',
            ciudad: 'Chiclayo',
            fechaCheckIn: new Date('2026-03-25'),
            fechaCheckOut: new Date('2026-03-27'),
            montoPorNoche: 180,
            numNoches: 2
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-03-02T10:00:00'),
            usuario: 'Ana Martínez',
            comentario: 'Creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-03-02T14:00:00'),
            usuario: 'Ana Martínez',
            comentario: 'Enviada a aprobación'
          }
        ]
      },
      // Solicitudes de Luis Torres (empleadoId='5', ASISTENTE)
      {
        id: 'SOL-006',
        codigo: 'SOL-2026-0006',
        empleadoId: '5',
        empleadoNombre: 'Luis Torres',
        fechaCreacion: new Date('2026-03-03'),
        fechaSalida: new Date('2026-03-10'),
        fechaRetorno: new Date('2026-03-11'),
        destino: 'Ica',
        motivoViaje: 'Soporte administrativo evento regional',
        actividad: 'Soporte Operativo',
        modalidad: 'Terrestre',
        tipoViaje: 'Nacional',
        area: 'Operaciones',
        centroCosto: 'CC-001',
        presupuestoTotal: 600,
        estado: EstadoSolicitud.PENDIENTE_N1,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 150.00, justificacion: 'Hotel una noche' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 80.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 80.00, justificacion: 'Bus interprovincial' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 40.00, justificacion: 'Movilidad local' }
        ],
        pasajes: [
          {
            tipo: TipoPasaje.TERRESTRE,
            origen: 'Lima',
            destino: 'Ica',
            fecha: new Date('2026-03-10'),
            monto: 80,
            compania: 'Cruz del Sur'
          }
        ],
        hospedajes: [
          {
            hotel: 'Hotel Las Dunas',
            ciudad: 'Ica',
            fechaCheckIn: new Date('2026-03-10'),
            fechaCheckOut: new Date('2026-03-11'),
            montoPorNoche: 150,
            numNoches: 1
          }
        ],
        rendiciones: [],
        historialEstados: [
          {
            estado: EstadoSolicitud.BORRADOR,
            fecha: new Date('2026-03-03T11:00:00'),
            usuario: 'Luis Torres',
            comentario: 'Creada'
          },
          {
            estado: EstadoSolicitud.PENDIENTE_N1,
            fecha: new Date('2026-03-03T11:30:00'),
            usuario: 'Luis Torres',
            comentario: 'Enviada a aprobación'
          }
        ]
      },
      // SOL-007: APROBADO_N2 - tercer aprobado
      {
        id: 'SOL-007',
        codigo: 'SOL-2026-0007',
        idViaje: 'VIA-2026-007',
        empleadoId: '5',
        empleadoNombre: 'Luis Torres',
        fechaCreacion: new Date('2026-03-04'),
        fechaSalida: new Date('2026-04-01'),
        fechaRetorno: new Date('2026-04-03'),
        destino: 'Piura',
        origen: 'Lima',
        retorno: 'Lima',
        departamento: 'Piura',
        provincia: 'Piura',
        motivoCorto: 'Instalacion antenas',
        motivoViaje: 'Instalación de antenas 5G zona norte',
        actividad: 'Técnico',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Operaciones',
        centroCosto: 'CC-001',
        presupuestoTotal: 1350,
        fechaMaxRendicion: new Date('2026-04-06'),
        aprobadorActual: 'Carlos Rodríguez',
        estado: EstadoSolicitud.APROBADO_N2,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 300.00, justificacion: 'Hotel dos noches' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 180.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 310.00, justificacion: 'Pasaje aéreo' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 60.00, justificacion: 'Herramientas campo' }
        ],
        pasajes: [
          { tipo: TipoPasaje.AEREO, origen: 'Lima', destino: 'Piura', fecha: new Date('2026-04-01'), monto: 310, compania: 'Sky Airline' },
          { tipo: TipoPasaje.AEREO, origen: 'Piura', destino: 'Lima', fecha: new Date('2026-04-03'), monto: 310, compania: 'Sky Airline' }
        ],
        hospedajes: [
          { hotel: 'Hotel Los Portales', ciudad: 'Piura', fechaCheckIn: new Date('2026-04-01'), fechaCheckOut: new Date('2026-04-03'), montoPorNoche: 150, numNoches: 2 }
        ],
        rendiciones: [],
        historialEstados: [
          { estado: EstadoSolicitud.BORRADOR, fecha: new Date('2026-03-04T08:00:00'), usuario: 'Luis Torres', comentario: 'Creada' },
          { estado: EstadoSolicitud.PENDIENTE_N1, fecha: new Date('2026-03-04T09:00:00'), usuario: 'Luis Torres', comentario: 'Enviada a aprobación' },
          { estado: EstadoSolicitud.APROBADO_N1, fecha: new Date('2026-03-05T10:00:00'), usuario: 'María García', comentario: 'Aprobado N1' },
          { estado: EstadoSolicitud.PENDIENTE_N2, fecha: new Date('2026-03-05T10:01:00'), usuario: 'Sistema', comentario: 'Escalado a N2' },
          { estado: EstadoSolicitud.APROBADO_N2, fecha: new Date('2026-03-06T11:00:00'), usuario: 'Carlos Rodríguez', comentario: 'Aprobado N2' }
        ]
      },
      // SOL-008: RECHAZADO_N1
      {
        id: 'SOL-008',
        codigo: 'SOL-2026-0008',
        idViaje: 'VIA-2026-008',
        empleadoId: '1',
        empleadoNombre: 'Juan Pérez',
        fechaCreacion: new Date('2026-03-05'),
        fechaSalida: new Date('2026-04-08'),
        fechaRetorno: new Date('2026-04-09'),
        destino: 'Tacna',
        origen: 'Arequipa',
        retorno: 'Arequipa',
        departamento: 'Tacna',
        provincia: 'Tacna',
        motivoCorto: 'Visita cliente',
        motivoViaje: 'Visita a cliente corporativo regional',
        actividad: 'Negocios',
        modalidad: 'Terrestre',
        tipoViaje: 'Nacional',
        area: 'Ingeniería de Radio Centro y Norte',
        centroCosto: 'CC-001',
        presupuestoTotal: 550,
        aprobadorActual: 'María García',
        estado: EstadoSolicitud.RECHAZADO_N1,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 120.00, justificacion: 'Hotel una noche' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 80.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 90.00, justificacion: 'Bus interprovincial' }
        ],
        pasajes: [
          { tipo: TipoPasaje.TERRESTRE, origen: 'Arequipa', destino: 'Tacna', fecha: new Date('2026-04-08'), monto: 90, compania: 'Cruz del Sur' }
        ],
        hospedajes: [
          { hotel: 'Hotel Plaza Tacna', ciudad: 'Tacna', fechaCheckIn: new Date('2026-04-08'), fechaCheckOut: new Date('2026-04-09'), montoPorNoche: 120, numNoches: 1 }
        ],
        rendiciones: [],
        historialEstados: [
          { estado: EstadoSolicitud.BORRADOR, fecha: new Date('2026-03-05T09:00:00'), usuario: 'Juan Pérez', comentario: 'Creada' },
          { estado: EstadoSolicitud.PENDIENTE_N1, fecha: new Date('2026-03-05T10:00:00'), usuario: 'Juan Pérez', comentario: 'Enviada a aprobación' },
          { estado: EstadoSolicitud.RECHAZADO_N1, fecha: new Date('2026-03-06T08:30:00'), usuario: 'María García', comentario: 'Presupuesto fuera de política de viajes' }
        ]
      },
      // SOL-009: RECHAZADO_N2
      {
        id: 'SOL-009',
        codigo: 'SOL-2026-0009',
        idViaje: 'VIA-2026-009',
        empleadoId: '2',
        empleadoNombre: 'María García',
        fechaCreacion: new Date('2026-03-06'),
        fechaSalida: new Date('2026-04-15'),
        fechaRetorno: new Date('2026-04-17'),
        destino: 'Huancayo',
        origen: 'Lima',
        retorno: 'Lima',
        departamento: 'Junín',
        provincia: 'Huancayo',
        motivoCorto: 'Auditoría sucursal',
        motivoViaje: 'Auditoría sistemas sucursal Huancayo',
        actividad: 'Auditoría',
        modalidad: 'Terrestre',
        tipoViaje: 'Nacional',
        area: 'Comercial Norte',
        centroCosto: 'CC-002',
        presupuestoTotal: 1800,
        aprobadorActual: 'Carlos Rodríguez',
        estado: EstadoSolicitud.RECHAZADO_N2,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 400.00, justificacion: 'Hotel dos noches' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 250.00, justificacion: 'Viáticos' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 180.00, justificacion: 'Bus de lujo ida y vuelta' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 120.00, justificacion: 'Equipos auditoría' }
        ],
        pasajes: [
          { tipo: TipoPasaje.TERRESTRE, origen: 'Lima', destino: 'Huancayo', fecha: new Date('2026-04-15'), monto: 180, compania: 'Molina' }
        ],
        hospedajes: [
          { hotel: 'Hotel Turismo Huancayo', ciudad: 'Huancayo', fechaCheckIn: new Date('2026-04-15'), fechaCheckOut: new Date('2026-04-17'), montoPorNoche: 200, numNoches: 2 }
        ],
        rendiciones: [],
        historialEstados: [
          { estado: EstadoSolicitud.BORRADOR, fecha: new Date('2026-03-06T09:00:00'), usuario: 'María García', comentario: 'Creada' },
          { estado: EstadoSolicitud.PENDIENTE_N1, fecha: new Date('2026-03-06T10:00:00'), usuario: 'María García', comentario: 'Enviada' },
          { estado: EstadoSolicitud.APROBADO_N1, fecha: new Date('2026-03-07T09:00:00'), usuario: 'María García', comentario: 'Auto-aprobado N1' },
          { estado: EstadoSolicitud.PENDIENTE_N2, fecha: new Date('2026-03-07T09:01:00'), usuario: 'Sistema', comentario: 'Escalado a N2' },
          { estado: EstadoSolicitud.RECHAZADO_N2, fecha: new Date('2026-03-08T11:00:00'), usuario: 'Carlos Rodríguez', comentario: 'Monto excede tope aprobado para zona sierra' }
        ]
      },
      // SOL-010: RECHAZADO_N1
      {
        id: 'SOL-010',
        codigo: 'SOL-2026-0010',
        idViaje: 'VIA-2026-010',
        empleadoId: '4',
        empleadoNombre: 'Ana Martínez',
        fechaCreacion: new Date('2026-03-07'),
        fechaSalida: new Date('2026-04-20'),
        fechaRetorno: new Date('2026-04-22'),
        destino: 'Pucallpa',
        origen: 'Lima',
        retorno: 'Lima',
        departamento: 'Ucayali',
        provincia: 'Coronel Portillo',
        motivoCorto: 'Revision contratos',
        motivoViaje: 'Revisión contratos proveedores zona selva',
        actividad: 'Auditoría',
        modalidad: 'Aéreo',
        tipoViaje: 'Nacional',
        area: 'Auditoría Interna',
        centroCosto: 'CC-000',
        presupuestoTotal: 2100,
        aprobadorActual: 'María García',
        estado: EstadoSolicitud.RECHAZADO_N1,
        viaticos: [
          { concepto: 'Alojamiento', moneda: 'PEN', monto: 550.00, justificacion: 'Hotel selva' },
          { concepto: 'Alimentación', moneda: 'PEN', monto: 300.00, justificacion: 'Viáticos zona emergente' },
          { concepto: 'Transporte', moneda: 'PEN', monto: 480.00, justificacion: 'Vuelo Lima-Pucallpa' },
          { concepto: 'Otros Gastos', moneda: 'PEN', monto: 150.00, justificacion: 'Transporte fluvial' }
        ],
        pasajes: [
          { tipo: TipoPasaje.AEREO, origen: 'Lima', destino: 'Pucallpa', fecha: new Date('2026-04-20'), monto: 480, compania: 'Peruvian Airlines' },
          { tipo: TipoPasaje.AEREO, origen: 'Pucallpa', destino: 'Lima', fecha: new Date('2026-04-22'), monto: 480, compania: 'Peruvian Airlines' }
        ],
        hospedajes: [
          { hotel: 'Hotel Sol del Oriente', ciudad: 'Pucallpa', fechaCheckIn: new Date('2026-04-20'), fechaCheckOut: new Date('2026-04-22'), montoPorNoche: 275, numNoches: 2 }
        ],
        rendiciones: [],
        historialEstados: [
          { estado: EstadoSolicitud.BORRADOR, fecha: new Date('2026-03-07T11:00:00'), usuario: 'Ana Martínez', comentario: 'Creada' },
          { estado: EstadoSolicitud.PENDIENTE_N1, fecha: new Date('2026-03-07T12:00:00'), usuario: 'Ana Martínez', comentario: 'Enviada a aprobación' },
          { estado: EstadoSolicitud.RECHAZADO_N1, fecha: new Date('2026-03-08T09:15:00'), usuario: 'María García', comentario: 'Monto de viáticos excesivo para zona' }
        ]
      }
    ];

    this.solicitudes = mockSolicitudes;
    this.saveSolicitudes();
  }
}
