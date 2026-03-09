import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Ciudad {
  id: string;
  nombre: string;
  pais: string;
  esFrequente: boolean;
}

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  departamento: string;
}

export interface Hotel {
  id: string;
  nombre: string;
  ciudad: string;
  categoria: number;
  tarifaPromedio: number;
}

/**
 * Servicio de catálogos precargados para autocompletado rápido
 * Simula una API con datos mock
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogosService {
  
  private ciudades: Ciudad[] = [
    // Perú - Ciudades frecuentes
    { id: '1', nombre: 'Lima', pais: 'Perú', esFrequente: true },
    { id: '2', nombre: 'Cusco', pais: 'Perú', esFrequente: true },
    { id: '3', nombre: 'Arequipa', pais: 'Perú', esFrequente: true },
    { id: '4', nombre: 'Trujillo', pais: 'Perú', esFrequente: true },
    { id: '5', nombre: 'Piura', pais: 'Perú', esFrequente: true },
    { id: '6', nombre: 'Chiclayo', pais: 'Perú', esFrequente: true },
    { id: '7', nombre: 'Iquitos', pais: 'Perú', esFrequente: true },
    { id: '8', nombre: 'Pucallpa', pais: 'Perú', esFrequente: false },
    { id: '9', nombre: 'Tacna', pais: 'Perú', esFrequente: false },
    { id: '10', nombre: 'Huancayo', pais: 'Perú', esFrequente: false },
    { id: '11', nombre: 'Ayacucho', pais: 'Perú', esFrequente: false },
    { id: '12', nombre: 'Cajamarca', pais: 'Perú', esFrequente: false },
    // Internacional
    { id: '13', nombre: 'Santiago', pais: 'Chile', esFrequente: true },
    { id: '14', nombre: 'Bogotá', pais: 'Colombia', esFrequente: true },
    { id: '15', nombre: 'Buenos Aires', pais: 'Argentina', esFrequente: false },
    { id: '16', nombre: 'Miami', pais: 'Estados Unidos', esFrequente: false }
  ];

  private centrosCosto: CentroCosto[] = [
    { id: '1', codigo: 'CC-2026-VENTAS', nombre: 'Ventas Nacionales', departamento: 'Comercial' },
    { id: '2', codigo: 'CC-2026-MKT', nombre: 'Marketing y Publicidad', departamento: 'Marketing' },
    { id: '3', codigo: 'CC-2026-TI', nombre: 'Tecnología e Innovación', departamento: 'TI' },
    { id: '4', codigo: 'CC-2026-RRHH', nombre: 'Recursos Humanos', departamento: 'RRHH' },
    { id: '5', codigo: 'CC-2026-FIN', nombre: 'Finanzas y Contabilidad', departamento: 'Finanzas' },
    { id: '6', codigo: 'CC-2026-OPS', nombre: 'Operaciones', departamento: 'Operaciones' },
    { id: '7', codigo: 'CC-2026-LOG', nombre: 'Logística', departamento: 'Logística' },
    { id: '8', codigo: 'CC-2026-LEGAL', nombre: 'Legal y Cumplimiento', departamento: 'Legal' }
  ];

  private hoteles: Hotel[] = [
    // Lima
    { id: '1', nombre: 'Hilton Lima Miraflores', ciudad: 'Lima', categoria: 5, tarifaPromedio: 450 },
    { id: '2', nombre: 'Costa del Sol Wyndham', ciudad: 'Lima', categoria: 4, tarifaPromedio: 280 },
    { id: '3', nombre: 'Sheraton Lima', ciudad: 'Lima', categoria: 5, tarifaPromedio: 380 },
    { id: '4', nombre: 'Hotel B', ciudad: 'Lima', categoria: 4, tarifaPromedio: 320 },
    // Cusco
    { id: '5', nombre: 'Belmond Hotel Monasterio', ciudad: 'Cusco', categoria: 5, tarifaPromedio: 520 },
    { id: '6', nombre: 'Costa del Sol Cusco', ciudad: 'Cusco', categoria: 4, tarifaPromedio: 250 },
    { id: '7', nombre: 'Novotel Cusco', ciudad: 'Cusco', categoria: 4, tarifaPromedio: 280 },
    // Arequipa
    { id: '8', nombre: 'Casa Andina Premium', ciudad: 'Arequipa', categoria: 4, tarifaPromedio: 230 },
    { id: '9', nombre: 'Costa del Sol Arequipa', ciudad: 'Arequipa', categoria: 4, tarifaPromedio: 220 },
    { id: '10', nombre: 'Sonesta Arequipa', ciudad: 'Arequipa', categoria: 5, tarifaPromedio: 350 },
    // Trujillo
    { id: '11', nombre: 'Costa del Sol Trujillo', ciudad: 'Trujillo', categoria: 4, tarifaPromedio: 200 },
    { id: '12', nombre: 'Gran Bolívar Hotel', ciudad: 'Trujillo', categoria: 4, tarifaPromedio: 180 }
  ];

  private motivosComunes: string[] = [
    'Reunión con clientes corporativos',
    'Capacitación técnica del personal',
    'Supervisión de proyecto en obra',
    'Presentación de propuesta comercial',
    'Visita a sucursal regional',
    'Congreso o conferencia técnica',
    'Auditoría y fiscalización',
    'Negociación con proveedores'
  ];

  /**
   * Obtiene todas las ciudades disponibles
   */
  getCiudades(): Observable<Ciudad[]> {
    return of(this.ciudades).pipe(delay(100));
  }

  /**
   * Obtiene solo ciudades frecuentes (para lista reducida)
   */
  getCiudadesFrecuentes(): Observable<Ciudad[]> {
    return of(this.ciudades.filter(c => c.esFrequente)).pipe(delay(100));
  }

  /**
   * Busca ciudades por nombre (para autocomplete)
   */
  buscarCiudades(termino: string): Observable<Ciudad[]> {
    const terminoLower = termino.toLowerCase();
    const resultados = this.ciudades.filter(c => 
      c.nombre.toLowerCase().includes(terminoLower) ||
      c.pais.toLowerCase().includes(terminoLower)
    );
    return of(resultados).pipe(delay(100));
  }

  /**
   * Obtiene todos los centros de costo
   */
  getCentrosCosto(): Observable<CentroCosto[]> {
    return of(this.centrosCosto).pipe(delay(100));
  }

  /**
   * Busca centros de costo por código o nombre
   */
  buscarCentrosCosto(termino: string): Observable<CentroCosto[]> {
    const terminoLower = termino.toLowerCase();
    const resultados = this.centrosCosto.filter(cc =>
      cc.codigo.toLowerCase().includes(terminoLower) ||
      cc.nombre.toLowerCase().includes(terminoLower) ||
      cc.departamento.toLowerCase().includes(terminoLower)
    );
    return of(resultados).pipe(delay(100));
  }

  /**
   * Obtiene hoteles por ciudad
   */
  getHotelesPorCiudad(ciudad: string): Observable<Hotel[]> {
    const hotelesCiudad = this.hoteles.filter(h => 
      h.ciudad.toLowerCase() === ciudad.toLowerCase()
    );
    return of(hotelesCiudad).pipe(delay(100));
  }

  /**
   * Obtiene todos los hoteles
   */
  getHoteles(): Observable<Hotel[]> {
    return of(this.hoteles).pipe(delay(100));
  }

  /**
   * Busca hoteles por nombre o ciudad
   */
  buscarHoteles(termino: string): Observable<Hotel[]> {
    const terminoLower = termino.toLowerCase();
    const resultados = this.hoteles.filter(h =>
      h.nombre.toLowerCase().includes(terminoLower) ||
      h.ciudad.toLowerCase().includes(terminoLower)
    );
    return of(resultados).pipe(delay(100));
  }

  /**
   * Obtiene motivos de viaje comunes
   */
  getMotivosComunes(): Observable<string[]> {
    return of(this.motivosComunes).pipe(delay(100));
  }
}
