import { Component, OnInit, AfterViewInit, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { VoiceInputComponent } from '../../../../shared/components/voice-input/voice-input.component';
import { CameraDialogComponent } from '../../../../shared/components/camera-dialog/camera-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RendicionService } from '../../../../core/services/rendicion.service';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { DocumentAIService } from '../../../../core/services/document-ai.service';
import { CategoriaGasto, EstadoRendicion, Solicitud, DocumentAIResult, Rendicion } from '../../../../models';

// ============ MAIN COMPONENT ============
@Component({
  selector: 'app-formulario-rendicion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatStepperModule,
    MatProgressBarModule,
    MatCheckboxModule,
    VoiceInputComponent
  ],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="rendicion-wizard-container">
      <!-- Header -->
      <div class="wizard-header">
        <button mat-icon-button (click)="volver()" class="btn-back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>
            <mat-icon>{{ editando() ? 'edit_note' : 'receipt' }}</mat-icon>
            {{ editando() ? 'Editar Gasto Registrado' : 'Registrar Comprobante de Gasto' }}
          </h1>
          <p class="subtitle">{{ (solicitudSeleccionada()?.idViaje || solicitudSeleccionada()?.codigo || 'Viaje') + ' - ' + (solicitudSeleccionada()?.destino || 'Selecciona una solicitud') }}</p>
        </div>
      </div>

      <!-- ============ MODO EDICIÓN: PANTALLA PLANA (sin wizard) ============ -->
      @if (editando()) {
        <div class="edit-flat-container">

          <!-- Panel lateral izquierdo: tabla viáticos + gastos registrados -->
          @if (solicitudSeleccionada()) {
            <div class="edit-side-panel">

              <!-- Mini resumen anticipo/rendido/saldo -->
              <div class="resumen-mini-cards">
                <div class="mini-card">
                  <span>Anticipo</span>
                  <strong>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getPresupuestoTotal()) }}</strong>
                </div>
                <div class="mini-card">
                  <span>Rendido</span>
                  <strong>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getTotalRendido()) }}</strong>
                </div>
                <div class="mini-card">
                  <span>Saldo</span>
                  <strong [class.negativo]="getSaldo() < 0">{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getSaldo()) }}</strong>
                </div>
              </div>

              <!-- Tabla de viáticos (clickable para filtrar) -->
              <div class="edit-side-section">
                <div class="edit-side-title">
                  <mat-icon>table_view</mat-icon>
                  <span>Viáticos del viaje</span>
                  <span class="edit-side-hint">Haz clic para filtrar</span>
                </div>
                <div class="viaticos-table-wrapper">
                  <table class="viaticos-table">
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th>Anticipo</th>
                        <th>Rendido</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (concepto of getConceptosResumen(); track concepto.nombre) {
                        <tr class="concepto-row" [class.concepto-activo]="categoriaFiltro() === concepto.nombre" (click)="filtrarPorCategoria(concepto.nombre)">
                          <td><strong>{{ concepto.nombre }}</strong></td>
                          <td>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(concepto.presupuestado) }}</td>
                          <td>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(concepto.rendido) }}</td>
                          <td>{{ concepto.porcentaje }}%</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Lista de gastos registrados con filtros -->
              <div class="edit-side-section">
                <div class="gastos-lista-header">
                  <div class="edit-side-title" style="margin-bottom:0">
                    <mat-icon>receipt_long</mat-icon>
                    <span>Gastos registrados</span>
                  </div>
                  @if (categoriaFiltro()) {
                    <button mat-stroked-button class="btn-limpiar-filtro" (click)="filtrarPorCategoria(null)">
                      <mat-icon>filter_alt_off</mat-icon>
                      Mostrar todos
                    </button>
                  }
                </div>

                @if (gastosRegistradosSolicitud().length === 0) {
                  <p class="sin-gastos">Aún no hay gastos registrados para este viaje.</p>
                } @else {
                  <div class="gastos-registrados-lista">
                    @for (bloque of getBloquesGastosEdicionFiltrados(); track bloque.categoria) {
                      <div class="gasto-bloque" [class.exceso]="bloque.exceso">
                        <div class="gasto-bloque-head">
                          <strong>{{ bloque.titulo }}</strong>
                          <span [class.exceso-texto]="bloque.exceso">
                            {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(bloque.rendido) }} / {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(bloque.tope) }}
                          </span>
                        </div>
                        <div class="gasto-bloque-barra">
                          <span [style.width.%]="bloque.porcentaje"></span>
                        </div>
                        @for (gasto of bloque.gastos; track gasto.id) {
                          <div class="gasto-item visual">
                            <div class="gasto-thumb" [class.has-image]="!!gasto.comprobante && isImageComprobante(gasto.comprobante)">
                              @if (gasto.comprobante && isImageComprobante(gasto.comprobante)) {
                                <img [src]="gasto.comprobante" alt="Comprobante" />
                              } @else {
                                <mat-icon>{{ gasto.comprobante ? 'picture_as_pdf' : 'receipt_long' }}</mat-icon>
                              }
                            </div>
                            <div class="gasto-main">
                              <div class="gasto-item-top">
                                <strong>{{ gasto.proveedor || gasto.concepto || 'Gasto registrado' }}</strong>
                                <span class="estado">{{ getEstadoLabel(gasto.estado) }}</span>
                              </div>
                              <div class="gasto-item-bottom">
                                <span>{{ formatFecha(gasto.fecha) }}</span>
                                <strong>{{ getCurrencySymbol(gasto.moneda || 'PEN') }} {{ formatMonto(gasto.monto) }}</strong>
                              </div>
                              <div class="gasto-item-actions-inline">
                                <button mat-stroked-button type="button" (click)="abrirComprobanteGasto(gasto)" [disabled]="!gasto.comprobante">
                                  <mat-icon>visibility</mat-icon>
                                  Ver
                                </button>
                                <button mat-stroked-button type="button" (click)="editarGastoRegistrado(gasto)" [disabled]="gasto.id === rendicionEditandoId()">
                                  <mat-icon>edit</mat-icon>
                                  Editar
                                </button>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Comprobante en el panel lateral -->
              @if (comprobantePreview()) {
                <div class="edit-comprobante-card">
                  <div class="edit-comprobante-header">
                    <mat-icon>receipt</mat-icon>
                    <span>Comprobante adjunto</span>
                  </div>
                  @if (isImageFile() || (comprobantePreview()!.startsWith('data:image'))) {
                    <img [src]="comprobantePreview()!" alt="Comprobante" class="edit-comprobante-img" (click)="abrirVistaPreviaImagen()" />
                  } @else {
                    <div class="edit-comprobante-pdf">
                      <mat-icon>picture_as_pdf</mat-icon>
                      <span>Documento PDF adjunto</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Panel derecho: Formulario plano -->
          <div class="edit-form-card">
            <form [formGroup]="rendicionForm" class="datos-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Categoría del Gasto</mat-label>
                <mat-select formControlName="categoria" required>
                  <mat-option value="ALIMENTACION">
                    <mat-icon>restaurant</mat-icon> Alimentación
                  </mat-option>
                  <mat-option value="TRANSPORTE">
                    <mat-icon>directions_car</mat-icon> Transporte
                  </mat-option>
                  <mat-option value="HOSPEDAJE">
                    <mat-icon>hotel</mat-icon> Hospedaje
                  </mat-option>
                  <mat-option value="OTROS">
                    <mat-icon>more_horiz</mat-icon> Otros
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix>category</mat-icon>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha</mat-label>
                  <input matInput formControlName="fecha" [matDatepicker]="pickerEdit" required>
                  <mat-datepicker-toggle matSuffix [for]="pickerEdit"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEdit></mat-datepicker>
                  <mat-icon matPrefix>event</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Monto pagado</mat-label>
                  <input matInput type="number" formControlName="monto" required step="0.01" min="0.01">
                  <span matPrefix>{{ getCurrencySymbol(getMonedaActual()) }}&nbsp;</span>
                  <mat-icon matPrefix>payments</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Moneda</mat-label>
                <mat-select formControlName="moneda" (selectionChange)="verificarConversionMoneda()">
                  <mat-option value="PEN">Soles (PEN)</mat-option>
                  <mat-option value="USD">Dólares (USD)</mat-option>
                  <mat-option value="EUR">Euros (EUR)</mat-option>
                </mat-select>
                <mat-icon matPrefix>currency_exchange</mat-icon>
              </mat-form-field>

              @if (requiereConversion()) {
                <div class="conversion-moneda-section">
                  <div class="conversion-header">
                    <mat-icon>swap_horiz</mat-icon>
                    <span>Conversión de moneda ({{ rendicionForm.get('moneda')?.value }} → {{ getMonedaSolicitud() }})</span>
                  </div>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de Cambio</mat-label>
                      <input matInput type="number" formControlName="tipoCambio" step="0.01" min="0.01">
                      <mat-icon matPrefix>trending_up</mat-icon>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Importe Calculado ({{ getMonedaSolicitud() }})</mat-label>
                      <input matInput type="number" formControlName="importeCalculado" readonly>
                      <span matPrefix>{{ getCurrencySymbol(getMonedaSolicitud()) }}&nbsp;</span>
                      <mat-icon matPrefix>calculate</mat-icon>
                    </mat-form-field>
                  </div>
                </div>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Proveedor</mat-label>
                <input matInput formControlName="proveedor" placeholder="Nombre del establecimiento">
                <mat-icon matPrefix>store</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width concepto-field">
                <mat-label>Justificación</mat-label>
                <textarea matInput formControlName="justificacion" rows="3" maxlength="200" required></textarea>
                <mat-icon matPrefix>description</mat-icon>
                <mat-hint align="end">{{ rendicionForm.get('justificacion')?.value?.length || 0 }}/200</mat-hint>
              </mat-form-field>

              <!-- Panel expandible: Otros datos del documento -->
              <div class="campos-extendidos-toggle" (click)="toggleCamposExtendidos()">
                <mat-icon>{{ mostrarCamposExtendidos() ? 'expand_less' : 'expand_more' }}</mat-icon>
                <span>Otros datos del documento</span>
                <span class="ai-badge">Document AI</span>
              </div>

              @if (mostrarCamposExtendidos()) {
                <div class="campos-extendidos-panel" @expandCollapse>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de Documento</mat-label>
                      <mat-select formControlName="tipoDocumento">
                        <mat-option value="FACTURA">Factura</mat-option>
                        <mat-option value="BOLETA">Boleta</mat-option>
                        <mat-option value="TICKET">Ticket</mat-option>
                        <mat-option value="RECIBO">Recibo por Honorarios</mat-option>
                        <mat-option value="NOTA_CREDITO">Nota de Crédito</mat-option>
                      </mat-select>
                      <mat-icon matPrefix>receipt_long</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>N° Documento</mat-label>
                      <input matInput formControlName="nroDocumento" placeholder="F001-00000001">
                      <mat-icon matPrefix>tag</mat-icon>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>RUC</mat-label>
                    <input matInput formControlName="ruc" placeholder="20512345678" maxlength="11">
                    <mat-icon matPrefix>badge</mat-icon>
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>País</mat-label>
                      <input matInput formControlName="pais" placeholder="Perú">
                      <mat-icon matPrefix>public</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Ciudad</mat-label>
                      <input matInput formControlName="ciudad" placeholder="Lima">
                      <mat-icon matPrefix>location_city</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="form-row igv-row">
                    <mat-checkbox formControlName="afectoIgv" color="primary">Afecto IGV (18%)</mat-checkbox>
                    <mat-form-field appearance="outline" class="campo-igv">
                      <mat-label>IGV</mat-label>
                      <input matInput type="number" formControlName="igv" step="0.01">
                      <mat-icon matPrefix>percent</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Otros Servicios</mat-label>
                      <input matInput type="number" formControlName="otrosServicios" step="0.01">
                      <mat-icon matPrefix>miscellaneous_services</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Orden Interna</mat-label>
                      <input matInput formControlName="ordenInterna" placeholder="OI-2025-001">
                      <mat-icon matPrefix>inventory_2</mat-icon>
                    </mat-form-field>
                  </div>
                </div>
              }
            </form>

            <!-- Acciones de edición -->
            <div class="edit-actions">
              <button mat-stroked-button (click)="cancelarEdicion()">
                <mat-icon>close</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button color="primary" (click)="guardarEdicion()" [disabled]="rendicionForm.invalid || guardando()">
                @if (guardando()) {
                  <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                } @else {
                  <mat-icon>save</mat-icon>
                }
                Actualizar Gasto
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ============ MODO CREACIÓN: WIZARD 3 PASOS ============ -->
      @if (!editando()) {
      <div class="ux-progress-card">
        <div class="ux-progress-top">
          <span class="step-pill">Paso {{ currentStep() + 1 }} de 3</span>
          <span class="step-title">{{ getStepTitle() }}</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="stepProgress()"></mat-progress-bar>
        <p class="step-hint">{{ getStepHint() }}</p>
      </div>

      <!-- Stepper de 3 Pasos -->
      <mat-stepper [linear]="true" #stepper class="wizard-stepper" (selectionChange)="onStepChange($event.selectedIndex)">
        
        <!-- PASO 1: Captura y extracción -->
        <mat-step label="Captura" [completed]="comprobanteFile() !== null || !!comprobantePreview() || editando()">
          <div class="step-content">
            <div class="step-icon-header paso-1">
              <mat-icon>photo_camera</mat-icon>
              <h2>Paso 1: Captura y extracción</h2>
              <p>Toma o sube el comprobante y confirma la extracción de datos</p>
            </div>

            <!-- Inputs ocultos -->
            <input #cameraInput type="file" accept="image/*" capture="environment" (change)="onFileSelected($event)" style="display: none" />
            <input #fileInput type="file" accept="image/*,application/pdf" (change)="onFileSelected($event)" style="display: none" />
            
            @if (!comprobanteFile() && !comprobantePreview()) {
              <div class="capture-options">
                <button mat-raised-button class="capture-btn photo-btn" (click)="abrirCamaraWeb()">
                  <mat-icon>photo_camera</mat-icon>
                  <span>Tomar Foto</span>
                  <small>Usar cámara</small>
                </button>
                <button mat-raised-button class="capture-btn upload-btn" (click)="fileInput.click()">
                  <mat-icon>upload_file</mat-icon>
                  <span>Subir Archivo</span>
                  <small>JPG, PNG o PDF</small>
                </button>
              </div>

              <div class="capture-tips">
                <mat-icon>tips_and_updates</mat-icon>
                <p>Tip: toma la foto con buena luz y centrando todo el comprobante para extraer datos mas rapido.</p>
              </div>
            } @else {
              <div class="file-captured">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <div class="file-info">
                  <strong>{{ comprobanteFile()?.name || (isPdfFile() ? 'comprobante.pdf' : 'comprobante.jpg') }}</strong>
                  <span>{{ getFileSize() }}</span>
                </div>
                <button mat-icon-button color="warn" (click)="removeComprobante()">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <div class="capture-edit-actions">
                <button mat-stroked-button type="button" (click)="fileInput.click()">
                  <mat-icon>edit</mat-icon>
                  Editar archivo
                </button>
              </div>

              <div class="capture-preview-card">
                <h4>Vista previa del archivo</h4>
                @if (isImageFile() && comprobantePreview()) {
                  <img [src]="comprobantePreview()!" alt="Vista previa del comprobante" class="capture-preview-image" />
                  <button mat-stroked-button type="button" class="btn-open-preview" (click)="abrirVistaPreviaImagen()">
                    <mat-icon>open_in_new</mat-icon>
                    Ver imagen completa
                  </button>
                } @else if (isPdfFile()) {
                  <div class="capture-preview-pdf">
                    <mat-icon>picture_as_pdf</mat-icon>
                    <div>
                      <strong>{{ comprobanteFile()?.name }}</strong>
                      <span>Documento listo para continuar</span>
                    </div>
                    <button mat-stroked-button type="button" (click)="abrirComprobanteDocumento()">
                      <mat-icon>visibility</mat-icon>
                      Ver PDF
                    </button>
                  </div>
                }
              </div>
            }

            <div class="step-actions">
              <button mat-button (click)="volver()">Cancelar</button>
              <button mat-raised-button color="primary" [disabled]="!comprobanteFile() && !editando()" (click)="confirmarYExtraerPaso1(stepper)">
                Confirmar y extraer datos
                <mat-icon>auto_fix_high</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- PASO 2: Campos autocompletados (Document AI) -->
        <mat-step label="Datos" [completed]="rendicionForm.valid">
          <div class="step-content">
            <div class="step-icon-header paso-3">
              <mat-icon>auto_fix_high</mat-icon>
              <h2>Paso 2: Campos autocompletados</h2>
              <p *ngIf="!extrayendoDatos()">Los datos han sido extraídos del comprobante</p>
              <p *ngIf="extrayendoDatos()">Extrayendo información con Document AI...</p>
            </div>

            @if (extrayendoDatos()) {
              <div class="extracting-loader">
                <div class="airplane-animation">
                  <div class="flight-path">
                    <div class="airplane-trail"></div>
                    <div class="airplane">
                      <mat-icon class="airplane-icon">flight</mat-icon>
                    </div>
                  </div>
                  <div class="clouds">
                    <span class="cloud c1"></span>
                    <span class="cloud c2"></span>
                    <span class="cloud c3"></span>
                  </div>
                </div>
                <h3 class="extraccion-titulo">Extrayendo datos del comprobante</h3>
                <p>Document AI está analizando tu documento...</p>
                <mat-progress-bar mode="indeterminate" class="flight-progress"></mat-progress-bar>
              </div>
            } @else {
              @if (editando() && solicitudSeleccionada()) {
                <div class="viaticos-edit-block">
                  <div class="block-header">
                    <mat-icon>table_view</mat-icon>
                    <h3>Tabla de viáticos del viaje</h3>
                  </div>

                  <div class="resumen-mini-cards">
                    <div class="mini-card">
                      <span>Anticipo</span>
                      <strong>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getPresupuestoTotal()) }}</strong>
                    </div>
                    <div class="mini-card">
                      <span>Rendido</span>
                      <strong>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getTotalRendido()) }}</strong>
                    </div>
                    <div class="mini-card">
                      <span>Saldo</span>
                      <strong [class.negativo]="getSaldo() < 0">{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getSaldo()) }}</strong>
                    </div>
                  </div>

                  <div class="viaticos-table-wrapper">
                    <table class="viaticos-table">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Anticipo</th>
                          <th>Rendido</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (concepto of getConceptosResumen(); track concepto.nombre) {
                          <tr class="concepto-row" [class.concepto-activo]="categoriaFiltro() === concepto.nombre" (click)="filtrarPorCategoria(concepto.nombre)">
                            <td><strong>{{ concepto.nombre }}</strong></td>
                            <td>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(concepto.presupuestado) }}</td>
                            <td>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(concepto.rendido) }}</td>
                            <td>{{ concepto.porcentaje }}%</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="gastos-registrados-lista">
                    <div class="gastos-lista-header">
                      <h4>Gastos registrados</h4>
                      @if (categoriaFiltro()) {
                        <button mat-stroked-button class="btn-limpiar-filtro" (click)="filtrarPorCategoria(null)">
                          <mat-icon>filter_alt_off</mat-icon>
                          Mostrar todos
                        </button>
                      }
                    </div>
                    @if (gastosRegistradosSolicitud().length === 0) {
                      <p class="sin-gastos">Aun no hay gastos registrados para este viaje.</p>
                    } @else {
                      @for (bloque of getBloquesGastosEdicionFiltrados(); track bloque.categoria) {
                        <div class="gasto-bloque" [class.exceso]="bloque.exceso">
                          <div class="gasto-bloque-head">
                            <strong>{{ bloque.titulo }}</strong>
                            <span [class.exceso-texto]="bloque.exceso">
                              {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(bloque.rendido) }} / {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(bloque.tope) }}
                            </span>
                          </div>
                          <div class="gasto-bloque-barra">
                            <span [style.width.%]="bloque.porcentaje"></span>
                          </div>

                          @for (gasto of bloque.gastos; track gasto.id) {
                            <div class="gasto-item visual">
                              <div class="gasto-thumb" [class.has-image]="!!gasto.comprobante && isImageComprobante(gasto.comprobante)">
                                @if (gasto.comprobante && isImageComprobante(gasto.comprobante)) {
                                  <img [src]="gasto.comprobante" alt="Comprobante de gasto" />
                                } @else {
                                  <mat-icon>{{ gasto.comprobante ? 'picture_as_pdf' : 'receipt_long' }}</mat-icon>
                                }
                              </div>
                              <div class="gasto-main">
                                <div class="gasto-item-top">
                                  <strong>{{ gasto.proveedor || gasto.concepto || 'Gasto registrado' }}</strong>
                                  <span class="estado">{{ getEstadoLabel(gasto.estado) }}</span>
                                </div>
                                <div class="gasto-item-bottom">
                                  <span>{{ formatFecha(gasto.fecha) }}</span>
                                  <strong>{{ getCurrencySymbol(gasto.moneda || 'PEN') }} {{ formatMonto(gasto.monto) }}</strong>
                                </div>
                                <div class="gasto-item-actions-inline">
                                  <button mat-stroked-button type="button" (click)="abrirComprobanteGasto(gasto)" [disabled]="!gasto.comprobante">
                                    <mat-icon>visibility</mat-icon>
                                    Ver
                                  </button>
                                  <button mat-stroked-button type="button" (click)="editarGastoRegistrado(gasto)" [disabled]="gasto.id === rendicionEditandoId()">
                                    <mat-icon>edit</mat-icon>
                                    Editar
                                  </button>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    }
                  </div>
                </div>
              }

              <form [formGroup]="rendicionForm" class="datos-form">

                @if (datosExtraidos(); as extraido) {
                  <div class="monto-ai-resumen">
                    <div class="monto-ai-item">
                      <span>Monto detectado</span>
                      <strong>{{ getCurrencySymbol(extraido.moneda || 'PEN') }} {{ formatMonto(extraido.monto || 0) }}</strong>
                    </div>
                    <div class="monto-ai-item destacado">
                      <span>Monto calculado</span>
                      <strong>{{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getMonto()) }}</strong>
                    </div>
                  </div>
                }

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Categoría del Gasto</mat-label>
                  <mat-select formControlName="categoria" required>
                    <mat-option value="ALIMENTACION">
                      <mat-icon>restaurant</mat-icon> Alimentación
                    </mat-option>
                    <mat-option value="TRANSPORTE">
                      <mat-icon>directions_car</mat-icon> Transporte
                    </mat-option>
                    <mat-option value="HOSPEDAJE">
                      <mat-icon>hotel</mat-icon> Hospedaje
                    </mat-option>
                    <mat-option value="OTROS">
                      <mat-icon>more_horiz</mat-icon> Otros
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix>category</mat-icon>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Fecha</mat-label>
                    <input matInput formControlName="fecha" [matDatepicker]="picker" required>
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-icon matPrefix>event</mat-icon>
                    <mat-hint>Formato: dia/mes/ano</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Monto pagado</mat-label>
                    <input matInput type="number" formControlName="monto" required step="0.01" min="0.01">
                    <span matPrefix>{{ getCurrencySymbol(getMonedaActual()) }}&nbsp;</span>
                    <mat-icon matPrefix>payments</mat-icon>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Moneda</mat-label>
                  <mat-select formControlName="moneda" (selectionChange)="verificarConversionMoneda()">
                    <mat-option value="PEN">Soles (PEN)</mat-option>
                    <mat-option value="USD">Dólares (USD)</mat-option>
                    <mat-option value="EUR">Euros (EUR)</mat-option>
                  </mat-select>
                  <mat-icon matPrefix>currency_exchange</mat-icon>
                </mat-form-field>

                <!-- Conversión de moneda cuando difiere de la solicitud -->
                @if (requiereConversion()) {
                  <div class="conversion-moneda-section">
                    <div class="conversion-header">
                      <mat-icon>swap_horiz</mat-icon>
                      <span>Conversión de moneda ({{ rendicionForm.get('moneda')?.value }} → {{ getMonedaSolicitud() }})</span>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Tipo de Cambio</mat-label>
                        <input matInput type="number" formControlName="tipoCambio" step="0.01" min="0.01">
                        <mat-icon matPrefix>trending_up</mat-icon>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Importe Calculado ({{ getMonedaSolicitud() }})</mat-label>
                        <input matInput type="number" formControlName="importeCalculado" readonly>
                        <span matPrefix>{{ getCurrencySymbol(getMonedaSolicitud()) }}&nbsp;</span>
                        <mat-icon matPrefix>calculate</mat-icon>
                      </mat-form-field>
                    </div>
                  </div>
                }

                <!-- Indicador de Estado de Presupuesto -->
                @if (solicitudSeleccionada() && rendicionForm.get('monto')?.value) {
                  <div class="presupuesto-indicator" [class]="'status-' + getEstadoPresupuesto().color">
                    <mat-icon>{{ getEstadoPresupuesto().icono }}</mat-icon>
                    <div class="indicator-content">
                      <span class="indicator-label">{{ getEstadoPresupuesto().texto }}</span>
                      <span class="indicator-detalle">
                        Rendido: {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getTotalRendido() + getMonto()) }} /
                        Anticipo: {{ getCurrencySymbol(getMonedaActual()) }} {{ formatMonto(getPresupuestoTotal()) }}
                      </span>
                    </div>
                  </div>
                }

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Proveedor</mat-label>
                  <input matInput formControlName="proveedor" placeholder="Nombre del establecimiento">
                  <mat-icon matPrefix>store</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width concepto-field">
                  <mat-label>Justificación</mat-label>
                  <textarea matInput formControlName="justificacion" rows="3" maxlength="200" required></textarea>
                  <mat-icon matPrefix>description</mat-icon>
                  <app-voice-input matSuffix (textCaptured)="onVoiceTextCaptured($event)"></app-voice-input>
                  <mat-hint align="end">{{ rendicionForm.get('justificacion')?.value?.length || 0 }}/200</mat-hint>
                </mat-form-field>

                <!-- Panel expandible: Otros datos del documento (detectados por Document AI) -->
                <div class="campos-extendidos-toggle" (click)="toggleCamposExtendidos()">
                  <mat-icon>{{ mostrarCamposExtendidos() ? 'expand_less' : 'expand_more' }}</mat-icon>
                  <span>Otros datos del documento</span>
                  <span class="ai-badge">Document AI</span>
                </div>

                @if (mostrarCamposExtendidos()) {
                  <div class="campos-extendidos-panel" @expandCollapse>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Tipo de Documento</mat-label>
                        <mat-select formControlName="tipoDocumento">
                          <mat-option value="FACTURA">Factura</mat-option>
                          <mat-option value="BOLETA">Boleta</mat-option>
                          <mat-option value="TICKET">Ticket</mat-option>
                          <mat-option value="RECIBO">Recibo por Honorarios</mat-option>
                          <mat-option value="NOTA_CREDITO">Nota de Crédito</mat-option>
                        </mat-select>
                        <mat-icon matPrefix>receipt_long</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>N° Documento</mat-label>
                        <input matInput formControlName="nroDocumento" placeholder="F001-00000001">
                        <mat-icon matPrefix>tag</mat-icon>
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>RUC</mat-label>
                      <input matInput formControlName="ruc" placeholder="20512345678" maxlength="11">
                      <mat-icon matPrefix>badge</mat-icon>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>País</mat-label>
                        <input matInput formControlName="pais" placeholder="Perú">
                        <mat-icon matPrefix>public</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Ciudad</mat-label>
                        <input matInput formControlName="ciudad" placeholder="Lima">
                        <mat-icon matPrefix>location_city</mat-icon>
                      </mat-form-field>
                    </div>

                    <div class="form-row igv-row">
                      <mat-checkbox formControlName="afectoIgv" color="primary">Afecto IGV (18%)</mat-checkbox>
                      <mat-form-field appearance="outline" class="campo-igv">
                        <mat-label>IGV</mat-label>
                        <input matInput type="number" formControlName="igv" step="0.01">
                        <mat-icon matPrefix>percent</mat-icon>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Otros Servicios</mat-label>
                        <input matInput type="number" formControlName="otrosServicios" step="0.01">
                        <mat-icon matPrefix>miscellaneous_services</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Orden Interna</mat-label>
                        <input matInput formControlName="ordenInterna" placeholder="OI-2025-001">
                        <mat-icon matPrefix>inventory_2</mat-icon>
                      </mat-form-field>
                    </div>
                  </div>
                }

              </form>
            }

            <div class="step-actions">
              <button mat-button (click)="stepper.previous()">Atrás</button>
              <button mat-raised-button color="primary" [disabled]="!rendicionForm.valid || extrayendoDatos()" (click)="irAConfirmacion(stepper)">
                Ir a confirmar
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
            
            @if (!rendicionForm.valid && rendicionForm.touched) {
              <div class="validation-alert">
                <mat-icon>error_outline</mat-icon>
                <span>Por favor completa todos los campos requeridos</span>
              </div>
            }
          </div>
        </mat-step>

        <!-- PASO 3: Confirmar y Continuar -->
        <mat-step label="Confirmar">
          <div class="step-content">
            @if (!guardando() && !gastoGuardado()) {
              <div class="step-icon-header paso-4">
                <mat-icon>done_all</mat-icon>
                <h2>Paso 3: Confirmar registro de gasto real</h2>
                <p>Revisa los datos del comprobante antes de guardar</p>
              </div>

              <div class="confirmacion-resumen">
                <div class="confirm-item">
                  <span class="label">Categoría:</span>
                  <strong>{{ getCategoriaLabel(rendicionForm.value.categoria) }}</strong>
                </div>
                <div class="confirm-item">
                  <span class="label">Monto:</span>
                  <strong class="monto-destacado">{{ getCurrencySymbol(rendicionForm.value.moneda || 'PEN') }} {{ rendicionForm.value.monto?.toFixed(2) }}</strong>
                </div>
                @if (requiereConversion()) {
                  <div class="confirm-item conversion-item">
                    <span class="label">Tipo de Cambio:</span>
                    <strong>{{ rendicionForm.get('tipoCambio')?.value }}</strong>
                  </div>
                  <div class="confirm-item conversion-item">
                    <span class="label">Importe en {{ getMonedaSolicitud() }}:</span>
                    <strong class="monto-destacado">{{ getCurrencySymbol(getMonedaSolicitud()) }} {{ rendicionForm.get('importeCalculado')?.value?.toFixed(2) }}</strong>
                  </div>
                }
                <div class="confirm-item">
                  <span class="label">Justificación:</span>
                  <strong>{{ rendicionForm.value.justificacion }}</strong>
                </div>
                <div class="confirm-item">
                  <span class="label">Proveedor:</span>
                  <strong>{{ rendicionForm.value.proveedor || 'No especificado' }}</strong>
                </div>
                @if (rendicionForm.value.tipoDocumento || rendicionForm.value.nroDocumento || rendicionForm.value.ruc) {
                  <div class="confirm-separator">Otros datos del documento</div>
                  @if (rendicionForm.value.tipoDocumento) {
                    <div class="confirm-item">
                      <span class="label">Tipo Documento:</span>
                      <strong>{{ rendicionForm.value.tipoDocumento }}</strong>
                    </div>
                  }
                  @if (rendicionForm.value.nroDocumento) {
                    <div class="confirm-item">
                      <span class="label">N° Documento:</span>
                      <strong>{{ rendicionForm.value.nroDocumento }}</strong>
                    </div>
                  }
                  @if (rendicionForm.value.ruc) {
                    <div class="confirm-item">
                      <span class="label">RUC:</span>
                      <strong>{{ rendicionForm.value.ruc }}</strong>
                    </div>
                  }
                  @if (rendicionForm.value.pais) {
                    <div class="confirm-item">
                      <span class="label">Ubicación:</span>
                      <strong>{{ rendicionForm.value.ciudad ? rendicionForm.value.ciudad + ', ' : '' }}{{ rendicionForm.value.pais }}</strong>
                    </div>
                  }
                  @if (rendicionForm.value.igv) {
                    <div class="confirm-item">
                      <span class="label">IGV:</span>
                      <strong>{{ getCurrencySymbol(rendicionForm.value.moneda || 'PEN') }} {{ rendicionForm.value.igv?.toFixed(2) }}</strong>
                    </div>
                  }
                }
              </div>

              <div class="step-actions">
                <button mat-button (click)="stepper.previous()">Atrás</button>
                <button mat-raised-button color="primary" (click)="guardar()" [disabled]="rendicionForm.invalid">
                  <mat-icon>save</mat-icon>
                  {{ editando() ? 'Actualizar Gasto' : 'Guardar Gasto' }}
                </button>
              </div>
              
              @if (rendicionForm.invalid) {
                <div class="validation-alert warning">
                  <mat-icon>info</mat-icon>
                  <span>Revisa que todos los campos obligatorios esten completos en el Paso 2</span>
                </div>
              }
            }

            @if (guardando()) {
              <div class="guardando-estado">
                <mat-spinner diameter="60"></mat-spinner>
                <h3>Guardando comprobante...</h3>
                <p>Por favor espera un momento</p>
              </div>
            }

            @if (gastoGuardado()) {
              <div class="gasto-guardado-exito">
                <mat-icon class="success-icon-large">check_circle</mat-icon>
                <h2>¡Gasto Registrado!</h2>
                <p>El comprobante ha sido guardado correctamente</p>

                <div class="opciones-continuar">
                  <button mat-raised-button color="accent" (click)="registrarOtroGasto()">
                    <mat-icon>add_circle</mat-icon>
                    Registrar otro gasto
                  </button>
                  <button mat-raised-button color="primary" (click)="finalizarRendicion()">
                    <mat-icon>done_all</mat-icon>
                    Finalizar rendicion
                  </button>
                </div>
              </div>
            }
          </div>
        </mat-step>

      </mat-stepper>
      } <!-- fin @if (!editando()) -->
    </div>
  `,
  styles: [`
    /* ============ Flat Edit Layout ============ */
    .edit-flat-container {
      display: flex;
      gap: 24px;
      margin-top: 20px;
      align-items: flex-start;
    }

    /* ---- Side panel (viáticos table + gastos) ---- */
    .edit-side-panel {
      flex: 0 0 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 24px;
      max-height: calc(100vh - 80px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }

    .edit-side-panel::-webkit-scrollbar { width: 4px; }
    .edit-side-panel::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    /* Resumen mini cards */
    .resumen-mini-cards {
      display: flex;
      gap: 8px;
    }

    .mini-card {
      flex: 1;
      background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mini-card span {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
    }

    .mini-card strong {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .mini-card strong.negativo {
      color: #dc2626;
    }

    /* Side section (wrapper for each block) */
    .edit-side-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .edit-side-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .edit-side-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #da291c;
    }

    .edit-side-hint {
      font-size: 11px;
      font-weight: 400;
      color: #94a3b8;
      margin-left: auto;
    }

    /* Viáticos table */
    .viaticos-table-wrapper {
      overflow-x: auto;
    }

    /* Gastos lista header */
    .gastos-lista-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .gastos-lista-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }

    .btn-limpiar-filtro {
      font-size: 12px !important;
      line-height: 28px !important;
      padding: 0 12px !important;
      border-radius: 14px !important;
    }

    .sin-gastos {
      font-size: 13px;
      color: #94a3b8;
      text-align: center;
      padding: 16px 0;
      margin: 0;
    }

    /* Concepto row clickable */
    .concepto-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .concepto-row:hover {
      background-color: #fef2f2;
    }

    .concepto-activo {
      background-color: #fef2f2 !important;
      border-left: 3px solid #da291c;
    }

    .concepto-activo td:first-child {
      padding-left: 9px;
    }

    /* Inline gasto actions */
    .gasto-item-actions-inline {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .gasto-item-actions-inline button {
      font-size: 11px !important;
      line-height: 26px !important;
      padding: 0 10px !important;
      border-radius: 12px !important;
      min-width: 0 !important;
    }

    .gasto-item-actions-inline button mat-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      vertical-align: middle;
      margin-right: 3px;
    }

    /* Comprobante embebido en side panel */
    .edit-comprobante-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .edit-comprobante-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
    }

    .edit-comprobante-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #da291c;
    }

    .edit-comprobante-img {
      width: 100%;
      max-height: 280px;
      object-fit: contain;
      cursor: pointer;
      display: block;
      padding: 8px;
    }

    .edit-comprobante-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      color: #64748b;
    }

    .edit-comprobante-pdf mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #da291c;
    }

    /* ---- Right form card ---- */
    .edit-form-card {
      flex: 1;
      background: white;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }

    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .edit-actions button {
      border-radius: 24px;
      padding: 8px 28px;
      font-weight: 600;
    }

    .edit-actions .btn-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .edit-flat-container {
        flex-direction: column;
      }
      .edit-side-panel {
        flex: none;
        width: 100%;
        position: static;
        max-height: none;
      }
    }

    /* Wizard Container */
    .rendicion-wizard-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
      min-height: calc(100vh - 100px);
    }

    .wizard-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;

      .btn-back mat-icon {
        font-size: 24px;
      }

      .header-content {
        flex: 1;

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 26px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #333;

          mat-icon {
            color: #E30613;
            font-size: 32px;
          }
        }

        .subtitle {
          color: #666;
          font-size: 14px;
        }
      }
    }

    .ux-progress-card {
      background: linear-gradient(135deg, #fff 0%, #f7f9fc 100%);
      border: 1px solid #e8edf3;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 16px;

      .ux-progress-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      .step-pill {
        background: #E30613;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .step-title {
        font-size: 13px;
        color: #374151;
        font-weight: 600;
        text-align: right;
      }

      .step-hint {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: #5b6472;
      }
    }

    /* Stepper Customization */
    .wizard-stepper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 24px;

      ::ng-deep .mat-horizontal-stepper-header-container {
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 8px;
      }

      ::ng-deep .mat-step-label {
        font-size: 13px;
      }
    }

    .step-content {
      padding: 32px 16px;
      min-height: 400px;
    }

    .step-icon-header {
      text-align: center;
      margin-bottom: 32px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #333;
      }

      p {
        color: #666;
        font-size: 14px;
        margin: 0;
      }

      &.paso-1 mat-icon { color: #2196F3; }
      &.paso-2 mat-icon { color: #FF9800; }
      &.paso-3 mat-icon { color: #9C27B0; }
      &.paso-4 mat-icon { color: #4CAF50; }
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;

      button {
        min-height: 40px;
      }
    }

    /* PASO 1: Captura */
    .capture-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .capture-tips {
      max-width: 600px;
      margin: 14px auto 0;
      border-radius: 10px;
      border: 1px solid #e3f2fd;
      background: #f4f9ff;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 10px 12px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #1e88e5;
        margin-top: 1px;
      }

      p {
        margin: 0;
        font-size: 12px;
        color: #4b5563;
        line-height: 1.35;
      }
    }

    .capture-btn {
      width: 100%;
      min-height: 120px;
      padding: 32px 24px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 12px;
      border-radius: 12px !important;
      transition: all 0.3s !important;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      span {
        display: block;
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        line-height: 1.2;
      }

      small {
        display: block;
        font-size: 12px;
        opacity: 0.8;
        text-align: center;
        line-height: 1.2;
      }

      ::ng-deep .mdc-button__label {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        white-space: normal;
      }

      &.photo-btn {
        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%) !important;
        color: white !important;
      }

      &.upload-btn {
        background: white !important;
        color: #333 !important;
        border: 2px solid #2196F3 !important;
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
      }
    }

    .file-captured {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: #E8F5E9;
      border-radius: 12px;
      border: 2px solid #4CAF50;
      max-width: 600px;
      margin: 0 auto;

      .success-icon {
        color: #4CAF50;
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .file-info {
        flex: 1;

        strong {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
        }

        span {
          font-size: 14px;
          color: #666;
        }
      }
    }

    .capture-preview-card {
      max-width: 600px;
      margin: 16px auto 0;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      background: #fff;
      padding: 12px;

      h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #444;
      }

      .capture-preview-image {
        width: 100%;
        max-height: 320px;
        object-fit: contain;
        border-radius: 8px;
        background: #fafafa;
      }

      .btn-open-preview {
        margin-top: 10px;
        width: 100%;
      }

      .capture-preview-pdf {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        background: #fff3f3;
        border: 1px dashed #ef9a9a;

        mat-icon {
          color: #E30613;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        strong {
          display: block;
          font-size: 14px;
          color: #333;
        }

        span {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
      }
    }

    /* PASO 2: Previsualización Mejorada */
    .image-preview-container {
      max-width: 600px;
      margin: 0 auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      position: relative;

      &.enhanced {
        padding-bottom: 16px;
        background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);
      }
    }

    .comprobante-preview {
      width: 100%;
      height: auto;
      display: block;
      max-height: 500px;
      object-fit: contain;
      transition: transform 0.3s ease;
      background: #fff;
    }

    .preview-edit-controls {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 100%);

      button {
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);

        &:hover {
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .file-info-chips {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px 0;
      flex-wrap: wrap;

      mat-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .loading-preview, .pdf-preview-placeholder {
      text-align: center;
      padding: 48px 24px;
      background: #f5f5f5;
      border-radius: 12px;

      mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: #666;
        margin-bottom: 16px;
      }

      p {
        color: #666;
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .filesize {
        display: block;
        color: #999;
        font-size: 13px;
        margin-top: 8px;
      }

      button {
        margin-top: 14px;
      }
    }

    .viaticos-edit-block {
      max-width: 760px;
      margin: 20px auto 0;
      padding: 14px;
      border: 1px solid #e6ebf2;
      border-radius: 12px;
      background: #ffffff;

      .block-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #263242;
        }

        mat-icon {
          color: #1d4ed8;
        }
      }
    }

    .resumen-mini-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;

      .mini-card {
        border: 1px solid #e6ebf2;
        border-radius: 10px;
        padding: 8px 10px;
        background: #f8fafc;

        span {
          display: block;
          font-size: 11px;
          color: #64748b;
        }

        strong {
          display: block;
          margin-top: 2px;
          font-size: 14px;
          color: #0f172a;

          &.negativo {
            color: #dc2626;
          }
        }
      }
    }

    .viaticos-table-wrapper {
      overflow-x: auto;
      border: 1px solid #e6ebf2;
      border-radius: 10px;
    }

    .viaticos-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 560px;

      th,
      td {
        text-align: left;
        padding: 8px 10px;
        font-size: 12px;
        border-bottom: 1px solid #eef2f7;
      }

      th {
        background: #f8fafc;
        color: #1e293b;
        font-weight: 800;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }

    .gastos-registrados-lista {
      margin-top: 12px;

      h4 {
        margin: 0 0 8px;
        font-size: 13px;
        color: #334155;
      }

      .sin-gastos {
        margin: 0;
        color: #64748b;
        font-size: 12px;
      }

      .gasto-item {
        border: 1px solid #e6ebf2;
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 6px;
        background: #fff;

        &.visual {
          display: flex;
          gap: 10px;
          align-items: flex-start;

          .gasto-main {
            flex: 1;
            min-width: 0;
          }
        }

        .gasto-thumb {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          border: 1px solid #d9e2ef;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;

          mat-icon {
            color: #64748b;
            font-size: 24px;
            width: 24px;
            height: 24px;
          }

          &.has-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .gasto-item-top,
        .gasto-item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .gasto-item-top {
          margin-bottom: 2px;

          strong {
            font-size: 12px;
            color: #0f172a;
          }

          .estado {
            font-size: 10px;
            font-weight: 700;
            color: #475569;
            background: #eef2ff;
            border-radius: 999px;
            padding: 2px 8px;
          }
        }

        .gasto-item-bottom {
          span {
            color: #64748b;
            font-size: 11px;
          }

          strong {
            font-size: 12px;
            color: #1e3a8a;
          }
        }

        .gasto-item-actions-inline {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;

          button {
            min-height: 28px;
            border-radius: 8px;
            font-size: 11px;
            padding: 0 8px;
          }
        }
      }

      .gasto-bloque {
        border: 1px solid #e5eaf2;
        border-radius: 10px;
        padding: 8px;
        background: #f8fafc;
        margin-bottom: 8px;

        &.exceso {
          border-color: #fecaca;
          background: #fff7f7;
        }

        .gasto-bloque-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;

          strong {
            font-size: 12px;
            color: #0f172a;
          }

          span {
            font-size: 11px;
            color: #475569;
            font-weight: 600;
          }

          .exceso-texto {
            color: #dc2626;
          }
        }

        .gasto-bloque-barra {
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
          margin-bottom: 8px;

          span {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          }
        }
      }
    }

    /* PASO 3: Document AI + Formulario */
    .extracting-loader {
      text-align: center;
      padding: 48px 24px;

      .extraccion-titulo {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        color: #888;
        margin-bottom: 20px;
      }

      .flight-progress {
        max-width: 320px;
        margin: 0 auto;
        border-radius: 4px;
      }
    }

    /* Airplane Animation */
    .airplane-animation {
      position: relative;
      width: 280px;
      height: 120px;
      margin: 0 auto 24px;
      overflow: hidden;
    }

    .flight-path {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .airplane {
      position: absolute;
      top: 30%;
      animation: fly 2.5s ease-in-out infinite;
    }

    .airplane-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #E30613;
      transform: rotate(-15deg);
      filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
    }

    .airplane-trail {
      position: absolute;
      top: calc(30% + 24px);
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, rgba(227,6,19,0.1) 20%, rgba(227,6,19,0.4) 50%, rgba(227,6,19,0.1) 80%, transparent 100%);
      animation: trail-pulse 2.5s ease-in-out infinite;
    }

    .clouds {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }

    .cloud {
      position: absolute;
      background: #e8e8e8;
      border-radius: 50px;
      opacity: 0.5;
    }

    .cloud.c1 {
      width: 50px;
      height: 16px;
      top: 15%;
      animation: cloud-move 3s linear infinite;
      animation-delay: 0s;
    }

    .cloud.c2 {
      width: 35px;
      height: 12px;
      top: 65%;
      animation: cloud-move 2.2s linear infinite;
      animation-delay: 0.8s;
    }

    .cloud.c3 {
      width: 42px;
      height: 14px;
      top: 80%;
      animation: cloud-move 2.8s linear infinite;
      animation-delay: 1.5s;
    }

    @keyframes fly {
      0% {
        left: -20%;
        top: 35%;
        transform: translateY(0);
      }
      25% {
        top: 22%;
        transform: translateY(-4px);
      }
      50% {
        left: 50%;
        top: 30%;
        transform: translateY(2px);
      }
      75% {
        top: 20%;
        transform: translateY(-6px);
      }
      100% {
        left: 110%;
        top: 28%;
        transform: translateY(0);
      }
    }

    @keyframes cloud-move {
      0% {
        left: 110%;
        opacity: 0;
      }
      10% {
        opacity: 0.5;
      }
      90% {
        opacity: 0.5;
      }
      100% {
        left: -20%;
        opacity: 0;
      }
    }

    @keyframes trail-pulse {
      0%, 100% {
        opacity: 0;
      }
      30%, 70% {
        opacity: 1;
      }
    }

      .capture-edit-actions {
        display: flex;
        justify-content: center;
        margin-top: 12px;
      }

      .monto-ai-resumen {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;

        .monto-ai-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 10px;
          background: #f8fafc;

          span {
            display: block;
            font-size: 11px;
            color: #64748b;
          }

          strong {
            display: block;
            margin-top: 2px;
            font-size: 14px;
            color: #0f172a;
          }

          &.destacado {
            background: #eef6ff;
            border-color: #bfdbfe;
          }
        }
      }

      .datos-form {
      max-width: 700px;
      margin: 0 auto;

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .concepto-field {
        textarea {
          min-height: 80px;
        }
      }
    }

    /* Indicador de Estado de Presupuesto */
    .presupuesto-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0;
      border: 2px solid;
      background: white;
      transition: all 0.3s ease;
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .indicator-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .indicator-label {
        font-weight: 600;
        font-size: 15px;
      }

      .indicator-detalle {
        font-size: 13px;
        opacity: 0.9;
      }

      &.status-primary {
        border-color: #4CAF50;
        background: #E8F5E9;
        color: #2E7D32;

        mat-icon {
          color: #4CAF50;
        }
      }

      &.status-accent {
        border-color: #2196F3;
        background: #E3F2FD;
        color: #1565C0;

        mat-icon {
          color: #2196F3;
        }
      }

      &.status-warn {
        border-color: #FF9800;
        background: #FFF3E0;
        color: #E65100;

        mat-icon {
          color: #FF9800;
        }
      }

      &.status-error {
        border-color: #F44336;
        background: #FFEBEE;
        color: #C62828;

        mat-icon {
          color: #F44336;
        }
      }
    }

    /* PASO 4: Resumen de Viáticos */
    .resumen-viaticos {
      max-width: 700px;
      margin: 0 auto 32px;
    }

    .concepto-item {
      padding: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
    }

    .concepto-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .concepto-info {
      display: flex;
      align-items: center;
      gap: 12px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;

        &.icon-alojamiento { color: #9C27B0; }
        &.icon-alimentación { color: #FF9800; }
        &.icon-transporte { color: #2196F3; }
        &.icon-impuestos { color: #607D8B; }
        &.icon-otros { color: #795548; }
      }

      .concepto-nombre {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .concepto-montos {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;

      .monto-rendido {
        font-weight: 600;
        color: #333;
      }

      .monto-separator {
        color: #999;
      }

      .monto-total {
        color: #666;
      }
    }

    .progreso-bar-container {
      position: relative;

      .mat-mdc-progress-bar {
        height: 12px !important;
        border-radius: 6px;

        &.parcial ::ng-deep .mdc-linear-progress__bar-inner {
          background-color: #FF9800 !important;
        }

        &.completo ::ng-deep .mdc-linear-progress__bar-inner {
          background-color: #4CAF50 !important;
        }

        &.excedido ::ng-deep .mdc-linear-progress__bar-inner {
          background-color: #F44336 !important;
        }
      }

      .porcentaje-label {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #666;
      }
    }

    .resumen-total-card {
      background: linear-gradient(135deg, #FFF8F8 0%, #FFE5E5 100%);
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #E30613;
      max-width: 700px;
      margin: 0 auto;

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 16px 0;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 16px;

        strong {
          font-weight: 600;

          &.negativo {
            color: #F44336;
          }
        }

        &.saldo {
          border-top: 2px solid #E30613;
          padding-top: 12px;
          margin-top: 8px;
          font-size: 18px;
        }
      }

      .total-rendido {
        color: #E30613;
      }
    }

    /* PASO 5: Confirmar */
    .confirmacion-resumen {
      max-width: 500px;
      margin: 0 auto 32px;
      padding: 24px;
      background: #f9f9f9;
      border-radius: 12px;
    }

    .confirm-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #666;
        font-size: 14px;
      }

      strong {
        color: #333;
        font-size: 14px;
      }

      .monto-destacado {
        color: #E30613;
        font-size: 18px;
      }
    }

    .confirm-separator {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      letter-spacing: 1px;
      padding: 16px 0 4px;
      border-bottom: 2px solid #E30613;
      margin-top: 8px;
    }

    .conversion-item {
      background: #fff3e0;
      padding: 12px 16px !important;
      border-radius: 8px;
      margin: 4px 0;
    }

    /* Panel expandible - Datos del Documento */
    .campos-extendidos-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 8px 0 16px;
      background: #f5f5f5;
      border: 1px dashed #ccc;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 500;
      color: #555;

      &:hover {
        background: #eeeeee;
        border-color: #E30613;
        color: #333;
      }

      .ai-badge {
        margin-left: auto;
        background: linear-gradient(135deg, #E30613, #ff5722);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .campos-extendidos-panel {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 8px;
      }

      .igv-row {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 8px;

        mat-checkbox {
          flex-shrink: 0;
        }
        .campo-igv {
          flex: 1;
          max-width: 200px;
        }
      }
    }

    /* Conversión de moneda */
    .conversion-moneda-section {
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 16px;

      .conversion-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #e65100;
        margin-bottom: 12px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }

    .guardando-estado {
      text-align: center;
      padding: 48px 24px;

      mat-spinner {
        margin: 0 auto 24px;
      }

      h3 {
        font-size: 20px;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .validation-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #ffebee;
      border: 1px solid #ef5350;
      border-radius: 8px;
      margin-top: 16px;
      color: #c62828;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .word-hint {
        margin: 0;
        font-size: 12px;
        color: #5b6472;
      }
      
      &.warning {
        background: #fff3e0;
        border-color: #fb8c00;
        color: #e65100;
      }
    }

    .gasto-guardado-exito {
      text-align: center;
      padding: 48px 24px;

      .success-icon-large {
        font-size: 96px;
        width: 96px;
        height: 96px;
        color: #4CAF50;
        margin-bottom: 24px;
        animation: scaleIn 0.5s ease-out;
      }

      h2 {
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #333;
      }

      p {
        color: #666;
        margin-bottom: 32px;
      }
    }

    .opciones-continuar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      max-width: 500px;
      margin: 0 auto;

      button {
        padding: 16px 24px !important;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    @keyframes scaleIn {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .rendicion-wizard-container {
        padding: 12px;
      }

      .wizard-stepper {
        padding: 12px;

        ::ng-deep .mat-horizontal-stepper-header-container {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
        }

        ::ng-deep .mat-horizontal-stepper-header {
          min-width: 96px;
          flex: 0 0 auto;
        }

        ::ng-deep .mat-step-label {
          font-size: 11px;
          white-space: nowrap;
        }
      }

      .ux-progress-card {
        padding: 10px 12px;

        .step-title {
          font-size: 12px;
        }
      }

      .step-content {
        padding: 18px 6px;
        min-height: auto;
      }

      .step-icon-header {
        margin-bottom: 20px;

        mat-icon {
          font-size: 44px;
          width: 44px;
          height: 44px;
          margin-bottom: 10px;
        }

        h2 {
          font-size: 22px;
          line-height: 1.2;
        }

        p {
          font-size: 13px;
          line-height: 1.35;
        }
      }

      .capture-options {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .capture-btn {
        min-height: 96px;
        padding: 18px 12px !important;

        mat-icon {
          font-size: 30px;
          width: 30px;
          height: 30px;
        }

        span {
          font-size: 15px;
        }

        small {
          font-size: 11px;
        }
      }

      .file-captured {
        padding: 14px;
        gap: 10px;

        .success-icon {
          font-size: 30px;
          width: 30px;
          height: 30px;
        }

        .file-info {
          min-width: 0;

          strong {
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          span {
            font-size: 12px;
          }
        }
      }

      .capture-preview-card {
        margin-top: 12px;
        padding: 10px;

        .capture-preview-image {
          max-height: 220px;
        }
      }

      .viaticos-edit-block {
        margin-top: 14px;
        padding: 10px;
      }

      .resumen-mini-cards {
        grid-template-columns: 1fr;
      }

      .gastos-registrados-lista {
        .gasto-bloque {
          padding: 7px;
        }

        .gasto-item.visual {
          gap: 8px;

          .gasto-thumb {
            width: 50px;
            height: 50px;
            border-radius: 8px;
          }

          .gasto-item-top {
            align-items: flex-start;
            flex-direction: column;

            strong {
              font-size: 11px;
              line-height: 1.25;
            }

            .estado {
              font-size: 9px;
            }
          }

          .gasto-item-bottom {
            span,
            strong {
              font-size: 11px;
            }
          }

          .gasto-item-actions-inline {
            margin-top: 8px;

            button {
              min-height: 30px;
            }
          }
        }
      }

      .datos-form .form-row {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column-reverse;
        gap: 10px;
        padding-top: 16px;

        button {
          width: 100%;
        }
      }

      .opciones-continuar {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .wizard-header {
        align-items: flex-start;
        gap: 10px;

        .header-content h1 {
          font-size: 23px;
          line-height: 1.2;
        }
      }

      .wizard-stepper {
        ::ng-deep .mat-horizontal-stepper-header {
          min-width: 52px;
          padding: 0 6px;
        }

        ::ng-deep .mat-step-label {
          display: none;
        }
      }

      .ux-progress-card {
        .ux-progress-top {
          flex-direction: column;
          align-items: flex-start;
        }

        .step-title {
          text-align: left;
        }
      }

      .capture-tips {
        p {
          font-size: 11px;
        }
      }

      .gastos-registrados-lista {
        .gasto-item.visual {
          .gasto-item-actions-inline {
            button {
              flex: 1;
              padding: 0 6px;
              font-size: 10px;
            }
          }
        }
      }
    }
  `]
})
export class FormularioRendicionComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepperRef!: MatStepper;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private rendicionService = inject(RendicionService);
  private solicitudService = inject(SolicitudService);
  private documentAIService = inject(DocumentAIService);

  rendicionForm!: FormGroup;
  guardando = signal(false);
  solicitudes = signal<Solicitud[]>([]);
  rendicionesRegistradas = signal<Rendicion[]>([]);
  maxDate = new Date();
  
  // Control de pasos del wizard
  currentStep = signal(0);
  stepProgress = computed(() => ((this.currentStep() + 1) / 3) * 100);
  comprobanteFile = signal<File | null>(null);
  comprobantePreview = signal<string | null>(null);
  pasoPreviewCompletado = signal(false);
  extrayendoDatos = signal(false);
  gastoGuardado = signal(false);
  editando = signal(false);
  rendicionEditandoId = signal<string | null>(null);
  rotacionImagen = signal(0); // Control de rotación de imagen
  
  // Datos extraídos por Document AI
  datosExtraidos = signal<DocumentAIResult | null>(null);
  
  // Solicitud seleccionada
  solicitudSeleccionada = computed(() => {
    const solicitudId = this.rendicionForm?.value?.solicitudId;
    return this.solicitudes().find(s => s.id === solicitudId);
  });

  gastosRegistradosSolicitud = computed(() => {
    const solicitudId = this.rendicionForm?.value?.solicitudId;
    if (!solicitudId) return [];

    return this.rendicionesRegistradas()
      .filter(r => r.solicitudId === solicitudId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });
  
  // Exponer enum para template
  readonly CategoriaGasto = CategoriaGasto;

  ngAfterViewInit(): void {
    // noop — stepper auto-advance is handled after async data load
  }

  ngOnInit(): void {
    this.initForm();
    this.loadSolicitudes();
    this.loadRendicionesRegistradas();
    
    // Cargar solicitudId desde ruta si existe
    const solicitudId = this.route.snapshot.queryParamMap.get('solicitudId');
    if (solicitudId) {
      this.rendicionForm.patchValue({ solicitudId });
    }

    const rendicionId = this.route.snapshot.paramMap.get('id');
    if (rendicionId) {
      this.cargarRendicionParaEdicion(rendicionId);
    }
  }

  private initForm(): void {
    this.rendicionForm = this.fb.group({
      solicitudId: ['', Validators.required],
      categoria: ['', Validators.required],
      concepto: [''],
      fecha: [new Date(), Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      moneda: ['PEN', Validators.required],
      proveedor: [''],
      justificacion: ['', [Validators.required, Validators.maxLength(200)]],
      // Campos adicionales del documento
      tipoDocumento: [''],
      nroDocumento: [''],
      ruc: [''],
      afectoIgv: [true],
      igv: [null],
      otrosServicios: [null],
      ordenInterna: [''],
      pais: [''],
      ciudad: [''],
      // Conversión de moneda
      tipoCambio: [null],
      importeCalculado: [{ value: null, disabled: true }]
    });

    // Recalcular importe cuando cambien monto o tipoCambio
    this.rendicionForm.get('monto')?.valueChanges.subscribe(() => this.recalcularImporte());
    this.rendicionForm.get('tipoCambio')?.valueChanges.subscribe(() => this.recalcularImporte());
    
    console.log('📝 Formulario de rendición inicializado');
  }

  private loadSolicitudes(): void {
    this.solicitudService.getSolicitudes().subscribe({
      next: (solicitudes: Solicitud[]) => {
        // Filtrar solo solicitudes aprobadas
        const aprobadas = solicitudes.filter((s: Solicitud) => 
          s.estado === 'APROBADO_N1' || s.estado === 'APROBADO_N2'
        );
        
        console.log('📋 Solicitudes disponibles:', aprobadas.length);
        
        if (aprobadas.length === 0) {
          console.warn('⚠️ No hay solicitudes aprobadas disponibles');
          this.snackBar.open('⚠️ No hay solicitudes aprobadas. Crea y aprueba una solicitud primero.', 'Cerrar', { duration: 5000 });
        }
        
        this.solicitudes.set(aprobadas);

        // Si solo hay una, seleccionarla automáticamente
        if (aprobadas.length === 1) {
          console.log('✅ Auto-seleccionando única solicitud:', aprobadas[0].codigo);
          this.rendicionForm.patchValue({ solicitudId: aprobadas[0].id });
        }
      },
      error: (error) => {
        console.error('❌ Error cargando solicitudes:', error);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadRendicionesRegistradas(): void {
    this.rendicionService.getAll().subscribe({
      next: (rendiciones) => this.rendicionesRegistradas.set(rendiciones),
      error: (error) => console.error('Error cargando rendiciones registradas:', error)
    });
  }

  private cargarRendicionParaEdicion(id: string): void {
    this.rendicionService.getById(id).subscribe({
      next: (rendicion) => {
        if (!rendicion) {
          this.snackBar.open('No se encontró el gasto a editar', 'Cerrar', { duration: 3000 });
          return;
        }

        this.editando.set(true);
        this.rendicionEditandoId.set(rendicion.id);
        this.pasoPreviewCompletado.set(true);
        // Auto-advance the stepper to Step 2 (Datos) in edit mode
        setTimeout(() => {
          if (this.stepperRef) {
            this.stepperRef.selectedIndex = 1;
            this.currentStep.set(1);
          }
        }, 50);
        this.rendicionForm.patchValue({
          solicitudId: rendicion.solicitudId,
          categoria: rendicion.categoria,
          concepto: rendicion.concepto,
          justificacion: rendicion.justificacion || rendicion.concepto,
          fecha: new Date(rendicion.fecha),
          monto: rendicion.monto,
          moneda: rendicion.moneda,
          proveedor: rendicion.proveedor || '',
        });
        if (rendicion.comprobante) {
          this.comprobantePreview.set(rendicion.comprobante);
        }
      }
    });
  }

  // ============ PASO 1: CAPTURA DEL DOCUMENTO ============

  abrirCamaraWeb(): void {
    const dialogRef = this.dialog.open(CameraDialogComponent, {
      width: '90vw',
      maxWidth: '600px',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'camera-dialog-container'
    });

    dialogRef.afterClosed().subscribe((fotoBase64: string | null) => {
      if (fotoBase64) {
        this.convertirBase64AFile(fotoBase64, 'comprobante.jpg').then(file => {
          this.comprobanteFile.set(file);
          this.comprobantePreview.set(fotoBase64);
          this.snackBar.open('✅ Comprobante capturado', 'Cerrar', { duration: 2000 });
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      this.snackBar.open('⚠️ El archivo es demasiado grande. Máximo 5MB', 'Cerrar', { duration: 4000 });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('⚠️ Formato no válido. Use JPG, PNG o PDF', 'Cerrar', { duration: 4000 });
      return;
    }

    this.comprobanteFile.set(file);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.comprobantePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.snackBar.open('📄 Archivo seleccionado correctamente', 'Cerrar', { duration: 2000 });
  }

  removeComprobante(): void {
    this.comprobanteFile.set(null);
    this.comprobantePreview.set(null);
    this.pasoPreviewCompletado.set(false);
    this.snackBar.open('🗑️ Comprobante eliminado', 'Cerrar', { duration: 2000 });
  }

  isImageFile(): boolean {
    const file = this.comprobanteFile();
    if (file) {
      return file.type.startsWith('image/');
    }
    const preview = this.comprobantePreview() || '';
    return preview.startsWith('data:image/');
  }

  isPdfFile(): boolean {
    const file = this.comprobanteFile();
    if (file) {
      return file.type === 'application/pdf';
    }
    const preview = this.comprobantePreview() || '';
    return preview.startsWith('data:application/pdf');
  }

  getFileSize(): string {
    const file = this.comprobanteFile();
    if (!file) return '';

    const bytes = file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  abrirVistaPreviaImagen(): void {
    const preview = this.comprobantePreview();
    if (!preview) return;
    window.open(preview, '_blank', 'noopener,noreferrer');
  }

  abrirComprobanteDocumento(): void {
    const preview = this.comprobantePreview();
    if (preview) {
      window.open(preview, '_blank', 'noopener,noreferrer');
      return;
    }

    const file = this.comprobanteFile();
    if (!file) {
      this.snackBar.open('No se encontro un comprobante para visualizar', 'Cerrar', { duration: 2500 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  }

  onStepChange(index: number): void {
    this.currentStep.set(index);
  }

  irAConfirmacion(stepper: any): void {
    stepper.selectedIndex = 2;
    this.currentStep.set(2);
  }

  confirmarYExtraerPaso1(stepper: any): void {
    this.pasoPreviewCompletado.set(true);
    if (!this.editando()) {
      this.extraerDatosComprobante();
    }
    stepper.next();
  }

  getStepTitle(): string {
    const titles = [
      'Captura y extraccion',
      'Datos autocompletados',
      'Confirmacion final'
    ];
    return titles[this.currentStep()] ?? 'Flujo de rendicion';
  }

  getStepHint(): string {
    const hints = [
      'Sube una imagen clara o PDF y extrae datos.',
      'Valida los campos detectados y completa faltantes.',
      'Confirma y guarda el comprobante en la rendicion.'
    ];
    return hints[this.currentStep()] ?? '';
  }

  private async convertirBase64AFile(base64: string, filename: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/jpeg' });
  }

  // ============ PASO 2: PREVISUALIZACIÓN ============

  volverAPaso1(stepper: any): void {
    this.comprobanteFile.set(null);
    this.comprobantePreview.set(null);
    this.pasoPreviewCompletado.set(false);
    this.rotacionImagen.set(0);
    stepper.previous();
  }

  /**
   * Rotar imagen 90° a la izquierda
   */
  rotarImagenIzquierda(): void {
    const currentRotation = this.rotacionImagen();
    this.rotacionImagen.set((currentRotation - 90) % 360);
  }

  /**
   * Rotar imagen 90° a la derecha
   */
  rotarImagenDerecha(): void {
    const currentRotation = this.rotacionImagen();
    this.rotacionImagen.set((currentRotation + 90) % 360);
  }

  // ============ PASO 2: DOCUMENT AI Y FORMULARIO ============

  private extraerDatosComprobante(): void {
    const file = this.comprobanteFile();
    if (!file) return;

    this.extrayendoDatos.set(true);

    this.documentAIService.extractDocumentData(file).subscribe({
      next: (datos: DocumentAIResult) => {
        this.datosExtraidos.set(datos);
        this.autocompletarFormulario(datos);
        this.extrayendoDatos.set(false);
      },
      error: (error) => {
        console.error('Error al extraer datos:', error);
        this.snackBar.open('⚠️ No se pudo extraer información del comprobante', 'Cerrar', { duration: 3000 });
        this.extrayendoDatos.set(false);
      }
    });
  }

  private autocompletarFormulario(datos: DocumentAIResult): void {
    const updates: any = {};

    if (datos.fecha) {
      try {
        // Convertir formato DD/MM/YYYY a Date
        const [day, month, year] = datos.fecha.split('/');
        const fecha = new Date(`${year}-${month}-${day}`);
        if (!isNaN(fecha.getTime())) {
          updates.fecha = fecha;
        }
      } catch (error) {
        console.warn('⚠️ Error parseando fecha del Document AI:', error);
      }
    }
    
    if (datos.monto !== undefined && datos.monto !== null) {
      updates.monto = parseFloat(datos.monto.toString());
    }
    
    if (datos.proveedor) updates.proveedor = datos.proveedor;
    if (datos.moneda) updates.moneda = datos.moneda;
    if (datos.ruc) updates.ruc = datos.ruc;
    if (datos.concepto) {
      updates.concepto = datos.concepto;
      updates.justificacion = datos.concepto;
    }

    // Usar metadata para autocompletar campos adicionales
    if (datos.metadata?.categoria) updates.categoria = datos.metadata.categoria;
    if (datos.metadata?.tipoDocumento) updates.tipoDocumento = datos.metadata.tipoDocumento;
    if (datos.metadata?.nroDocumento) updates.nroDocumento = datos.metadata.nroDocumento;
    if (datos.metadata?.afectoIgv !== undefined) updates.afectoIgv = datos.metadata.afectoIgv;
    if (datos.metadata?.igv !== undefined) updates.igv = datos.metadata.igv;
    if (datos.metadata?.otrosServicios) updates.otrosServicios = datos.metadata.otrosServicios;
    if (datos.metadata?.ordenInterna) updates.ordenInterna = datos.metadata.ordenInterna;
    if (datos.metadata?.pais) updates.pais = datos.metadata.pais;
    if (datos.metadata?.ciudad) updates.ciudad = datos.metadata.ciudad;

    console.log('🤖 Autocompletando con Document AI:', updates);
    this.rendicionForm.patchValue(updates);

    // Si la moneda del documento difiere de la solicitud, calcular tipo de cambio
    this.verificarConversionMoneda();

    // Mensaje mejorado con metadata SAP
    let mensaje = `✨ Datos extraídos automáticamente (${datos.confidence}% confianza)`;
    if (datos.metadata) {
      const detalles: string[] = [];
      if (datos.metadata.tipoDocumento) detalles.push(datos.metadata.tipoDocumento);
      if (datos.metadata.metodoPago) detalles.push(datos.metadata.metodoPago);
      if (datos.metadata.pais) detalles.push(datos.metadata.pais);
      if (detalles.length > 0) {
        mensaje += ` - ${detalles.join(' | ')}`;
      }
    }

    this.snackBar.open(mensaje, 'Cerrar', { duration: 4000 });
  }

  onVoiceTextCaptured(text: string): void {
    const justificacionControl = this.rendicionForm.get('justificacion');
    if (justificacionControl) {
      const currentValue = justificacionControl.value || '';
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      justificacionControl.setValue(newValue);
      justificacionControl.markAsTouched();
      this.snackBar.open('🎤 Texto capturado correctamente', 'Cerrar', { duration: 2000 });
    }
  }

  // ============ CONVERSIÓN DE MONEDA ============

  mostrarCamposExtendidos = signal(false);
  requiereConversion = signal(false);
  categoriaFiltro = signal<string | null>(null);

  toggleCamposExtendidos(): void {
    this.mostrarCamposExtendidos.update(v => !v);
  }

  getMonedaSolicitud(): string {
    const solicitud = this.solicitudSeleccionada();
    return solicitud?.monedaAnticipo || 'PEN';
  }

  verificarConversionMoneda(): void {
    const monedaDoc = this.rendicionForm.get('moneda')?.value;
    const monedaSol = this.getMonedaSolicitud();
    this.requiereConversion.set(monedaDoc && monedaSol && monedaDoc !== monedaSol);
    if (this.requiereConversion()) {
      // Tipo de cambio por defecto según monedas
      const tc = this.rendicionForm.get('tipoCambio')?.value;
      if (!tc) {
        const defaultTc = this.getTipoCambioDefault(monedaDoc, monedaSol);
        this.rendicionForm.patchValue({ tipoCambio: defaultTc });
      }
      this.recalcularImporte();
    }
  }

  private getTipoCambioDefault(monedaOrigen: string, monedaDestino: string): number {
    // Tipos de cambio simulados de referencia
    const tasas: Record<string, Record<string, number>> = {
      'USD': { 'PEN': 3.72, 'EUR': 0.92 },
      'EUR': { 'PEN': 4.05, 'USD': 1.09 },
      'PEN': { 'USD': 0.27, 'EUR': 0.25 }
    };
    return tasas[monedaOrigen]?.[monedaDestino] || 1;
  }

  recalcularImporte(): void {
    const monto = this.rendicionForm.get('monto')?.value;
    const tc = this.rendicionForm.get('tipoCambio')?.value;
    if (monto && tc) {
      const calculado = parseFloat((monto * tc).toFixed(2));
      this.rendicionForm.get('importeCalculado')?.setValue(calculado, { emitEvent: false });
    }
  }

  // ============ PASO 3: RESUMEN DE VIATICOS ============

  getConceptosResumen(): Array<{ nombre: string; icono: string; rendido: number; presupuestado: number; porcentaje: number }> {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return [];

    // Obtener presupuestos por concepto (basado en MÓDULO 2)
    const duracionDias = this.calcularDiasViaje(solicitud.fechaSalida, solicitud.fechaRetorno);
    const presupuestoTotal = solicitud.presupuestoTotal;
    
    const porcentajeAlojamiento = duracionDias > 5 ? 0.40 : 0.35;
    const porcentajeTransporte = duracionDias > 5 ? 0.15 : 0.20;

    const conceptos = [
      { 
        nombre: 'Alojamiento', 
        icono: 'hotel',
        presupuestado: presupuestoTotal * porcentajeAlojamiento,
        rendido: this.getMontoRendidoConcepto('HOSPEDAJE')
      },
      { 
        nombre: 'Alimentación', 
        icono: 'restaurant',
        presupuestado: presupuestoTotal * 0.30,
        rendido: this.getMontoRendidoConcepto('ALIMENTACION')
      },
      { 
        nombre: 'Transporte', 
        icono: 'directions_car',
        presupuestado: presupuestoTotal * porcentajeTransporte,
        rendido: this.getMontoRendidoConcepto('TRANSPORTE')
      },
      { 
        nombre: 'Impuestos', 
        icono: 'receipt_long',
        presupuestado: presupuestoTotal * 0.10,
        rendido: 0 // Los impuestos no se rinden por separado en este prototipo
      },
      { 
        nombre: 'Otros', 
        icono: 'more_horiz',
        presupuestado: presupuestoTotal * 0.05,
        rendido: this.getMontoRendidoConcepto('OTROS')
      }
    ];

    return conceptos.map(c => ({
      ...c,
      porcentaje: c.presupuestado > 0 ? Math.round((c.rendido / c.presupuestado) * 100) : 0
    }));
  }

  private calcularDiasViaje(fechaSalida: Date, fechaRetorno: Date): number {
    const salida = new Date(fechaSalida);
    const retorno = new Date(fechaRetorno);
    const diffTime = Math.abs(retorno.getTime() - salida.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getMontoRendidoConcepto(categoria: string): number {
    const gastos = this.gastosRegistradosSolicitud();
    if (gastos.length > 0) {
      return gastos
        .filter(r => r.categoria === categoria)
        .reduce((sum, r) => sum + r.monto, 0);
    }

    const solicitud = this.solicitudSeleccionada();
    if (!solicitud || !solicitud.rendiciones) return 0;

    return solicitud.rendiciones
      .filter(r => r.categoria === categoria)
      .reduce((sum, r) => sum + r.monto, 0);
  }

  getTotalRendido(): number {
    const gastos = this.gastosRegistradosSolicitud();
    if (gastos.length > 0) {
      return gastos.reduce((sum, r) => sum + r.monto, 0);
    }

    const solicitud = this.solicitudSeleccionada();
    if (!solicitud || !solicitud.rendiciones) return 0;

    return solicitud.rendiciones.reduce((sum, r) => sum + r.monto, 0);
  }

  getPresupuestoTotal(): number {
    const solicitud = this.solicitudSeleccionada();
    return solicitud?.presupuestoTotal || 0;
  }

  getSaldo(): number {
    return this.getPresupuestoTotal() - this.getTotalRendido();
  }

  /**
   * Helper para obtener el monto actual del formulario como número
   */
  getMonto(): number {
    return parseFloat(this.rendicionForm.get('monto')?.value) || 0;
  }

  verComprobantesConcepto(concepto: string): void {
    this.snackBar.open(`📋 Ver comprobantes de ${concepto} (funcionalidad pendiente)`, 'Cerrar', { duration: 2000 });
  }

  /**
   * Valida si el gasto a registrar excede el presupuesto aprobado
   */
  private validarExcesoPresupuesto(): { excede: boolean; mensaje: string } {
    const montoIngresado = parseFloat(this.rendicionForm.value.monto) || 0;
    const totalActual = this.getTotalRendido();
    const presupuesto = this.getPresupuestoTotal();
    const nuevoTotal = totalActual + montoIngresado;
    const exceso = nuevoTotal - presupuesto;

    if (exceso > 0) {
      return {
        excede: true,
        mensaje: `⚠️ Este gasto excede el presupuesto aprobado en S/ ${exceso.toFixed(2)}. ` +
                 `Total con este gasto: S/ ${nuevoTotal.toFixed(2)} | Presupuesto: S/ ${presupuesto.toFixed(2)}`
      };
    }

    // Alerta si está cerca del límite (>90%)
    const porcentaje = (nuevoTotal / presupuesto) * 100;
    if (porcentaje > 90 && porcentaje <= 100) {
      return {
        excede: false,
        mensaje: `ℹ️ Con este gasto usarás el ${porcentaje.toFixed(1)}% del presupuesto aprobado.`
      };
    }

    return { excede: false, mensaje: '' };
  }

  /**
   * Obtiene el estado del presupuesto para mostrar en UI (considerando monto actual)
   */
  getEstadoPresupuesto(): { color: string; icono: string; texto: string } {
    const montoActual = parseFloat(this.rendicionForm.get('monto')?.value) || 0;
    const totalConNuevoGasto = this.getTotalRendido() + montoActual;
    const porcentaje = (totalConNuevoGasto / this.getPresupuestoTotal()) * 100;
    
    if (porcentaje >= 100) {
      return { color: 'error', icono: 'warning', texto: '⚠️ Presupuesto Excedido' };
    } else if (porcentaje >= 90) {
      return { color: 'warn', icono: 'info', texto: '⚡ Cerca del Límite' };
    } else if (porcentaje >= 70) {
      return { color: 'accent', icono: 'check_circle', texto: '✓ Buen Avance' };
    } else {
      return { color: 'primary', icono: 'thumb_up', texto: '✓ Dentro del Presupuesto' };
    }
  }

  // ============ PASO 3: CONFIRMAR Y GUARDAR ============

  guardar(): void {
    if (this.rendicionForm.invalid) {
      this.rendicionForm.markAllAsTouched();
      
      // Mostrar qué campos están inválidos
      const invalidFields: string[] = [];
      Object.keys(this.rendicionForm.controls).forEach(key => {
        const control = this.rendicionForm.get(key);
        if (control && control.invalid && control.errors) {
          invalidFields.push(key);
        }
      });
      
      console.error('❌ Campos inválidos:', invalidFields);
      this.snackBar.open('⚠️ Por favor completa todos los campos requeridos', 'Cerrar', { duration: 4000 });
      return;
    }

    // Validar exceso de presupuesto
    const validacion = this.validarExcesoPresupuesto();
    
    if (validacion.excede) {
      // Mostrar diálogo de confirmación si excede presupuesto
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '450px',
        data: {
          title: '⚠️ Exceso de Presupuesto',
          message: validacion.mensaje + '\n\n¿Deseas continuar de todas formas? Necesitarás justificar el exceso.',
          confirmText: 'Continuar',
          cancelText: 'Revisar Monto'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Si acepta, verificar que haya justificación
          if (!this.rendicionForm.value.justificacion) {
            this.snackBar.open('⚠️ Debes agregar una justificación para el exceso de presupuesto', 'Cerrar', { duration: 4000 });
            return;
          }
          this.procesarGuardado();
        }
      });
    } else {
      // Si no excede, mostrar mensaje informativo si está cerca del límite
      if (validacion.mensaje) {
        this.snackBar.open(validacion.mensaje, 'OK', { duration: 3000 });
      }
      this.procesarGuardado();
    }
  }

  private procesarGuardado(): void {
    this.guardando.set(true);
    
    // Convertir y validar datos antes de enviar
    const formValue = this.rendicionForm.value;
    
    const solicitud = this.solicitudSeleccionada();
    const rendicionData = {
      solicitudId: formValue.solicitudId,
      viajeId: solicitud?.idViaje || solicitud?.codigo,
      destino: solicitud?.destino,
      salida: solicitud?.origen,
      retorno: solicitud?.retorno,
      fechaMaxRendicion: solicitud?.fechaMaxRendicion,
      aprobadorNombre: solicitud?.aprobadorActual,
      categoria: formValue.categoria,
      concepto: formValue.justificacion,
      fecha: formValue.fecha instanceof Date ? formValue.fecha : new Date(formValue.fecha),
      monto: parseFloat(formValue.monto), // Asegurar que sea número
      moneda: formValue.moneda || 'PEN',
      comprobante: this.comprobantePreview() || undefined,
      proveedor: formValue.proveedor || '',
      justificacion: formValue.justificacion || '',
      empleadoId: 'EMP-001', // En producción vendría del auth
      estado: EstadoRendicion.BORRADOR,
      // Campos adicionales del documento
      tipoDocumento: formValue.tipoDocumento || undefined,
      nroDocumento: formValue.nroDocumento || undefined,
      ruc: formValue.ruc || undefined,
      afectoIgv: formValue.afectoIgv,
      igv: formValue.igv ? parseFloat(formValue.igv) : undefined,
      otrosServicios: formValue.otrosServicios ? parseFloat(formValue.otrosServicios) : undefined,
      ordenInterna: formValue.ordenInterna || undefined,
      pais: formValue.pais || undefined,
      ciudad: formValue.ciudad || undefined,
      // Conversión de moneda
      tipoCambio: formValue.tipoCambio ? parseFloat(formValue.tipoCambio) : undefined,
      importeCalculado: this.rendicionForm.get('importeCalculado')?.value || undefined
    };
    
    console.log('📤 Enviando rendición:', rendicionData);

    const guardar$ = this.editando() && this.rendicionEditandoId()
      ? this.rendicionService.update(this.rendicionEditandoId()!, rendicionData)
      : this.rendicionService.create(rendicionData);

    guardar$.subscribe({
      next: (rendicionCreada) => {
        this.guardando.set(false);
        this.loadRendicionesRegistradas();
        console.log('✅ Rendición creada:', rendicionCreada);
        this.snackBar.open(this.editando() ? '✓ Gasto actualizado correctamente' : '✓ Gasto registrado correctamente', 'Cerrar', { duration: 3000 });
        
        if (this.editando()) {
          // En modo edición, volver al listado de gastos
          this.router.navigate(['/rendiciones/listado']);
        } else {
          this.gastoGuardado.set(true);
        }
      },
      error: (error) => {
        this.guardando.set(false);
        console.error('Error al guardar rendición:', error);
        this.snackBar.open('Error al guardar el gasto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancelarEdicion(): void {
    this.router.navigate(['/rendiciones/listado']);
  }

  guardarEdicion(): void {
    this.guardar();
  }

  registrarOtroGasto(): void {
    // Resetear formulario y estados
    this.rendicionForm.reset({
      solicitudId: this.rendicionForm.value.solicitudId, // Mantener la misma solicitud
      moneda: 'PEN',
      fecha: new Date(),
      afectoIgv: true
    });
    this.comprobanteFile.set(null);
    this.comprobantePreview.set(null);
    this.pasoPreviewCompletado.set(false);
    this.gastoGuardado.set(false);
    this.datosExtraidos.set(null);
    this.mostrarCamposExtendidos.set(false);
    this.requiereConversion.set(false);
    
    // Volver al paso 1
    this.router.navigate(['/rendiciones/formulario'], { 
      queryParams: { solicitudId: this.rendicionForm.value.solicitudId }
    });
  }

  finalizarRendicion(): void {
    this.router.navigate(['/rendiciones/listado']);
  }

  volver(): void {
    this.router.navigate(['/rendiciones/listado']);
  }

  // ============ UTILIDADES ============

  getCategoriaLabel(categoria: string): string {
    const labels: Record<string, string> = {
      'ALIMENTACION': 'Alimentación',
      'TRANSPORTE': 'Transporte',
      'HOSPEDAJE': 'Hospedaje',
      'OTROS': 'Otros'
    };
    return labels[categoria] || categoria;
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado'
    };
    return labels[estado] || estado;
  }

  isImageComprobante(comprobante: string): boolean {
    return (comprobante || '').startsWith('data:image/');
  }

  abrirComprobanteGasto(gasto: Rendicion): void {
    if (!gasto.comprobante) {
      this.snackBar.open('Este gasto no tiene comprobante adjunto', 'Cerrar', { duration: 2200 });
      return;
    }
    if (gasto.comprobante.startsWith('data:image')) {
      // Show image inline by setting the preview
      this.comprobantePreview.set(gasto.comprobante);
      this.snackBar.open('Comprobante cargado en vista previa', 'Cerrar', { duration: 2000 });
    } else if (gasto.comprobante.startsWith('data:') || gasto.comprobante.startsWith('http')) {
      window.open(gasto.comprobante, '_blank', 'noopener,noreferrer');
    } else {
      // Mock filename — show notification since file doesn't exist on server
      this.snackBar.open(`📄 Comprobante: ${gasto.comprobante} (documento adjunto)`, 'Cerrar', { duration: 3000 });
    }
  }

  editarGastoRegistrado(gasto: Rendicion): void {
    if (!gasto?.id || gasto.id === this.rendicionEditandoId()) {
      return;
    }
    // Update URL without full navigation (Angular reuses the component)
    this.router.navigate(['/rendiciones/editar', gasto.id], { replaceUrl: true });
    // Reload gasto data in-place since ngOnInit won't fire again
    this.cargarRendicionParaEdicion(gasto.id);
  }

  getBloquesGastosEdicion(): Array<{ categoria: CategoriaGasto; titulo: string; tope: number; rendido: number; porcentaje: number; exceso: boolean; gastos: Rendicion[] }> {
    const gastos = this.gastosRegistradosSolicitud();
    const resumen = this.getConceptosResumen();
    const mapTituloCategoria: Record<string, CategoriaGasto> = {
      Alojamiento: CategoriaGasto.HOSPEDAJE,
      Alimentación: CategoriaGasto.ALIMENTACION,
      Transporte: CategoriaGasto.TRANSPORTE,
      Otros: CategoriaGasto.OTROS
    };

    return resumen
      .filter(r => r.nombre !== 'Impuestos')
      .map(r => {
        const categoria = mapTituloCategoria[r.nombre] || CategoriaGasto.OTROS;
        const gastosCategoria = gastos.filter(g => g.categoria === categoria);
        const porcentaje = r.presupuestado > 0 ? Math.min(100, (r.rendido / r.presupuestado) * 100) : 0;
        return {
          categoria,
          titulo: r.nombre,
          tope: r.presupuestado,
          rendido: r.rendido,
          porcentaje,
          exceso: r.rendido > r.presupuestado,
          gastos: gastosCategoria
        };
      })
      .filter(b => b.gastos.length > 0);
  }

  filtrarPorCategoria(nombre: string | null): void {
    this.categoriaFiltro.set(this.categoriaFiltro() === nombre ? null : nombre);
  }

  getBloquesGastosEdicionFiltrados(): Array<{ categoria: CategoriaGasto; titulo: string; tope: number; rendido: number; porcentaje: number; exceso: boolean; gastos: Rendicion[] }> {
    const bloques = this.getBloquesGastosEdicion();
    const filtro = this.categoriaFiltro();
    if (!filtro) return bloques;
    return bloques.filter(b => b.titulo === filtro);
  }

  formatFecha(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getMonedaActual(): 'PEN' | 'USD' | 'EUR' {
    return this.rendicionForm.get('moneda')?.value || 'PEN';
  }

  getCurrencySymbol(moneda: 'PEN' | 'USD' | 'EUR' | string): string {
    if (moneda === 'USD') return 'US$';
    if (moneda === 'EUR') return '€';
    return 'S/';
  }

  formatMonto(monto: number): string {
    return Number(monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
