import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DocumentAIResult } from '../../models';

/**
 * Servicio simulado de Document AI inspirado en SAP Document Information Extraction
 * Simula extracción inteligente de datos de comprobantes fiscales
 * En producción, este servicio conectaría con Google Document AI, SAP DI o similar
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentAIService {

  /**
   * Extrae información de un comprobante (imagen o PDF) usando IA
   * Simula procesamiento OCR + Machine Learning de SAP Document Information Extraction
   * @param file Archivo de imagen o PDF del comprobante
   * @returns Observable con datos extraídos y nivel de confianza por campo
   */
  extractDocumentData(file: File): Observable<DocumentAIResult> {
    console.log(`[Document AI] Iniciando extracción de: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Simulación de procesamiento SAP DI
    // Fase 1: OCR (0.5s)
    // Fase 2: Detección de estructura (0.8s)
    // Fase 3: Extracción de entidades (0.7s)
    // Total: ~2 segundos
    
    const mockData: DocumentAIResult = this.generateRealisticInvoiceData();

    console.log('[Document AI] Extracción completada:', {
      proveedor: mockData.proveedor,
      monto: mockData.monto,
      confidence: `${mockData.confidence}%`
    });

    // Simular delay de procesamiento realista (2-3 segundos)
    const processingTime = 2000 + Math.random() * 1000;
    return of(mockData).pipe(delay(processingTime));
  }

  /**
   * Genera datos realistas de factura peruana
   * Simula extracción de SAP DI con alta precisión
   */
  private generateRealisticInvoiceData(): DocumentAIResult {
    // Proveedores reales peruanos con RUC válido
    const proveedores = [
      { nombre: 'Restaurant Central', ruc: '20512345678', categoria: 'alimentacion' },
      { nombre: 'Taxi Safe Perú SAC', ruc: '20598765432', categoria: 'transporte' },
      { nombre: 'Hotel Miraflores Park', ruc: '20445566778', categoria: 'hospedaje' },
      { nombre: 'Uber Perú SRL', ruc: '20512398745', categoria: 'transporte' },
      { nombre: 'Starbucks Coffee', ruc: '20487123654', categoria: 'alimentacion' },
      { nombre: 'Cabify Perú SAC', ruc: '20501234789', categoria: 'transporte' },
      { nombre: 'Costa del Sol Hotels', ruc: '20445577889', categoria: 'hospedaje' },
      { nombre: 'Pardos Chicken SAC', ruc: '20511223344', categoria: 'alimentacion' },
      { nombre: 'Latam Airlines', ruc: '20100047218', categoria: 'transporte' },
      { nombre: 'Sheraton Lima Hotel', ruc: '20506814655', categoria: 'hospedaje' }
    ];

    const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];

    // Conceptos específicos por tipo de gasto
    const conceptos: Record<string, string[]> = {
      alimentacion: [
        'Almuerzo ejecutivo con cliente',
        'Desayuno reunión de negocios',
        'Cena equipo de trabajo',
        'Coffee break capacitación',
        'Refrigerio reunión corporativa'
      ],
      transporte: [
        'Taxi aeropuerto - hotel',
        'Traslado a reunión con cliente',
        'Viaje a sede corporativa',
        'Transporte reunión externa',
        'Movilidad reunión urgente'
      ],
      hospedaje: [
        'Alojamiento 1 noche',
        'Hospedaje conferencia',
        'Estancia capacitación externa',
        'Habitación suite ejecutiva',
        'Check-in anticipado'
      ]
    };

    const categoria = proveedor.categoria as keyof typeof conceptos;
    const conceptosList = conceptos[categoria];
    const concepto = conceptosList[Math.floor(Math.random() * conceptosList.length)];

    const moneda: 'PEN' | 'USD' | 'EUR' = Math.random() < 0.15 ? 'EUR' : (Math.random() < 0.28 ? 'USD' : 'PEN');

    // Generar monto realista según categoría
    const montoBase = this.generateRealisticAmount(categoria, moneda);
    const igv = montoBase * 0.18; // Simulacion de impuesto
    const montoTotal = montoBase + igv;

    // Simular confianza de SAP DI (generalmente alta para campos estructurados)
    const baseConfidence = 85 + Math.random() * 10; // 85-95%

    // Generar datos adicionales del documento
    const paises = ['Perú', 'Chile', 'Colombia', 'México', 'Argentina', 'España', 'Estados Unidos'];
    const ciudades: Record<string, string[]> = {
      'Perú': ['Lima', 'Arequipa', 'Cusco', 'Trujillo'],
      'Chile': ['Santiago', 'Valparaíso'],
      'Colombia': ['Bogotá', 'Medellín'],
      'México': ['Ciudad de México', 'Monterrey'],
      'Argentina': ['Buenos Aires', 'Córdoba'],
      'España': ['Madrid', 'Barcelona'],
      'Estados Unidos': ['Miami', 'New York']
    };
    const paisSeleccionado = paises[Math.floor(Math.random() * paises.length)];
    const ciudadesPais = ciudades[paisSeleccionado] || ['Capital'];
    const ciudadSeleccionada = ciudadesPais[Math.floor(Math.random() * ciudadesPais.length)];
    const nroDocumento = this.generatePeruvianInvoiceNumber();
    const afectoIgv = Math.random() > 0.2;
    const otrosServicios = Math.random() < 0.3 ? parseFloat((Math.random() * 50 + 5).toFixed(2)) : 0;
    const ordenesInternas = ['OI-2025-001', 'OI-2025-002', 'OI-2025-003', 'OI-2025-010', 'OI-2025-015'];
    const ordenInterna = ordenesInternas[Math.floor(Math.random() * ordenesInternas.length)];
    
    return {
      fecha: this.generateRecentDate(),
      monto: parseFloat(montoTotal.toFixed(2)),
      moneda,
      proveedor: proveedor.nombre,
      folio: nroDocumento,
      ruc: proveedor.ruc,
      concepto: concepto,
      confidence: Math.floor(baseConfidence),
      metadata: {
        subtotal: parseFloat(montoBase.toFixed(2)),
        igv: afectoIgv ? parseFloat(igv.toFixed(2)) : 0,
        tipoDocumento: this.getRandomDocumentType(),
        nroDocumento: nroDocumento,
        metodoPago: this.getRandomPaymentMethod(),
        categoria: this.mapCategoriaToEnum(categoria),
        afectoIgv: afectoIgv,
        otrosServicios: otrosServicios,
        ordenInterna: ordenInterna,
        pais: paisSeleccionado,
        ciudad: ciudadSeleccionada
      }
    };
  }

  /**
   * Genera monto realista según tipo de gasto
   */
  private generateRealisticAmount(categoria: string, moneda: 'PEN' | 'USD' | 'EUR'): number {
    const factor = moneda === 'PEN' ? 1 : (moneda === 'EUR' ? 0.24 : 0.27);
    switch (categoria) {
      case 'alimentacion':
        return Math.round((Math.floor(Math.random() * 155) + 25) * factor * 100) / 100;
      case 'transporte':
        return Math.round((Math.floor(Math.random() * 105) + 15) * factor * 100) / 100;
      case 'hospedaje':
        return Math.round((Math.floor(Math.random() * 370) + 180) * factor * 100) / 100;
      default:
        return Math.round((Math.floor(Math.random() * 290) + 10) * factor * 100) / 100;
    }
  }

  /**
   * Genera fecha reciente (últimos 15 días)
   * SAP DI generalmente extrae fechas con alta precisión
   */
  private generateRecentDate(): string {
    const today = new Date();
    const daysAgo = Math.floor(Math.random() * 15); // Últimos 15 días
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Genera número de comprobante peruano válido
   * Formato: Serie (3 o 4 char) - Correlativo (8 dígitos)
   */
  private generatePeruvianInvoiceNumber(): string {
    // Series comunes en Perú
    const series = [
      'F001', 'F002', 'F003', 'F004', // Facturas
      'B001', 'B002', 'B003', 'B004', // Boletas
      'E001', // Electrónicas
      'NV01', 'NV02' // Notas de venta
    ];
    
    const serie = series[Math.floor(Math.random() * series.length)];
    const correlativo = String(Math.floor(Math.random() * 99999999) + 1).padStart(8, '0');
    
    return `${serie}-${correlativo}`;
  }

  /**
   * Tipo de documento fiscal
   */
  private getRandomDocumentType(): string {
    const tipos = ['FACTURA', 'BOLETA', 'TICKET'];
    return tipos[Math.floor(Math.random() * tipos.length)];
  }

  /**
   * Método de pago detectado
   */
  private getRandomPaymentMethod(): string {
    const metodos = ['Efectivo', 'Tarjeta Crédito', 'Tarjeta Débito', 'Transferencia'];
    return metodos[Math.floor(Math.random() * metodos.length)];
  }

  /**
   * Mapea categoría a enum
   */
  private mapCategoriaToEnum(categoria: string): string {
    const map: Record<string, string> = {
      'alimentacion': 'ALIMENTACION',
      'transporte': 'TRANSPORTE',
      'hospedaje': 'HOSPEDAJE'
    };
    return map[categoria] || 'OTROS';
  }
}
