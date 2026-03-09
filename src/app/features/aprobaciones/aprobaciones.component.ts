import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SolicitudService } from '../../core/services/solicitud.service';
import { RendicionService } from '../../core/services/rendicion.service';
import { AuthStore } from '../../core/stores/auth.store';
import { Solicitud, EstadoSolicitud, Rendicion, EstadoRendicion, UserRole } from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { RendicionDetalleDialogComponent } from './rendicion-detalle-dialog.component';
import { SolicitudDetalleDialogComponent } from './solicitud-detalle-dialog.component';
import { FlujoAprobacionDialogComponent } from '../rendiciones/pages/listado-rendiciones/flujo-aprobacion-dialog.component';

type FiltroEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS';

/**
 * Componente de Aprobaciones
 * Vista unificada para aprobadores
 */
@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="aprobaciones-container">

      <!-- ========== COMPROBANTES MODAL ========== -->
      @if (comprobantesModal()) {
        <div class="modal-overlay" (click)="cerrarComprobantesModal()">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-monto-total">
              <span class="mt-label">Monto Total Registrado:</span>
              <span class="mt-value">{{ calcMontoTotalComprobantes(comprobantesModal()!.solicitudId, comprobantesModal()!.concepto) }}</span>
            </div>
            <div class="modal-section-title">Comprobantes ({{ getDocumentosViatico(comprobantesModal()!.solicitudId, comprobantesModal()!.concepto).length }})</div>
            <table class="comprobantes-table">
              <thead>
                <tr><th>Proveedor</th><th>Fecha</th><th>Importe</th></tr>
              </thead>
              <tbody>
                @for (doc of getDocumentosViatico(comprobantesModal()!.solicitudId, comprobantesModal()!.concepto); track doc.id) {
                  <tr (click)="verDocumentoDetalle(doc)">
                    <td>{{ doc.proveedor || doc.concepto }}</td>
                    <td>{{ formatDate(doc.fecha) }}</td>
                    <td class="importe-cell">{{ doc.monto.toFixed(2) }} {{ doc.moneda }}<mat-icon>navigate_next</mat-icon></td>
                  </tr>
                }
                @if (getDocumentosViatico(comprobantesModal()!.solicitudId, comprobantesModal()!.concepto).length === 0) {
                  <tr><td colspan="3" class="sin-docs">Sin comprobantes registrados</td></tr>
                }
              </tbody>
            </table>
            <div class="modal-footer">
              <button mat-flat-button (click)="cerrarComprobantesModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========== DOCUMENTO DETALLE MODAL ========== -->
      @if (documentoDetalleModal()) {
        <div class="modal-overlay" (click)="cerrarDocumentoDetalleModal()">
          <div class="modal-panel doc-detail-panel" (click)="$event.stopPropagation()">
            <div class="doc-field"><label>País :</label><span>Perú</span></div>
            <div class="doc-field"><label>Ciudad :</label><span>{{ documentoDetalleModal()!.destino || documentoDetalleModal()!.salida || 'Lima' }}</span></div>

            <div class="doc-section-header" (click)="toggleSeccionInfoContable()">
              <span>Información Contable</span>
              <mat-icon>{{ seccionInfoContableExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </div>
            @if (seccionInfoContableExpanded()) {
              <div class="doc-section-body">
                <div class="doc-field"><label>Tipo de Viático :</label><span>{{ getCategoriaLabel(documentoDetalleModal()!.categoria) }}</span></div>
                <div class="doc-field"><label>Sub Rubro :</label><span>{{ documentoDetalleModal()!.concepto }}</span></div>
                <div class="doc-field"><label>Importe :</label><span>{{ documentoDetalleModal()!.monto.toFixed(2) }} {{ documentoDetalleModal()!.moneda }}</span></div>
                <div class="doc-field"><label>Afecto IGV :</label><span>Sí</span></div>
                <div class="doc-field"><label>IGV :</label><span>{{ calcIGV(documentoDetalleModal()!.monto) }} {{ documentoDetalleModal()!.moneda }}</span></div>
                <div class="doc-field"><label>Otros Servicios :</label><span>0.00 {{ documentoDetalleModal()!.moneda }}</span></div>
                <div class="doc-field"><label>Orden Interna :</label><span>ORD-2026-{{ getOrdenInterna(documentoDetalleModal()!) }}</span></div>
              </div>
            }

            <div class="doc-section-header" (click)="toggleSeccionJustificacion()">
              <span>Justificación y Observaciones</span>
              <mat-icon>{{ seccionJustificacionExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </div>
            @if (seccionJustificacionExpanded()) {
              <div class="doc-section-body">
                <p class="doc-obs">{{ documentoDetalleModal()!.justificacion || 'Sin observaciones registradas.' }}</p>
              </div>
            }

            <div class="doc-actions-footer">
              <button mat-flat-button class="preview-btn"><mat-icon>preview</mat-icon> Previsualizar Documento</button>
              <button mat-button (click)="cerrarDocumentoDetalleModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========== MAIN TABS ========== -->
      <mat-tab-group class="approval-tabs" [selectedIndex]="tabActiva()" (selectedIndexChange)="onTabChange($event)">

        <!-- ===== TAB 1: SOLICITUDES ===== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>flight_takeoff</mat-icon>
            Solicitudes
            @if (solicitudesPendientes() > 0) {
              <span class="tab-badge">{{ solicitudesPendientes() }}</span>
            }
          </ng-template>

          <div class="master-detail-layout">

            <!-- LIST PANEL -->
            <div class="list-panel" [class.panel-hidden]="selectedSolicitudId() !== null">

              <div class="list-panel-header">
                <span class="panel-title">{{ getLabelFiltroSolicitudes() }} ({{ solicitudesFiltradas().length }})</span>
              </div>

              <div class="filtro-toggle-row" (click)="toggleFiltrosAvanzados()">
                <span>{{ filtrosAvanzadosExpandidos() ? 'Ocultar Filtros' : 'Desplegar Filtros' }}</span>
                <mat-icon>{{ filtrosAvanzadosExpandidos() ? 'expand_less' : 'navigate_next' }}</mat-icon>
              </div>

              @if (filtrosAvanzadosExpandidos()) {
                <div class="filter-expanded-area">
                  <div class="status-pills-row">
                    <button class="status-pill" [class.active]="filtroSolicitudes() === 'PENDIENTE'" (click)="cambiarFiltroSolicitudes('PENDIENTE')">
                      Pendientes <span class="pill-count">{{ solicitudesPendientes() }}</span>
                    </button>
                    <button class="status-pill" [class.active]="filtroSolicitudes() === 'APROBADO'" (click)="cambiarFiltroSolicitudes('APROBADO')">Aprobadas</button>
                    <button class="status-pill" [class.active]="filtroSolicitudes() === 'RECHAZADO'" (click)="cambiarFiltroSolicitudes('RECHAZADO')">Rechazadas</button>
                    <button class="status-pill" [class.active]="filtroSolicitudes() === 'TODOS'" (click)="cambiarFiltroSolicitudes('TODOS')">
                      Todas <span class="pill-count">{{ todasSolicitudes().length }}</span>
                    </button>
                  </div>
                </div>
              }

              <div class="select-all-row">
                <mat-checkbox
                  [checked]="todosSolicitudesSeleccionados()"
                  [indeterminate]="algunasSolicitudesSeleccionadas()"
                  (change)="toggleTodasSolicitudes($event.checked)">
                  Seleccionar todo
                </mat-checkbox>
              </div>

              <div class="items-list">
                @if (solicitudesFiltradas().length === 0) {
                  <div class="list-empty">
                    <mat-icon>task_alt</mat-icon>
                    <p>Sin solicitudes con este estado</p>
                  </div>
                }
                @for (sol of solicitudesFiltradas(); track sol.id) {
                  <div class="list-item" [class.item-selected]="selectedSolicitudId() === sol.id" (click)="selectSolicitud(sol.id)">
                    <mat-checkbox class="item-check"
                      [checked]="solicitudesSeleccionadas().has(sol.id)"
                      (change)="toggleSolicitud(sol.id, $event.checked)"
                      (click)="$event.stopPropagation()">
                    </mat-checkbox>
                    <div class="item-main">
                      <div class="item-tag sol-tag">SOL. GASTOS DE VIAJE</div>
                      <div class="item-number">N° {{ sol.codigo }}</div>
                      <div class="item-name">{{ sol.empleadoNombre }}</div>
                      <div class="item-route">
                        <mat-icon>flight</mat-icon>
                        <span>{{ sol.origen || 'Lima' }} → {{ sol.destino }}</span>
                      </div>
                      <div class="item-date">{{ formatDate(sol.fechaSalida) }}</div>
                    </div>
                    <div class="item-right">
                      <div class="item-amount">{{ sol.presupuestoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</div>
                      <div class="item-currency">{{ sol.monedaAnticipo || 'PEN' }}</div>
                    </div>
                    <mat-icon class="item-chevron">navigate_next</mat-icon>
                  </div>
                }
              </div>
            </div>

            <!-- SOLICITUD DETAIL PANEL -->
            <div class="detail-panel" [class.detail-placeholder-panel]="selectedSolicitudId() === null">
              @if (selectedSolicitudId() === null) {
                <mat-icon>touch_app</mat-icon>
                <p>Selecciona una solicitud para ver el detalle</p>
              } @else {
                <!-- Detail top bar -->
                <div class="detail-top-bar">
                  <button mat-icon-button class="back-btn" (click)="selectedSolicitudId.set(null)">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <span class="detail-top-title">{{ selectedSolicitud()?.empleadoNombre }}</span>
                  @if (selectedSolicitud()?.estado === 'PENDIENTE_N1' || selectedSolicitud()?.estado === 'PENDIENTE_N2') {
                    <div class="detail-actions-inline">
                      <button mat-stroked-button color="warn" (click)="rechazarSolicitud(selectedSolicitud()!)">
                        <mat-icon>close</mat-icon> Rechazar
                      </button>
                      <button mat-flat-button color="primary" (click)="aprobarSolicitud(selectedSolicitud()!)">
                        <mat-icon>check</mat-icon> Aprobar
                      </button>
                    </div>
                  }
                </div>

                <!-- Datos Generales -->
                <div class="detail-section">
                  <div class="section-header" (click)="toggleSeccionDatosGenerales()">
                    <mat-icon>{{ seccionDatosGeneralesExpanded() ? 'expand_more' : 'navigate_next' }}</mat-icon>
                    <span>Datos Generales</span>
                  </div>
                  @if (seccionDatosGeneralesExpanded()) {
                    <div class="section-body">
                      <div class="detail-field">
                        <label>Nombre :</label>
                        <span>{{ selectedSolicitud()?.empleadoNombre }}</span>
                      </div>
                      <div class="detail-field">
                        <label>Motivo de viaje :</label>
                        <span>{{ selectedSolicitud()?.motivoViaje }}</span>
                      </div>
                      <button class="ver-otros-link" (click)="verDetalleSolicitud(selectedSolicitud()!)">
                        <mat-icon>open_in_new</mat-icon> Ver otros datos
                      </button>
                    </div>
                  }
                </div>

                <!-- Detalle de Viáticos -->
                <div class="detail-section">
                  <div class="section-header" (click)="toggleSeccionViaticos()">
                    <mat-icon>{{ seccionViaticosExpanded() ? 'expand_more' : 'navigate_next' }}</mat-icon>
                    <span>Detalle de Viáticos</span>
                  </div>
                  @if (seccionViaticosExpanded()) {
                    <div class="section-body no-padding">
                      <table class="viaticos-table">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Monto Rendido</th>
                            <th>Documentos</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (viatico of (selectedSolicitud()?.viaticos || []); track viatico.concepto) {
                            <tr>
                              <td class="td-concepto">{{ viatico.concepto }}</td>
                              <td class="td-monto">
                                <div class="monto-rendido">{{ getMontoRendidoCategoria(selectedSolicitud(), viatico.concepto) }} {{ viatico.moneda }}</div>
                                <div class="monto-aprobado-info">Monto Aprobado: {{ viatico.monto.toFixed(2) }} {{ viatico.moneda }}</div>
                                @if (getMontoRendidoNum(selectedSolicitud(), viatico.concepto) > 0) {
                                  <div class="exceso-info"
                                    [class.exceso-neg]="getExceso(selectedSolicitud(), viatico) < 0"
                                    [class.exceso-pos]="getExceso(selectedSolicitud(), viatico) > 0">
                                    Exceso: {{ getExceso(selectedSolicitud(), viatico) > 0 ? '+' : '' }}{{ getExceso(selectedSolicitud(), viatico).toFixed(0) }} {{ viatico.moneda }}
                                  </div>
                                }
                              </td>
                              <td class="td-docs">
                                <button class="ver-docs-btn" (click)="verDocumentosViatico(selectedSolicitud(), viatico)">Ver Documentos</button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          @if (solicitudesSeleccionadas().size > 0) {
            <div class="bulk-actions-toolbar">
              <div class="toolbar-content">
                <span class="selection-count">
                  <mat-icon>check_circle</mat-icon>
                  {{ solicitudesSeleccionadas().size }} seleccionada(s)
                </span>
                <div class="toolbar-actions">
                  <button mat-stroked-button color="warn" (click)="rechazarSolicitudesSeleccionadas()">
                    <mat-icon>cancel</mat-icon> Rechazar
                  </button>
                  <button mat-raised-button (click)="aprobarSolicitudesSeleccionadas()">
                    <mat-icon>check_circle</mat-icon> Aprobar
                  </button>
                </div>
              </div>
            </div>
          }
        </mat-tab>

        <!-- ===== TAB 2: GASTOS ===== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>receipt_long</mat-icon>
            Gastos de Rendición
            @if (gastosPendientes() > 0) {
              <span class="tab-badge">{{ gastosPendientes() }}</span>
            }
          </ng-template>

          <div class="master-detail-layout">

            <!-- LIST PANEL -->
            <div class="list-panel" [class.panel-hidden]="selectedGastoId() !== null">

              <div class="list-panel-header">
                <span class="panel-title">{{ getLabelFiltroGastos() }} ({{ gastosCategoriaFiltrados().length }})</span>
              </div>

              <div class="filtro-toggle-row" (click)="toggleFiltrosAvanzados()">
                <span>{{ filtrosAvanzadosExpandidos() ? 'Ocultar Filtros' : 'Desplegar Filtros' }}</span>
                <mat-icon>{{ filtrosAvanzadosExpandidos() ? 'expand_less' : 'navigate_next' }}</mat-icon>
              </div>

              @if (filtrosAvanzadosExpandidos()) {
                <div class="filter-expanded-area">
                  <div class="status-pills-row">
                    <button class="status-pill" [class.active]="filtroGastos() === 'PENDIENTE'" (click)="cambiarFiltroGastos('PENDIENTE')">
                      Pendientes <span class="pill-count">{{ gastosPendientes() }}</span>
                    </button>
                    <button class="status-pill" [class.active]="filtroGastos() === 'APROBADO'" (click)="cambiarFiltroGastos('APROBADO')">Aprobados</button>
                    <button class="status-pill" [class.active]="filtroGastos() === 'RECHAZADO'" (click)="cambiarFiltroGastos('RECHAZADO')">Rechazados</button>
                    <button class="status-pill" [class.active]="filtroGastos() === 'TODOS'" (click)="cambiarFiltroGastos('TODOS')">
                      Todos <span class="pill-count">{{ todosGastos().length }}</span>
                    </button>
                  </div>
                  <div class="cat-pills-row">
                    <button class="cat-pill" [class.active]="filtroCategoria() === 'TODOS'" (click)="filtroCategoria.set('TODOS')">Todos</button>
                    <button class="cat-pill cc-food" [class.active]="filtroCategoria() === 'ALIMENTACION'" (click)="filtroCategoria.set('ALIMENTACION')">Alimentación</button>
                    <button class="cat-pill cc-car" [class.active]="filtroCategoria() === 'TRANSPORTE'" (click)="filtroCategoria.set('TRANSPORTE')">Transporte</button>
                    <button class="cat-pill cc-hotel" [class.active]="filtroCategoria() === 'HOSPEDAJE'" (click)="filtroCategoria.set('HOSPEDAJE')">Hospedaje</button>
                    <button class="cat-pill cc-other" [class.active]="filtroCategoria() === 'OTROS'" (click)="filtroCategoria.set('OTROS')">Otros</button>
                  </div>
                </div>
              }

              <div class="select-all-row">
                <mat-checkbox
                  [checked]="todosGastosSeleccionados()"
                  [indeterminate]="algunosGastosSeleccionados()"
                  (change)="toggleTodosGastos($event.checked)">
                  Seleccionar todo
                </mat-checkbox>
              </div>

              <div class="items-list">
                @if (gastosCategoriaFiltrados().length === 0) {
                  <div class="list-empty">
                    <mat-icon>task_alt</mat-icon>
                    <p>Sin gastos con este estado</p>
                  </div>
                }
                @for (gasto of gastosCategoriaFiltrados(); track gasto.id) {
                  <div class="list-item" [class.item-selected]="selectedGastoId() === gasto.id" (click)="selectGasto(gasto.id)">
                    <mat-checkbox class="item-check"
                      [checked]="gastosSeleccionados().has(gasto.id)"
                      (change)="toggleGasto(gasto.id, $event.checked)"
                      (click)="$event.stopPropagation()">
                    </mat-checkbox>
                    <div class="item-main">
                      <div class="item-tag rend-tag">REND. GASTOS DE VIAJE</div>
                      <div class="item-number">N° {{ gasto.id }}</div>
                      <div class="item-name">{{ getColaboradorNombre(gasto) }}</div>
                      <div class="item-route">
                        <mat-icon>{{ getCategoriaIcon(gasto.categoria) }}</mat-icon>
                        <span>{{ gasto.destino || getCategoriaLabel(gasto.categoria) }}</span>
                      </div>
                      <div class="item-date">{{ formatDate(gasto.fecha) }}</div>
                    </div>
                    <div class="item-right">
                      <div class="item-amount">{{ gasto.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</div>
                      <div class="item-currency">{{ gasto.moneda }}</div>
                    </div>
                    <mat-icon class="item-chevron">navigate_next</mat-icon>
                  </div>
                }
              </div>
            </div>

            <!-- GASTO DETAIL PANEL -->
            <div class="detail-panel" [class.detail-placeholder-panel]="selectedGastoId() === null">
              @if (selectedGastoId() === null) {
                <mat-icon>touch_app</mat-icon>
                <p>Selecciona un gasto para ver el detalle</p>
              } @else {
                <!-- Detail top bar -->
                <div class="detail-top-bar">
                  <button mat-icon-button class="back-btn" (click)="selectedGastoId.set(null)">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <span class="detail-top-title">{{ getColaboradorNombre(selectedGasto()!) }}</span>
                  @if (selectedGasto()?.estado === 'PENDIENTE') {
                    <div class="detail-actions-inline">
                      <button mat-stroked-button color="warn" (click)="rechazarGasto(selectedGasto()!)">
                        <mat-icon>close</mat-icon> Rechazar
                      </button>
                      <button mat-flat-button color="primary" (click)="aprobarGasto(selectedGasto()!)">
                        <mat-icon>check</mat-icon> Aprobar
                      </button>
                    </div>
                  }
                </div>

                <!-- Datos Generales Gasto -->
                <div class="detail-section">
                  <div class="section-header" (click)="toggleSeccionDatosGenerales()">
                    <mat-icon>{{ seccionDatosGeneralesExpanded() ? 'expand_more' : 'navigate_next' }}</mat-icon>
                    <span>Datos Generales</span>
                  </div>
                  @if (seccionDatosGeneralesExpanded()) {
                    <div class="section-body">
                      <div class="detail-field">
                        <label>Nombre :</label>
                        <span>{{ getColaboradorNombre(selectedGasto()!) }}</span>
                      </div>
                      <div class="detail-field">
                        <label>Motivo de viaje :</label>
                        <span>{{ selectedGasto()?.concepto }}</span>
                      </div>
                      <button class="ver-otros-link" (click)="verDetalleGasto(selectedGasto()!)">
                        <mat-icon>open_in_new</mat-icon> Ver otros datos
                      </button>
                    </div>
                  }
                </div>

                <!-- Información Contable Gasto -->
                <div class="detail-section">
                  <div class="section-header" (click)="toggleSeccionViaticos()">
                    <mat-icon>{{ seccionViaticosExpanded() ? 'expand_more' : 'navigate_next' }}</mat-icon>
                    <span>Detalle de Viáticos</span>
                  </div>
                  @if (seccionViaticosExpanded()) {
                    <div class="section-body no-padding">
                      <table class="viaticos-table">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Monto Rendido</th>
                            <th>Documentos</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="td-concepto">{{ getCategoriaLabel(selectedGasto()!.categoria) }}</td>
                            <td class="td-monto">
                              <div class="monto-rendido">{{ selectedGasto()!.monto.toFixed(2) }} {{ selectedGasto()!.moneda }}</div>
                              <div class="monto-aprobado-info">Tipo de Viático: {{ getCategoriaLabel(selectedGasto()!.categoria) }}</div>
                            </td>
                            <td class="td-docs">
                              @if (selectedGasto()!.comprobante) {
                                <button class="ver-docs-btn" (click)="verDocumentoDetalle(selectedGasto()!)">Ver Documento</button>
                              } @else {
                                <span class="sin-comp">Sin comprobante</span>
                              }
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                </div>

                <!-- Información Contable -->
                <div class="detail-section">
                  <div class="section-header" (click)="toggleSeccionInfoContable()">
                    <mat-icon>{{ seccionInfoContableExpanded() ? 'expand_more' : 'navigate_next' }}</mat-icon>
                    <span>Información Contable</span>
                  </div>
                  @if (seccionInfoContableExpanded()) {
                    <div class="section-body">
                      <div class="detail-field"><label>Sub Rubro :</label><span>{{ selectedGasto()?.concepto }}</span></div>
                      <div class="detail-field"><label>Importe :</label><span>{{ selectedGasto()!.monto.toFixed(2) }} {{ selectedGasto()!.moneda }}</span></div>
                      <div class="detail-field"><label>Afecto IGV :</label><span>Sí</span></div>
                      <div class="detail-field"><label>IGV :</label><span>{{ calcIGV(selectedGasto()!.monto) }} {{ selectedGasto()!.moneda }}</span></div>
                      <div class="detail-field"><label>Otros Servicios :</label><span>0.00 {{ selectedGasto()!.moneda }}</span></div>
                      <div class="detail-field"><label>Orden Interna :</label><span>ORD-2026-{{ getOrdenInterna(selectedGasto()!) }}</span></div>
                      @if (selectedGasto()?.justificacion) {
                        <div class="detail-field"><label>Justificación :</label><span>{{ selectedGasto()!.justificacion }}</span></div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          @if (gastosSeleccionados().size > 0) {
            <div class="bulk-actions-toolbar">
              <div class="toolbar-content">
                <span class="selection-count">
                  <mat-icon>check_circle</mat-icon>
                  {{ gastosSeleccionados().size }} seleccionado(s)
                </span>
                <div class="toolbar-actions">
                  <button mat-stroked-button color="warn" (click)="rechazarGastosSeleccionados()">
                    <mat-icon>cancel</mat-icon> Rechazar
                  </button>
                  <button mat-raised-button (click)="aprobarGastosSeleccionados()">
                    <mat-icon>check_circle</mat-icon> Aprobar
                  </button>
                </div>
              </div>
            </div>
          }
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`

    /* ===== Container ===== */
    .aprobaciones-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f5f5f5;
    }

    /* ===== Tabs ===== */
    ::ng-deep .approval-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .mat-mdc-tab-body-wrapper { flex: 1; overflow: hidden; }
      .mat-mdc-tab-body-active { height: 100%; }
      .mat-mdc-tab-body-content { height: 100%; overflow: hidden; }

      .mat-mdc-tab-label { min-width: 140px; }

      .tab-badge {
        background: #da291c;
        color: white;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 11px;
        font-weight: 700;
        margin-left: 6px;
      }
    }

    /* ===== Master-Detail Layout ===== */
    .master-detail-layout {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    /* ===== List Panel ===== */
    .list-panel {
      width: 360px;
      min-width: 260px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e0e0e0;
      background: white;
      overflow: hidden;
      flex-shrink: 0;
    }

    .list-panel-header {
      background: #da291c;
      padding: 14px 16px;

      .panel-title {
        font-size: 16px;
        font-weight: 700;
        color: white;
      }
    }

    .filtro-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      background: #fafafa;
      user-select: none;

      span { font-size: 13px; color: #444; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #888; }

      &:hover { background: #f5f5f5; }
    }

    .filter-expanded-area {
      padding: 10px 14px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
    }

    .status-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 6px;
    }

    .status-pill {
      padding: 3px 10px;
      border: 1px solid #ddd;
      border-radius: 14px;
      background: white;
      font-size: 12px;
      color: #555;
      cursor: pointer;
      transition: all 0.15s;

      &.active { background: #da291c; color: white; border-color: #da291c; }

      .pill-count {
        background: rgba(0,0,0,0.1);
        border-radius: 9px;
        padding: 0 5px;
        font-weight: 700;
        font-size: 11px;
        margin-left: 3px;
      }

      &.active .pill-count { background: rgba(255,255,255,0.2); }
    }

    .cat-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 4px;
    }

    .cat-pill {
      padding: 3px 9px;
      border: 1px solid #ddd;
      border-radius: 12px;
      background: white;
      font-size: 11px;
      color: #555;
      cursor: pointer;

      &.active { background: #1565c0; color: white; border-color: #1565c0; }
      &.cc-food.active { background: #e65100; border-color: #e65100; }
      &.cc-car.active { background: #1565c0; border-color: #1565c0; }
      &.cc-hotel.active { background: #6a1b9a; border-color: #6a1b9a; }
      &.cc-other.active { background: #37474f; border-color: #37474f; }
    }

    .select-all-row {
      padding: 9px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: white;

      mat-checkbox { font-size: 13px; }
    }

    .items-list {
      flex: 1;
      overflow-y: auto;
    }

    .list-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      text-align: center;
      color: #999;

      mat-icon { font-size: 44px; width: 44px; height: 44px; margin-bottom: 12px; color: #ddd; }
      p { font-size: 13px; margin: 0; }
    }

    .list-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      gap: 8px;
      transition: background 0.15s;
      border-left: 3px solid transparent;

      &:hover { background: #fafafa; }
      &.item-selected {
        background: #fff5f5;
        border-left-color: #da291c;
      }
    }

    .item-check { flex-shrink: 0; }

    .item-main {
      flex: 1;
      min-width: 0;
    }

    .item-tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 9px;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 3px;
      letter-spacing: 0.2px;
    }

    .sol-tag { background: #e3f2fd; color: #1565c0; }
    .rend-tag { background: #f3e5f5; color: #6a1b9a; }

    .item-number {
      font-size: 13px;
      font-weight: 700;
      color: #212121;
    }

    .item-name {
      font-size: 12px;
      color: #555;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
    }

    .item-route {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-top: 2px;

      mat-icon { font-size: 13px; width: 13px; height: 13px; color: #777; }
      span { font-size: 11px; color: #777; }
    }

    .item-date {
      font-size: 11px;
      color: #e53935;
      margin-top: 2px;
    }

    .item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .item-amount {
      font-size: 15px;
      font-weight: 700;
      color: #1565c0;
    }

    .item-currency {
      font-size: 11px;
      color: #999;
    }

    .item-chevron {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #bbb;
      flex-shrink: 0;
    }

    /* ===== Detail Panel ===== */
    .detail-panel {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
    }

    .detail-placeholder-panel {
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;

      mat-icon { font-size: 56px; width: 56px; height: 56px; color: #ddd; }
      p { font-size: 14px; color: #aaa; margin: 0; }
    }

    .detail-top-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: white;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
      z-index: 5;

      .back-btn { color: #da291c !important; flex-shrink: 0; }

      .detail-top-title {
        font-size: 14px;
        font-weight: 700;
        color: #212121;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .detail-actions-inline {
      display: flex;
      gap: 6px;
      flex-shrink: 0;

      button {
        border-radius: 6px !important;
        font-size: 12px !important;
        height: 32px !important;
        line-height: 32px !important;
        padding: 0 10px !important;
      }
    }

    .detail-section {
      background: white;
      margin: 8px 8px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #eee;
    }

    .section-header {
      display: flex;
      align-items: center;
      padding: 11px 14px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #f0f0f0;

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #666; margin-right: 6px; }
      span { font-size: 14px; font-weight: 600; color: #333; flex: 1; }

      &:hover { background: #fafafa; }
    }

    .section-body { padding: 12px 16px; }
    .section-body.no-padding { padding: 0; }

    .detail-field {
      margin-bottom: 10px;

      label {
        display: block;
        font-size: 11px;
        color: #888;
        margin-bottom: 2px;
      }

      span {
        font-size: 13px;
        color: #212121;
        background: #f8f8f8;
        display: block;
        padding: 7px 10px;
        border-radius: 4px;
        border: 1px solid #eee;
      }
    }

    .ver-otros-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: none;
      background: none;
      color: #1565c0;
      font-size: 13px;
      cursor: pointer;
      font-style: italic;
      padding: 2px 0;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { text-decoration: underline; }
    }

    /* ===== Viáticos Table ===== */
    .viaticos-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      thead tr { background: #f8f8f8; }

      th {
        padding: 8px 12px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: #666;
        border-bottom: 1px solid #eee;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #f5f5f5;
        vertical-align: top;
      }

      tbody tr:last-child td { border-bottom: none; }

      .td-concepto { font-weight: 500; color: #333; }

      .monto-rendido { font-weight: 600; color: #1565c0; }

      .monto-aprobado-info { font-size: 11px; color: #888; margin-top: 3px; }

      .exceso-info {
        font-size: 11px;
        margin-top: 2px;
        font-weight: 600;

        &.exceso-neg { color: #e53935; }
        &.exceso-pos { color: #43a047; }
      }

      .ver-docs-btn {
        padding: 5px 9px;
        background: #e3f2fd;
        border: 1px solid #90caf9;
        border-radius: 4px;
        font-size: 12px;
        color: #1565c0;
        cursor: pointer;
        white-space: nowrap;

        &:hover { background: #bbdefb; }
      }

      .sin-comp { font-size: 11px; color: #aaa; }
    }

    /* ===== Bulk Toolbar ===== */
    .bulk-actions-toolbar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
      z-index: 1000;

      .toolbar-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .selection-count {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-weight: 600;
        font-size: 14px;

        mat-icon { font-size: 20px; width: 20px; height: 20px; color: #22c55e; }
      }

      .toolbar-actions {
        display: flex;
        gap: 10px;

        button { font-weight: 600; border-radius: 8px !important; }
        button[color="warn"] { border-color: #fca5a5 !important; color: #fca5a5 !important; }
        button:not([color]) { background: #da291c; color: white; }
      }
    }

    /* ===== Inline Modals ===== */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.45);
      z-index: 9000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .modal-panel {
      background: white;
      width: 100%;
      max-width: 520px;
      border-radius: 16px 16px 0 0;
      padding: 20px;
      max-height: 78vh;
      overflow-y: auto;
      animation: slideUpModal 0.22s ease-out;
    }

    @keyframes slideUpModal {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .modal-monto-total {
      padding: 12px 0;
      border-bottom: 1px solid #eee;
      margin-bottom: 14px;

      .mt-label { display: block; font-size: 12px; color: #888; }
      .mt-value { display: block; font-size: 20px; font-weight: 700; color: #1565c0; }
    }

    .modal-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }

    .comprobantes-table {
      width: 100%;
      border-collapse: collapse;

      th {
        font-size: 11px;
        color: #888;
        text-align: left;
        padding: 5px 10px;
        border-bottom: 1px solid #eee;
        text-transform: uppercase;
      }

      td {
        padding: 11px 10px;
        border-bottom: 1px solid #f5f5f5;
        font-size: 13px;
        color: #333;
      }

      tbody tr { cursor: pointer; &:hover { background: #f5f5f5; } }

      .importe-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        font-weight: 600;
        color: #1565c0;

        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #aaa; }
      }

      .sin-docs { text-align: center; color: #aaa; font-size: 12px; padding: 16px; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 14px;
      margin-top: 6px;
      border-top: 1px solid #eee;
    }

    /* Document detail modal */
    .doc-detail-panel { max-width: 420px; }

    .doc-field {
      margin-bottom: 10px;

      label { display: block; font-size: 12px; color: #888; margin-bottom: 3px; }
      span {
        font-size: 13px;
        color: #212121;
        background: #f8f8f8;
        display: block;
        padding: 7px 10px;
        border-radius: 4px;
        border: 1px solid #eee;
      }
    }

    .doc-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 2px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      margin: 10px 0 8px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .doc-section-body { margin-bottom: 8px; }
    .doc-obs { font-size: 13px; color: #555; margin: 0; }

    .doc-actions-footer {
      position: sticky;
      bottom: 0;
      background: white;
      padding: 12px 0 2px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .preview-btn { background: #1565c0 !important; color: white !important; border-radius: 6px !important; }
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .list-panel { width: 100%; max-width: 100%; flex-shrink: 0; }

      .panel-hidden { display: none !important; }

      .detail-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 200;
        animation: slideInRight 0.22s ease-out;
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to   { transform: translateX(0); }
      }

      .detail-placeholder-panel { display: none; }
    }

    @media (min-width: 769px) {
      .panel-hidden { display: flex !important; }
      .detail-placeholder-panel { display: flex !important; }
    }
  `]
})
export class AprobacionesComponent implements OnInit {
  // Signals de datos completos
  todasSolicitudes = signal<Solicitud[]>([]);
  todosGastos = signal<Rendicion[]>([]);

  // Signals de filtros
  filtroSolicitudes = signal<FiltroEstado>('PENDIENTE');
  filtroGastos = signal<FiltroEstado>('PENDIENTE');
  filtroCategoria = signal<string>('TODOS');
  versionFiltroSolicitudes = signal(0);
  versionFiltroGastos = signal(0);
  mostrarResumenDashboard = signal(false);
  tabActiva = signal(0);

  // Master-detail selection state
  selectedSolicitudId = signal<string | null>(null);
  selectedGastoId = signal<string | null>(null);
  seccionDatosGeneralesExpanded = signal(true);
  seccionViaticosExpanded = signal(true);
  seccionInfoContableExpanded = signal(true);
  seccionJustificacionExpanded = signal(false);
  comprobantesModal = signal<{ solicitudId: string; concepto: string } | null>(null);
  documentoDetalleModal = signal<Rendicion | null>(null);
  // MÓDULO 4: Signals para selección múltiple
  solicitudesSeleccionadas = signal<Set<string>>(new Set());
  gastosSeleccionados = signal<Set<string>>(new Set());
  solicitudesExpandidas = signal<Set<string>>(new Set());
  gastosExpandidos = signal<Set<string>>(new Set());
  filtrosAvanzadosExpandidos = signal(false);

  // MÓDULO 4: FormGroups para filtros avanzados
  filtrosAvanzadosSolicitudesForm: FormGroup;
  filtrosAvanzadosGastosForm: FormGroup;

  // Computed signal para empleados únicos
  empleadosUnicos = computed(() => {
    const empleados = this.todasSolicitudes().map(s => s.empleadoNombre);
    return [...new Set(empleados)].sort();
  });

  // Computed signals para verificar selección
  todosSolicitudesSeleccionados = computed(() => {
    const filtradas = this.solicitudesFiltradas();
    const seleccionadas = this.solicitudesSeleccionadas();
    return filtradas.length > 0 && filtradas.every(s => seleccionadas.has(s.id));
  });

  algunasSolicitudesSeleccionadas = computed(() => {
    const filtradas = this.solicitudesFiltradas();
    const seleccionadas = this.solicitudesSeleccionadas();
    return seleccionadas.size > 0 && !filtradas.every(s => seleccionadas.has(s.id));
  });

  todosGastosSeleccionados = computed(() => {
    const filtrados = this.gastosFiltrados();
    const seleccionados = this.gastosSeleccionados();
    return filtrados.length > 0 && filtrados.every(g => seleccionados.has(g.id));
  });

  algunosGastosSeleccionados = computed(() => {
    const filtrados = this.gastosFiltrados();
    const seleccionados = this.gastosSeleccionados();
    return seleccionados.size > 0 && !filtrados.every(g => seleccionados.has(g.id));
  });

  gastosCategoriaFiltrados = computed(() => {
    const cat = this.filtroCategoria();
    const gastos = this.gastosFiltrados();
    return cat === 'TODOS' ? gastos : gastos.filter(g => g.categoria === cat);
  });

  // Computed signals para filtrado dinámico
  solicitudesFiltradas = computed(() => {
    this.versionFiltroSolicitudes();
    const todas = this.todasSolicitudes();
    const filtro = this.filtroSolicitudes();
    const filtros = this.filtrosAvanzadosSolicitudesForm.getRawValue();

    let resultado = todas;

    if (filtro !== 'TODOS') {
      if (filtro === 'PENDIENTE') {
        resultado = resultado.filter(s => 
          s.estado === EstadoSolicitud.PENDIENTE_N1 || 
          s.estado === EstadoSolicitud.PENDIENTE_N2
        );
      }

      if (filtro === 'APROBADO') {
        resultado = resultado.filter(s => 
          s.estado === EstadoSolicitud.APROBADO_N1 || 
          s.estado === EstadoSolicitud.APROBADO_N2
        );
      }

      if (filtro === 'RECHAZADO') {
        resultado = resultado.filter(s => 
          s.estado === EstadoSolicitud.RECHAZADO_N1 || 
          s.estado === EstadoSolicitud.RECHAZADO_N2
        );
      }
    }

    if (Array.isArray(filtros.empleado) && filtros.empleado.length > 0) {
      resultado = resultado.filter(s => filtros.empleado.includes(s.empleadoNombre));
    }

    if (filtros.montoMin !== null && filtros.montoMin !== '' && !Number.isNaN(Number(filtros.montoMin))) {
      resultado = resultado.filter(s => s.presupuestoTotal >= Number(filtros.montoMin));
    }

    if (filtros.montoMax !== null && filtros.montoMax !== '' && !Number.isNaN(Number(filtros.montoMax))) {
      resultado = resultado.filter(s => s.presupuestoTotal <= Number(filtros.montoMax));
    }

    if (typeof filtros.destino === 'string' && filtros.destino.trim()) {
      const destino = filtros.destino.trim().toLowerCase();
      resultado = resultado.filter(s => (s.destino || '').toLowerCase().includes(destino));
    }

    if (filtros.fechaInicio) {
      const inicio = this.inicioDeDia(filtros.fechaInicio);
      resultado = resultado.filter(s => this.inicioDeDia(s.fechaSalida) >= inicio);
    }

    if (filtros.fechaFin) {
      const fin = this.finDeDia(filtros.fechaFin);
      resultado = resultado.filter(s => this.finDeDia(s.fechaRetorno) <= fin);
    }

    return resultado;
  });

  gastosFiltrados = computed(() => {
    this.versionFiltroGastos();
    const todos = this.todosGastos();
    const filtro = this.filtroGastos();
    const filtros = this.filtrosAvanzadosGastosForm.getRawValue();

    let resultado = filtro === 'TODOS' ? todos : todos.filter(g => g.estado === filtro);

    if (Array.isArray(filtros.categoria) && filtros.categoria.length > 0) {
      resultado = resultado.filter(g => filtros.categoria.includes(g.categoria));
    }

    if (filtros.montoMin !== null && filtros.montoMin !== '' && !Number.isNaN(Number(filtros.montoMin))) {
      resultado = resultado.filter(g => g.monto >= Number(filtros.montoMin));
    }

    if (filtros.montoMax !== null && filtros.montoMax !== '' && !Number.isNaN(Number(filtros.montoMax))) {
      resultado = resultado.filter(g => g.monto <= Number(filtros.montoMax));
    }

    if (typeof filtros.concepto === 'string' && filtros.concepto.trim()) {
      const concepto = filtros.concepto.trim().toLowerCase();
      resultado = resultado.filter(g => (g.justificacion || g.concepto || '').toLowerCase().includes(concepto));
    }

    if (filtros.fechaInicio) {
      const inicio = this.inicioDeDia(filtros.fechaInicio);
      resultado = resultado.filter(g => this.inicioDeDia(g.fecha) >= inicio);
    }

    if (filtros.fechaFin) {
      const fin = this.finDeDia(filtros.fechaFin);
      resultado = resultado.filter(g => this.finDeDia(g.fecha) <= fin);
    }

    return resultado;
  });

  // Contadores para stats
  solicitudesPendientes = computed(() => 
    this.todasSolicitudes().filter(s => 
      s.estado === EstadoSolicitud.PENDIENTE_N1 || 
      s.estado === EstadoSolicitud.PENDIENTE_N2
    ).length
  );

  gastosPendientes = computed(() => 
    this.todosGastos().filter(g => g.estado === EstadoRendicion.PENDIENTE).length
  );

  totalPendientes = computed(() => 
    this.solicitudesPendientes() + this.gastosPendientes()
  );

  montoSolicitudesPendientes = computed(() =>
    this.todasSolicitudes()
      .filter(s => s.estado === EstadoSolicitud.PENDIENTE_N1 || s.estado === EstadoSolicitud.PENDIENTE_N2)
      .reduce((acc, item) => acc + item.presupuestoTotal, 0)
  );

  montoGastosPendientes = computed(() =>
    this.todosGastos()
      .filter(g => g.estado === EstadoRendicion.PENDIENTE)
      .reduce((acc, item) => acc + item.monto, 0)
  );

  montosPendientes = computed(() => {
    const solicitudesPEN = this.montoSolicitudesPendientes();
    const gastos = this.todosGastos().filter(g => g.estado === EstadoRendicion.PENDIENTE);
    const gastosPEN = gastos
      .filter(g => (g.moneda || 'PEN') !== 'USD')
      .reduce((acc, item) => acc + item.monto, 0);
    const gastosUSD = gastos
      .filter(g => g.moneda === 'USD')
      .reduce((acc, item) => acc + item.monto, 0);

    return {
      PEN: solicitudesPEN + gastosPEN,
      USD: gastosUSD
    };
  });

  montoPendienteTotal = computed(() => this.montoSolicitudesPendientes() + this.montoGastosPendientes());

  pendientesCriticos = computed(() => {
    const solicitudesCriticas = this.todasSolicitudes().filter(
      s => (s.estado === EstadoSolicitud.PENDIENTE_N1 || s.estado === EstadoSolicitud.PENDIENTE_N2) && this.getSolicitudPrioridad(s) === 'alta'
    ).length;
    const gastosCriticos = this.todosGastos().filter(
      g => g.estado === EstadoRendicion.PENDIENTE && this.getGastoPrioridad(g) === 'alta'
    ).length;
    return solicitudesCriticas + gastosCriticos;
  });

  constructor(
    private fb: FormBuilder,
    private solicitudService: SolicitudService,
    private rendicionService: RendicionService,
    private authStore: AuthStore,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    // Inicializar formularios de filtros avanzados
    this.filtrosAvanzadosSolicitudesForm = this.fb.group({
      empleado: [[]],
      montoMin: [null],
      montoMax: [null],
      destino: [''],
      fechaInicio: [null],
      fechaFin: [null]
    });

    this.filtrosAvanzadosGastosForm = this.fb.group({
      categoria: [[]],
      montoMin: [null],
      montoMax: [null],
      concepto: [''],
      fechaInicio: [null],
      fechaFin: [null]
    });
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarGastos();
  }

  cargarSolicitudes(): void {
    this.solicitudService.getSolicitudes().subscribe((solicitudes: Solicitud[]) => {
      this.todasSolicitudes.set(solicitudes);
    });
  }

  cargarGastos(): void {
    this.rendicionService.getAll().subscribe((gastos: Rendicion[]) => {
      this.todosGastos.set(gastos);
    });
  }

  aprobarSolicitud(solicitud: Solicitud): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Solicitud',
        message: `¿Desea aprobar la solicitud de viaje a ${solicitud.destino}?`,
        confirmText: 'Aprobar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const nuevoEstado = solicitud.estado === EstadoSolicitud.PENDIENTE_N1 
          ? EstadoSolicitud.APROBADO_N1 
          : EstadoSolicitud.APROBADO_N2;

        this.solicitudService.updateSolicitud(solicitud.id, { estado: nuevoEstado }).subscribe({
          next: () => {
            this.snackBar.open('✓ Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
              this.cargarSolicitudes();
          },
          error: () => {
            this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  rechazarSolicitud(solicitud: Solicitud): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Solicitud',
        message: `¿Desea rechazar la solicitud de viaje a ${solicitud.destino}?`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const nuevoEstado = solicitud.estado === EstadoSolicitud.PENDIENTE_N1 
          ? EstadoSolicitud.RECHAZADO_N1
          : EstadoSolicitud.RECHAZADO_N2;
        
        this.solicitudService.updateSolicitud(solicitud.id, { estado: nuevoEstado }).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
          },
          error: () => {
            this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  aprobarGasto(gasto: Rendicion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Gasto',
        message: `¿Desea aprobar el gasto "${gasto.justificacion || gasto.concepto}" por ${this.formatMontoRendicion(gasto)}?`,
        confirmText: 'Aprobar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rendicionService.update(gasto.id, { estado: EstadoRendicion.APROBADO }).subscribe({
          next: () => {
            this.snackBar.open('✓ Gasto aprobado correctamente', 'Cerrar', { duration: 3000 });
            this.cargarGastos();
          },
          error: () => {
            this.snackBar.open('Error al aprobar el gasto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  rechazarGasto(gasto: Rendicion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Gasto',
        message: `¿Desea rechazar el gasto "${gasto.justificacion || gasto.concepto}"?`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rendicionService.update(gasto.id, { estado: EstadoRendicion.RECHAZADO }).subscribe({
          next: () => {
            this.snackBar.open('Gasto rechazado', 'Cerrar', { duration: 3000 });
            this.cargarGastos();
          },
          error: () => {
            this.snackBar.open('Error al rechazar el gasto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  verDetalleSolicitud(solicitud: Solicitud): void {
    const dialogRef = this.dialog.open(SolicitudDetalleDialogComponent, {
      width: '850px',
      maxWidth: '96vw',
      data: {
        solicitud,
        showActions: solicitud.estado === EstadoSolicitud.PENDIENTE_N1 || solicitud.estado === EstadoSolicitud.PENDIENTE_N2
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'aprobar') {
        this.aprobarSolicitud(solicitud);
      } else if (result?.action === 'rechazar') {
        this.rechazarSolicitud(solicitud);
      }
    });
  }

  verDetalleGasto(gasto: Rendicion): void {
    const dialogRef = this.dialog.open(RendicionDetalleDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { 
        rendicion: gasto,
        showActions: gasto.estado === EstadoRendicion.PENDIENTE
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'aprobar') {
        this.aprobarGasto(gasto);
      } else if (result?.action === 'rechazar') {
        this.rechazarGasto(gasto);
      }
    });
  }

  abrirComprobante(gasto: Rendicion): void {
    if (!gasto.comprobante) {
      this.snackBar.open('No hay documento adjunto para este gasto', 'Cerrar', { duration: 2500 });
      return;
    }
    window.open(gasto.comprobante, '_blank', 'noopener,noreferrer');
  }

  verHistorialEstadosSolicitud(solicitud: Solicitud): void {
    this.dialog.open(FlujoAprobacionDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      data: { solicitud }
    });
  }

  verHistorialEstadosGasto(gasto: Rendicion): void {
    const solicitud = this.todasSolicitudes().find(s => s.id === gasto.solicitudId);
    if (!solicitud) {
      this.snackBar.open('No se encontro la solicitud relacionada al gasto', 'Cerrar', { duration: 2500 });
      return;
    }
    this.verHistorialEstadosSolicitud(solicitud);
  }

  cambiarFiltroSolicitudes(filtro: FiltroEstado): void {
    this.filtroSolicitudes.set(filtro);
  }

  cambiarFiltroGastos(filtro: FiltroEstado): void {
    this.filtroGastos.set(filtro);
  }

  toggleResumenDashboard(): void {
    this.mostrarResumenDashboard.update(v => !v);
  }

  irASolicitudesUrgentes(): void {
    this.tabActiva.set(0);
    this.filtroSolicitudes.set('PENDIENTE');
    this.versionFiltroSolicitudes.update(v => v + 1);
    this.mostrarResumenDashboard.set(true);
  }

  irAGastosPendientes(): void {
    this.tabActiva.set(1);
    this.filtroGastos.set('PENDIENTE');
    this.versionFiltroGastos.update(v => v + 1);
    this.mostrarResumenDashboard.set(true);
  }

  toggleFiltrosAvanzados(): void {
    this.filtrosAvanzadosExpandidos.update(v => !v);
  }

  toggleSolicitudExpandida(id: string): void {
    const next = new Set(this.solicitudesExpandidas());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.solicitudesExpandidas.set(next);
  }

  isSolicitudExpandida(id: string): boolean {
    return this.solicitudesExpandidas().has(id);
  }

  toggleGastoExpandido(id: string): void {
    const next = new Set(this.gastosExpandidos());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.gastosExpandidos.set(next);
  }

  isGastoExpandido(id: string): boolean {
    return this.gastosExpandidos().has(id);
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'PENDIENTE_N1': 'Pendiente',
      'PENDIENTE_N2': 'Pendiente',
      'APROBADO_N1': 'Aprobado',
      'APROBADO_N2': 'Aprobado',
      'RECHAZADO_N1': 'Rechazado',
      'RECHAZADO_N2': 'Rechazado',
      'CANCELADO': 'Cancelado',
      'COMPLETADO': 'Completado'
    };
    return labels[estado] || estado;
  }

  getUbicacionSolicitud(solicitud: Solicitud): string {
    const region = (solicitud.departamento || solicitud.provincia || solicitud.destino || '').trim();
    const pais = this.getPaisSolicitud(solicitud.destino);
    return `${region} - ${pais}`;
  }

  getAreaSolicitante(solicitud: Solicitud): string {
    return solicitud.departamento || solicitud.centroCosto || 'No especificada';
  }

  getUbicacionGasto(gasto: Rendicion): string {
    const destino = (gasto.destino || '').trim();
    if (!destino) {
      return 'Destino no informado';
    }

    if (destino.includes(',')) {
      const parts = destino.split(',').map(x => x.trim()).filter(Boolean);
      if (parts.length > 1) {
        const region = parts.slice(0, -1).join(', ');
        const pais = parts[parts.length - 1];
        return `${region} - ${pais}`;
      }
    }

    return `${destino} - Peru`;
  }

  getColaboradorNombre(gasto: Rendicion): string {
    const solicitud = this.todasSolicitudes().find(s => s.id === gasto.solicitudId);
    return solicitud?.empleadoNombre || 'Colaborador no identificado';
  }

  private getPaisSolicitud(destino: string): string {
    const value = (destino || '').trim();
    if (value.includes(',')) {
      const parts = value.split(',').map(x => x.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts[parts.length - 1];
      }
    }
    return 'Peru';
  }

  getEstadoClass(estado: string): string {
    return estado.toLowerCase();
  }

  getCategoriaIcon(categoria: string): string {
    const icons: Record<string, string> = {
      'ALIMENTACION': 'restaurant',
      'TRANSPORTE': 'directions_car',
      'HOSPEDAJE': 'hotel',
      'OTROS': 'receipt'
    };
    return icons[categoria] || 'receipt';
  }

  getCategoriaLabel(categoria: string): string {
    const labels: Record<string, string> = {
      ALIMENTACION: 'Alimentación',
      TRANSPORTE: 'Transporte',
      HOSPEDAJE: 'Hospedaje',
      OTROS: 'Otros'
    };
    return labels[categoria] || categoria;
  }

  formatMontoRendicion(gasto: Rendicion): string {
    const moneda = gasto.moneda === 'USD' ? 'US$' : 'S/';
    return `${moneda} ${gasto.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatMontoMoneda(monto: number, moneda: 'PEN' | 'USD'): string {
    const simbolo = moneda === 'USD' ? 'US$' : 'S/';
    return `${simbolo} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getInitials(nombre: string): string {
    const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '??';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getSolicitudPrioridad(solicitud: Solicitud): 'alta' | 'media' | 'normal' {
    const dias = this.diffDias(new Date(), new Date(solicitud.fechaSalida));
    if (dias <= 2) return 'alta';
    if (dias <= 6) return 'media';
    return 'normal';
  }

  getSolicitudPrioridadLabel(solicitud: Solicitud): string {
    const prioridad = this.getSolicitudPrioridad(solicitud);
    if (prioridad === 'alta') return 'Urgente';
    if (prioridad === 'media') return 'Proxima';
    return 'Planificada';
  }

  getSolicitudPrioridadIcon(solicitud: Solicitud): string {
    const prioridad = this.getSolicitudPrioridad(solicitud);
    if (prioridad === 'alta') return 'error';
    if (prioridad === 'media') return 'schedule';
    return 'event_available';
  }

  getGastoPrioridad(gasto: Rendicion): 'alta' | 'media' | 'normal' {
    const diasDesdeRegistro = this.diffDias(new Date(gasto.fecha), new Date());
    if (diasDesdeRegistro >= 10) return 'alta';
    if (diasDesdeRegistro >= 5) return 'media';
    return 'normal';
  }

  getGastoPrioridadLabel(gasto: Rendicion): string {
    const prioridad = this.getGastoPrioridad(gasto);
    if (prioridad === 'alta') return 'Atrasado';
    if (prioridad === 'media') return 'En seguimiento';
    return 'Reciente';
  }

  getGastoPrioridadIcon(gasto: Rendicion): string {
    const prioridad = this.getGastoPrioridad(gasto);
    if (prioridad === 'alta') return 'warning';
    if (prioridad === 'media') return 'hourglass_top';
    return 'bolt';
  }

  // ========== MÓDULO 4: Métodos de Selección Múltiple ==========

  toggleSolicitud(id: string, checked: boolean): void {
    const seleccionadas = new Set(this.solicitudesSeleccionadas());
    if (checked) {
      seleccionadas.add(id);
    } else {
      seleccionadas.delete(id);
    }
    this.solicitudesSeleccionadas.set(seleccionadas);
  }

  toggleTodasSolicitudes(checked: boolean): void {
    if (checked) {
      const ids = this.solicitudesFiltradas().map(s => s.id);
      this.solicitudesSeleccionadas.set(new Set(ids));
    } else {
      this.solicitudesSeleccionadas.set(new Set());
    }
  }

  toggleGasto(id: string, checked: boolean): void {
    const seleccionados = new Set(this.gastosSeleccionados());
    if (checked) {
      seleccionados.add(id);
    } else {
      seleccionados.delete(id);
    }
    this.gastosSeleccionados.set(seleccionados);
  }

  toggleTodosGastos(checked: boolean): void {
    if (checked) {
      const ids = this.gastosFiltrados().map(g => g.id);
      this.gastosSeleccionados.set(new Set(ids));
    } else {
      this.gastosSeleccionados.set(new Set());
    }
  }

  // ========== MÓDULO 4: Aprobación/Rechazo Masivo ==========

  aprobarSolicitudesSeleccionadas(): void {
    const ids = Array.from(this.solicitudesSeleccionadas());
    const solicitudes = this.todasSolicitudes().filter(s => ids.includes(s.id));

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Solicitudes',
        message: `¿Desea aprobar ${ids.length} solicitud(es) seleccionada(s)?`,
        confirmText: 'Aprobar Todas',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        let aprobadas = 0;
        let errores = 0;

        solicitudes.forEach((solicitud, index) => {
          const nuevoEstado = solicitud.estado === EstadoSolicitud.PENDIENTE_N1 
            ? EstadoSolicitud.APROBADO_N1 
            : EstadoSolicitud.APROBADO_N2;

          this.solicitudService.updateSolicitud(solicitud.id, { estado: nuevoEstado }).subscribe({
            next: () => {
              aprobadas++;
              if (index === solicitudes.length - 1) {
                this.finalizarAprobacionMasiva(aprobadas, errores, 'aprobadas');
              }
            },
            error: () => {
              errores++;
              if (index === solicitudes.length - 1) {
                this.finalizarAprobacionMasiva(aprobadas, errores, 'aprobadas');
              }
            }
          });
        });
      }
    });
  }

  rechazarSolicitudesSeleccionadas(): void {
    const ids = Array.from(this.solicitudesSeleccionadas());
    const solicitudes = this.todasSolicitudes().filter(s => ids.includes(s.id));

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Solicitudes',
        message: `¿Desea rechazar ${ids.length} solicitud(es) seleccionada(s)?`,
        confirmText: 'Rechazar Todas',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        let rechazadas = 0;
        let errores = 0;

        solicitudes.forEach((solicitud, index) => {
          const nuevoEstado = solicitud.estado === EstadoSolicitud.PENDIENTE_N1 
            ? EstadoSolicitud.RECHAZADO_N1
            : EstadoSolicitud.RECHAZADO_N2;
          
          this.solicitudService.updateSolicitud(solicitud.id, { estado: nuevoEstado }).subscribe({
            next: () => {
              rechazadas++;
              if (index === solicitudes.length - 1) {
                this.finalizarAprobacionMasiva(rechazadas, errores, 'rechazadas');
              }
            },
            error: () => {
              errores++;
              if (index === solicitudes.length - 1) {
                this.finalizarAprobacionMasiva(rechazadas, errores, 'rechazadas');
              }
            }
          });
        });
      }
    });
  }

  aprobarGastosSeleccionados(): void {
    const ids = Array.from(this.gastosSeleccionados());
    const gastos = this.todosGastos().filter(g => ids.includes(g.id));

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Gastos',
        message: `¿Desea aprobar ${ids.length} gasto(s) seleccionado(s)?`,
        confirmText: 'Aprobar Todos',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        let aprobados = 0;
        let errores = 0;

        gastos.forEach((gasto, index) => {
          this.rendicionService.update(gasto.id, { estado: EstadoRendicion.APROBADO }).subscribe({
            next: () => {
              aprobados++;
              if (index === gastos.length - 1) {
                this.finalizarAprobacionMasivaGastos(aprobados, errores, 'aprobados');
              }
            },
            error: () => {
              errores++;
              if (index === gastos.length - 1) {
                this.finalizarAprobacionMasivaGastos(aprobados, errores, 'aprobados');
              }
            }
          });
        });
      }
    });
  }

  rechazarGastosSeleccionados(): void {
    const ids = Array.from(this.gastosSeleccionados());
    const gastos = this.todosGastos().filter(g => ids.includes(g.id));

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Gastos',
        message: `¿Desea rechazar ${ids.length} gasto(s) seleccionado(s)?`,
        confirmText: 'Rechazar Todos',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        let rechazados = 0;
        let errores = 0;

        gastos.forEach((gasto, index) => {
          this.rendicionService.update(gasto.id, { estado: EstadoRendicion.RECHAZADO }).subscribe({
            next: () => {
              rechazados++;
              if (index === gastos.length - 1) {
                this.finalizarAprobacionMasivaGastos(rechazados, errores, 'rechazados');
              }
            },
            error: () => {
              errores++;
              if (index === gastos.length - 1) {
                this.finalizarAprobacionMasivaGastos(rechazados, errores, 'rechazados');
              }
            }
          });
        });
      }
    });
  }

  private finalizarAprobacionMasiva(exitosas: number, errores: number, accion: string): void {
    this.cargarSolicitudes();
    this.solicitudesSeleccionadas.set(new Set());

    if (errores === 0) {
      this.snackBar.open(`✓ ${exitosas} solicitud(es) ${accion} correctamente`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open(`${exitosas} ${accion}, ${errores} con errores`, 'Cerrar', { duration: 4000 });
    }
  }

  private finalizarAprobacionMasivaGastos(exitosos: number, errores: number, accion: string): void {
    this.cargarGastos();
    this.gastosSeleccionados.set(new Set());

    if (errores === 0) {
      this.snackBar.open(`✓ ${exitosos} gasto(s) ${accion} correctamente`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open(`${exitosos} ${accion}, ${errores} con errores`, 'Cerrar', { duration: 4000 });
    }
  }

  // ========== MÓDULO 4: Filtros Avanzados ==========

  aplicarFiltrosAvanzadosSolicitudes(): void {
    this.versionFiltroSolicitudes.update(v => v + 1);
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltrosAvanzadosSolicitudes(): void {
    this.filtrosAvanzadosSolicitudesForm.reset({
      empleado: [],
      montoMin: null,
      montoMax: null,
      destino: '',
      fechaInicio: null,
      fechaFin: null
    });
    this.versionFiltroSolicitudes.update(v => v + 1);
    this.snackBar.open('Filtros limpiados', 'Cerrar', { duration: 2000 });
  }

  aplicarFiltrosAvanzadosGastos(): void {
    this.versionFiltroGastos.update(v => v + 1);
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltrosAvanzadosGastos(): void {
    this.filtrosAvanzadosGastosForm.reset({
      categoria: [],
      montoMin: null,
      montoMax: null,
      concepto: '',
      fechaInicio: null,
      fechaFin: null
    });
    this.versionFiltroGastos.update(v => v + 1);
    this.snackBar.open('Filtros limpiados', 'Cerrar', { duration: 2000 });
  }

  private inicioDeDia(valor: Date | string): number {
    const fecha = new Date(valor);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime();
  }

  private finDeDia(valor: Date | string): number {
    const fecha = new Date(valor);
    fecha.setHours(23, 59, 59, 999);
    return fecha.getTime();
  }

  private diffDias(inicio: Date, fin: Date): number {
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.ceil((this.inicioDeDia(fin) - this.inicioDeDia(inicio)) / msPorDia);
  }

  // ===== MASTER-DETAIL: Computed =====
  selectedSolicitud = computed(() => {
    const id = this.selectedSolicitudId();
    return id ? this.todasSolicitudes().find(s => s.id === id) ?? null : null;
  });

  selectedGasto = computed(() => {
    const id = this.selectedGastoId();
    return id ? this.todosGastos().find(g => g.id === id) ?? null : null;
  });

  // ===== MASTER-DETAIL: Selection methods =====
  selectSolicitud(id: string): void {
    this.selectedSolicitudId.set(id);
    this.seccionDatosGeneralesExpanded.set(true);
    this.seccionViaticosExpanded.set(true);
  }

  selectGasto(id: string): void {
    this.selectedGastoId.set(id);
    this.seccionDatosGeneralesExpanded.set(true);
    this.seccionViaticosExpanded.set(true);
  }

  onTabChange(index: number): void {
    this.tabActiva.set(index);
    this.selectedSolicitudId.set(null);
    this.selectedGastoId.set(null);
  }

  getLabelFiltroSolicitudes(): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Pendientes', 'APROBADO': 'Aprobadas',
      'RECHAZADO': 'Rechazadas', 'TODOS': 'Todos'
    };
    return labels[this.filtroSolicitudes()] ?? 'Pendientes';
  }

  getLabelFiltroGastos(): string {
    const labels: Record<string, string> = {
      'PENDIENTE': 'Pendientes', 'APROBADO': 'Aprobados',
      'RECHAZADO': 'Rechazados', 'TODOS': 'Todos'
    };
    return labels[this.filtroGastos()] ?? 'Pendientes';
  }

  // ===== MASTER-DETAIL: Section toggles =====
  toggleSeccionDatosGenerales(): void {
    this.seccionDatosGeneralesExpanded.update(v => !v);
  }

  toggleSeccionViaticos(): void {
    this.seccionViaticosExpanded.update(v => !v);
  }

  toggleSeccionInfoContable(): void {
    this.seccionInfoContableExpanded.update(v => !v);
  }

  toggleSeccionJustificacion(): void {
    this.seccionJustificacionExpanded.update(v => !v);
  }

  // ===== MASTER-DETAIL: Viaticos helpers =====
  getViaticoCategoriaKey(concepto: string): string {
    const map: Record<string, string> = {
      'Alojamiento': 'HOSPEDAJE', 'Alimentación': 'ALIMENTACION',
      'Transporte': 'TRANSPORTE', 'Otros Gastos': 'OTROS'
    };
    return map[concepto] ?? 'OTROS';
  }

  getMontoRendidoNum(solicitud: Solicitud | null | undefined, concepto: string): number {
    if (!solicitud) return 0;
    const categoria = this.getViaticoCategoriaKey(concepto);
    return this.todosGastos()
      .filter(g => g.solicitudId === solicitud.id && g.categoria === categoria)
      .reduce((sum, g) => sum + g.monto, 0);
  }

  getMontoRendidoCategoria(solicitud: Solicitud | null | undefined, concepto: string): string {
    return this.getMontoRendidoNum(solicitud, concepto).toFixed(2);
  }

  getExceso(solicitud: Solicitud | null | undefined, viatico: { concepto: string; monto: number }): number {
    if (!solicitud) return 0;
    return this.getMontoRendidoNum(solicitud, viatico.concepto) - viatico.monto;
  }

  getDocumentosViatico(solicitudId: string, concepto: string): Rendicion[] {
    const categoria = this.getViaticoCategoriaKey(concepto);
    return this.todosGastos().filter(g => g.solicitudId === solicitudId && g.categoria === categoria);
  }

  calcMontoTotalComprobantes(solicitudId: string, concepto: string): string {
    const docs = this.getDocumentosViatico(solicitudId, concepto);
    const total = docs.reduce((sum, g) => sum + g.monto, 0);
    return `${total.toFixed(2)} ${docs[0]?.moneda ?? 'PEN'}`;
  }

  verDocumentosViatico(solicitud: Solicitud | null | undefined, viatico: { concepto: string }): void {
    if (!solicitud) return;
    this.comprobantesModal.set({ solicitudId: solicitud.id, concepto: viatico.concepto });
  }

  cerrarComprobantesModal(): void {
    this.comprobantesModal.set(null);
  }

  verDocumentoDetalle(rendicion: Rendicion): void {
    this.documentoDetalleModal.set(rendicion);
  }

  cerrarDocumentoDetalleModal(): void {
    this.documentoDetalleModal.set(null);
  }

  calcIGV(monto: number): string {
    return (monto * 18 / 118).toFixed(2);
  }

  getOrdenInterna(rendicion: Rendicion): string {
    return rendicion.id.replace(/\D/g, '').padStart(3, '0');
  }
}
