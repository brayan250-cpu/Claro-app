/**
 * Modelos de datos para el Sistema de Gestión de Viajes CLARO
 * Basado en 01_technical_design.md
 */

// ============ AUTENTICACIÓN ============

export interface User {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: UserRole;
  centroCosto: string;
  departamento: string;
  avatar?: string;
  activo: boolean;
}

export enum UserRole {
  EMPLEADO = 'EMPLEADO',
  ASISTENTE = 'ASISTENTE',
  APROBADOR_N1 = 'APROBADOR_N1',
  APROBADOR_N2 = 'APROBADOR_N2',
  ADMIN = 'ADMIN',
  OPERADOR_LIQ = 'OPERADOR_LIQ',
  AUDITOR = 'AUDITOR'
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

// ============ SOLICITUDES ============

export interface Solicitud {
  id: string;
  codigo: string; // SOL-2024-001
  idViaje?: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaCreacion: Date;
  fechaSalida: Date;
  fechaRetorno: Date;
  destino: string;
  origen?: string;
  retorno?: string;
  departamento?: string;
  provincia?: string;
  motivoCorto?: string;
  motivoViaje: string;
  actividad?: string;       // Negocios, Capacitación, Supervisión, etc.
  modalidad?: string;       // Terrestre, Aéreo
  tipoViaje?: string;       // Nacional, Internacional
  centroCosto: string;
  area?: string;            // Ingeniería de Radio Centro y Norte, etc.
  presupuestoTotal: number;
  monedaAnticipo?: 'PEN' | 'USD';
  fechaMaxRendicion?: Date;
  aprobadorActual?: string;
  estado: EstadoSolicitud;
  pasajes: PasajeInfo[];
  hospedajes: HospedajeInfo[];
  viaticos?: ViaticosItem[];  // Detalle del presupuesto por categoría
 rendiciones: Rendicion[];
  historialEstados: HistorialEstado[];
}

export interface ViaticosItem {
  concepto: string;     // Alojamiento, Alimentación, Transporte, Otros Gastos
  moneda: 'PEN' | 'USD';
  monto: number;
  justificacion?: string;
}

export enum EstadoSolicitud {
  BORRADOR = 'BORRADOR',
  PENDIENTE_N1 = 'PENDIENTE_N1',
  APROBADO_N1 = 'APROBADO_N1',
  RECHAZADO_N1 = 'RECHAZADO_N1',
  PENDIENTE_N2 = 'PENDIENTE_N2',
  APROBADO_N2 = 'APROBADO_N2',
  RECHAZADO_N2 = 'RECHAZADO_N2',
  CANCELADO = 'CANCELADO',
  COMPLETADO = 'COMPLETADO'
}

export enum TipoPasaje {
  AEREO = 'AEREO',
  TERRESTRE = 'TERRESTRE'
}

export interface PasajeInfo {
  tipo: TipoPasaje;
  origen: string;
  destino: string;
  fecha: Date;
  monto: number;
  compania?: string;
}

export interface HospedajeInfo {
  hotel: string;
  ciudad: string;
  fechaCheckIn: Date;
  fechaCheckOut: Date;
  montoPorNoche: number;
  numNoches: number;
}

export interface HistorialEstado {
  estado: EstadoSolicitud;
  fecha: Date;
  usuario: string;
  comentario?: string;
}

// ============ APROBACIONES ============

export interface Aprobacion {
  id: string;
  solicitudId: string;
  solicitud: Solicitud;
  nivel: 1 | 2;
  aprobadorId: string;
  aprobadorNombre: string;
  fechaAsignacion: Date;
  fechaRespuesta?: Date;
  decision?: 'APROBADO' | 'RECHAZADO';
  comentario?: string;
}

// ============ RENDICIONES ============

export interface Rendicion {
  id: string;
  solicitudId: string;
  viajeId?: string;
  destino?: string;
  salida?: string;
  retorno?: string;
  fechaMaxRendicion?: Date;
  aprobadorNombre?: string;
  empleadoId: string;
  fecha: Date;
  categoria: CategoriaGasto;
  concepto: string;
  monto: number;
  moneda: 'PEN' | 'USD' | 'EUR';
  comprobante?: string; // URL del archivo
  estado: EstadoRendicion;
  // Campos extraídos por Document AI
  proveedor?: string;
  folio?: string;
  ruc?: string;
  justificacion?: string; // Para cuando hay exceso sobre presupuesto
  // Campos adicionales del documento
  tipoDocumento?: string;
  nroDocumento?: string;
  afectoIgv?: boolean;
  igv?: number;
  otrosServicios?: number;
  ordenInterna?: string;
  pais?: string;
  ciudad?: string;
  // Conversión de moneda
  tipoCambio?: number;
  importeCalculado?: number;
}

export enum CategoriaGasto {
  TRANSPORTE = 'TRANSPORTE',
  HOSPEDAJE = 'HOSPEDAJE',
  ALIMENTACION = 'ALIMENTACION',
  OTROS = 'OTROS'
}

export enum EstadoRendicion {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO'
}

// ============ DOCUMENT AI ============

export interface DocumentAIResult {
  fecha?: string;
  monto?: number;
  moneda?: 'PEN' | 'USD' | 'EUR';
  proveedor?: string;
  folio?: string;
  ruc?: string;
  concepto?: string;
  confidence: number; // 0-100
  metadata?: {
    subtotal?: number;
    igv?: number;
    tipoDocumento?: string;
    nroDocumento?: string;
    metodoPago?: string;
    categoria?: string;
    afectoIgv?: boolean;
    otrosServicios?: number;
    ordenInterna?: string;
    pais?: string;
    ciudad?: string;
  };
}

export interface ResumenViatico {
  alojamiento: { rendido: number; presupuestado: number };
  alimentacion: { rendido: number; presupuestado: number };
  transporte: { rendido: number; presupuestado: number };
  impuestos: { rendido: number; presupuestado: number };
  otros: { rendido: number; presupuestado: number };
}

// ============ CATÁLOGOS ============

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Departamento {
  id: string;
  nombre: string;
  jefe?: string;
}

// ============ NOTIFICACIONES ============

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  link?: string;
}

export enum TipoNotificacion {
  INFO = 'INFO',
  APROBACION_PENDIENTE = 'APROBACION_PENDIENTE',
  SOLICITUD_APROBADA = 'SOLICITUD_APROBADA',
  SOLICITUD_RECHAZADA = 'SOLICITUD_RECHAZADA',
  RENDICION_REQUERIDA = 'RENDICION_REQUERIDA'
}
