import { Component, signal, OnInit, inject, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '../../core/stores/auth.store';
import { UserRole } from '../../models';

interface ReporteViaje {
  id: string;
  empleado: string;
  destino: string;
  fechaInicio: Date;
  fechaFin: Date;
  monto: number;
  estado: string;
}

interface ReporteGasto {
  categoria: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

interface MetricaEmpleado {
  empleado: string;
  totalViajes: number;
  totalGastos: number;
  promedio: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="reportes-container">
      <div class="reportes-header">
        <div class="header-content">
          <h1>
            <mat-icon>analytics</mat-icon>
            Reportes y Análisis
          </h1>
          <p class="subtitle">Visualiza métricas y estadísticas de gestión de viajes</p>
        </div>
        
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="exportarReporte()">
            <mat-icon>download</mat-icon>
            Exportar Reporte
          </button>
        </div>
      </div>

      <mat-tab-group class="reportes-tabs" (selectedIndexChange)="onTabChange($event)">
        <!-- Tab 1: Resumen General -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">dashboard</mat-icon>
            <span class="tab-label">Resumen</span>
          </ng-template>
          
          <div class="tab-content">
            <!-- Feedback Jorge 4327: KPIs en Grid 4x4 estilo mosaicos -->
            <mat-grid-list [cols]="getKpiCols()" [rowHeight]="getKpiRowHeight()" gutterSize="16px">
              <!-- Mosaico 1: Total Viajes -->
              <mat-grid-tile>
                <mat-card class="kpi-mosaic primary">
                  <mat-icon class="mosaic-icon">flight_takeoff</mat-icon>
                  <h3 class="titulo">Total Viajes</h3>
                  <p class="mosaic-value">{{ totalViajes() }}</p>
                  <span class="mosaic-trend positive">
                    <mat-icon>trending_up</mat-icon>
                    +12% vs mes anterior
                  </span>
                </mat-card>
              </mat-grid-tile>

              <!-- Mosaico 2: Gasto Total -->
              <mat-grid-tile>
                <mat-card class="kpi-mosaic success">
                  <mat-icon class="mosaic-icon">attach_money</mat-icon>
                  <h3 class="titulo">Gasto Total</h3>
                  <p class="mosaic-value monto-float-right">S/ {{ totalGastos() | number:'1.2-2' }}</p>
                  <span class="mosaic-trend negative">
                    <mat-icon>trending_down</mat-icon>
                    -5% vs mes anterior
                  </span>
                </mat-card>
              </mat-grid-tile>

              <!-- Mosaico 3: Rendiciones Pendientes -->
              <mat-grid-tile>
                <mat-card class="kpi-mosaic warning">
                  <mat-icon class="mosaic-icon">receipt</mat-icon>
                  <h3 class="titulo">Rendiciones Pendientes</h3>
                  <p class="mosaic-value">{{ rendicionesPendientes() }}</p>
                  <span class="mosaic-info">Requiere atención</span>
                </mat-card>
              </mat-grid-tile>

              <!-- Mosaico 4: Tiempo Promedio -->
              <mat-grid-tile>
                <mat-card class="kpi-mosaic info">
                  <mat-icon class="mosaic-icon">schedule</mat-icon>
                  <h3 class="titulo">Tiempo Promedio Aprobación</h3>
                  <p class="mosaic-value">{{ tiempoPromedioAprobacion() }} días</p>
                  <span class="mosaic-info">Últimos 30 días</span>
                </mat-card>
              </mat-grid-tile>
            </mat-grid-list>

            <!-- Gráfico de gastos por categoría -->
            <mat-card class="chart-card">
              <h2>
                <mat-icon>pie_chart</mat-icon>
                Gastos por Categoría
              </h2>
              <div class="chart-container">
                @for (gasto of gastosPorCategoria(); track gasto.categoria; let i = $index) {
                  <div class="chart-bar-item">
                    <div class="bar-label">
                      <span>{{ gasto.categoria }}</span>
                      <strong>S/ {{ gasto.monto | number:'1.2-2' }}</strong>
                    </div>
                    <div class="bar-container">
                      <div 
                        class="bar-fill" 
                        [style.width.%]="gasto.porcentaje"
                        [class]="'bar-' + (i % 4)"
                      ></div>
                    </div>
                    <span class="bar-percentage">{{ gasto.porcentaje }}%</span>
                  </div>
                }
              </div>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Viajes por Período -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">date_range</mat-icon>
            <span class="tab-label">Viajes por Período</span>
          </ng-template>
          
          <div class="tab-content">
            <mat-card class="filter-card">
              <div class="filter-row">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha Inicio</mat-label>
                  <input matInput [matDatepicker]="pickerInicio" [(ngModel)]="fechaInicio">
                  <mat-datepicker-toggle matSuffix [for]="pickerInicio"></mat-datepicker-toggle>
                  <mat-datepicker #pickerInicio></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha Fin</mat-label>
                  <input matInput [matDatepicker]="pickerFin" [(ngModel)]="fechaFin">
                  <mat-datepicker-toggle matSuffix [for]="pickerFin"></mat-datepicker-toggle>
                  <mat-datepicker #pickerFin></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Estado</mat-label>
                  <mat-select [(ngModel)]="estadoFiltro">
                    <mat-option value="all">Todos</mat-option>
                    <mat-option value="aprobado">Aprobado</mat-option>
                    <mat-option value="pendiente">Pendiente</mat-option>
                    <mat-option value="rechazado">Rechazado</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                  <mat-icon>filter_alt</mat-icon>
                  Filtrar
                </button>
              </div>
            </mat-card>

            <mat-card class="viajes-mosaicos-card">
              <h2 class="titulo">
                <mat-icon>flight</mat-icon>
                Lista de Viajes (Visualización Mosaicos)
              </h2>
              <!-- Feedback Jorge 4327: Grid 4x4 de viajes en lugar de tabla -->
              <mat-grid-list [cols]="getViajesCols()" [rowHeight]="getViajesRowHeight()" gutterSize="14px">
                @for (viaje of viajesFiltrados; track viaje.id) {
                  <mat-grid-tile>
                    <mat-card class="viaje-mosaic-item">
                      <mat-icon class="viaje-icon">flight</mat-icon>
                      <h4 class="titulo">{{ viaje.destino }}</h4>
                      <p class="viaje-empleado">{{ viaje.empleado }}</p>
                      <div class="viaje-fechas">
                        {{ viaje.fechaInicio | date:'dd/MM' }} - {{ viaje.fechaFin | date:'dd/MM' }}
                      </div>
                      <div class="viaje-monto monto-float-right">
                        S/ {{ viaje.monto | number:'1.2-2' }}
                      </div>
                      <span [class]="'badge badge-' + viaje.estado.toLowerCase()">
                        {{ viaje.estado }}
                      </span>
                    </mat-card>
                  </mat-grid-tile>
                }
              </mat-grid-list>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Métricas por Empleado (Admin/Aprobadores) -->
        @if (canViewEmployeeMetrics()) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">people</mat-icon>
              <span class="tab-label">Por Empleado</span>
            </ng-template>
            
            <div class="tab-content">
              <!-- MÓDULO 5: Filtros Avanzados para Métricas de Empleados -->
              <mat-card class="filter-card">
                <h3 class="filter-title">
                  <mat-icon>filter_alt</mat-icon>
                  Filtros Avanzados
                </h3>
                <form [formGroup]="filtrosEmpleadosForm" class="filtros-empleados-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Empleado</mat-label>
                    <mat-select formControlName="empleado" multiple>
                      @for (emp of empleadosDisponibles(); track emp) {
                        <mat-option [value]="emp">{{ emp }}</mat-option>
                      }
                    </mat-select>
                    <mat-icon matPrefix>person</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Período</mat-label>
                    <mat-date-range-input [rangePicker]="pickerEmpleados">
                      <input matStartDate formControlName="fechaInicio" placeholder="Fecha inicio">
                      <input matEndDate formControlName="fechaFin" placeholder="Fecha fin">
                    </mat-date-range-input>
                    <mat-datepicker-toggle matSuffix [for]="pickerEmpleados"></mat-datepicker-toggle>
                    <mat-date-range-picker #pickerEmpleados></mat-date-range-picker>
                    <mat-icon matPrefix>date_range</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Monto Mínimo</mat-label>
                    <input matInput type="number" formControlName="montoMin" placeholder="0.00">
                    <span matPrefix>S/&nbsp;</span>
                    <mat-icon matPrefix>attach_money</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Monto Máximo</mat-label>
                    <input matInput type="number" formControlName="montoMax" placeholder="999,999.00">
                    <span matPrefix>S/&nbsp;</span>
                    <mat-icon matPrefix>attach_money</mat-icon>
                  </mat-form-field>

                  <div class="filtros-actions">
                    <button mat-stroked-button type="button" (click)="limpiarFiltrosEmpleados()">
                      <mat-icon>clear</mat-icon>
                      Limpiar
                    </button>
                    <button mat-raised-button color="primary" type="button" (click)="aplicarFiltrosEmpleados()">
                      <mat-icon>search</mat-icon>
                      Aplicar Filtros
                    </button>
                  </div>
                </form>
              </mat-card>

              <!-- Métricas Filtradas -->
              <mat-card class="metricas-empleados-card">
                <h2 class="titulo">
                  <mat-icon>people</mat-icon>
                  Métricas por Empleado
                  @if (metricasEmpleadosFiltradas().length !== metricasEmpleados().length) {
                    <span class="filtro-badge">{{ metricasEmpleadosFiltradas().length }} de {{ metricasEmpleados().length }}</span>
                  }
                </h2>

                @if (metricasEmpleadosFiltradas().length === 0) {
                  <div class="empty-state">
                    <mat-icon>person_off</mat-icon>
                    <h3>No se encontraron empleados</h3>
                    <p>Ajusta los filtros para ver resultados</p>
                  </div>
                } @else {
                  <!-- Grid de métricas con visualización mejorada -->
                  <div class="metricas-grid">
                    @for (metrica of metricasEmpleadosFiltradas(); track metrica.empleado) {
                      <mat-card class="metrica-empleado-card">
                        <div class="empleado-header">
                          <div class="empleado-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div class="empleado-info">
                            <h4>{{ metrica.empleado }}</h4>
                            <span class="empleado-viajes">{{ metrica.totalViajes }} viaje(s) realizados</span>
                          </div>
                        </div>

                        <div class="metricas-detalle">
                          <!-- Total Gastos con barra de progreso -->
                          <div class="metrica-item">
                            <div class="metrica-label">
                              <span>Total Gastos</span>
                              <strong>S/ {{ metrica.totalGastos | number:'1.2-2' }}</strong>
                            </div>
                            <div class="progress-bar">
                              <div 
                                class="progress-fill" 
                                [style.width.%]="calcularPorcentajeGasto(metrica.totalGastos)"
                              ></div>
                            </div>
                          </div>

                          <!-- Promedio por viaje -->
                          <div class="metrica-item">
                            <div class="metrica-label">
                              <span>Promedio por viaje</span>
                              <strong>S/ {{ metrica.promedio | number:'1.2-2' }}</strong>
                            </div>
                            <div class="progress-bar secondary">
                              <div 
                                class="progress-fill" 
                                [style.width.%]="calcularPorcentajePromedio(metrica.promedio)"
                              ></div>
                            </div>
                          </div>

                          <!-- Indicador de eficiencia -->
                          <div class="eficiencia-badge" [class]="getEficienciaClass(metrica.promedio)">
                            <mat-icon>{{ getEficienciaIcon(metrica.promedio) }}</mat-icon>
                            <span>{{ getEficienciaLabel(metrica.promedio) }}</span>
                          </div>
                        </div>
                      </mat-card>
                    }
                  </div>
                }
              </mat-card>

              <!-- Resumen estadístico -->
              @if (metricasEmpleadosFiltradas().length > 0) {
                <mat-card class="resumen-estadistico">
                  <h3>
                    <mat-icon>analytics</mat-icon>
                    Resumen Estadístico
                  </h3>
                  <div class="estadisticas-grid">
                    <div class="estadistica-item">
                      <mat-icon>flight</mat-icon>
                      <div class="estadistica-content">
                        <span class="estadistica-label">Total de Viajes</span>
                        <span class="estadistica-value">{{ totalViajesEmpleados() }}</span>
                      </div>
                    </div>
                    <div class="estadistica-item">
                      <mat-icon>payments</mat-icon>
                      <div class="estadistica-content">
                        <span class="estadistica-label">Gasto Total</span>
                        <span class="estadistica-value">S/ {{ totalGastosEmpleados() | number:'1.2-2' }}</span>
                      </div>
                    </div>
                    <div class="estadistica-item">
                      <mat-icon>trending_up</mat-icon>
                      <div class="estadistica-content">
                        <span class="estadistica-label">Promedio General</span>
                        <span class="estadistica-value">S/ {{ promedioGeneralEmpleados() | number:'1.2-2' }}</span>
                      </div>
                    </div>
                    <div class="estadistica-item">
                      <mat-icon>person_outline</mat-icon>
                      <div class="estadistica-content">
                        <span class="estadistica-label">Empleados Activos</span>
                        <span class="estadistica-value">{{ metricasEmpleadosFiltradas().length }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card>
              }
            </div>
          </mat-tab>
        }

        <!-- Tab 4: Exportación y Herramientas -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            <span class="tab-label">Exportar</span>
          </ng-template>
          
          <div class="tab-content">
            <div class="export-grid">
              <mat-card class="export-card">
                <mat-icon class="export-icon">picture_as_pdf</mat-icon>
                <h3>Exportar PDF</h3>
                <p>Genera un reporte completo en formato PDF</p>
                <button mat-raised-button color="primary" (click)="exportarPDF()">
                  <mat-icon>download</mat-icon>
                  Descargar PDF
                </button>
              </mat-card>

              <mat-card class="export-card">
                <mat-icon class="export-icon">table_chart</mat-icon>
                <h3>Exportar Excel</h3>
                <p>Descarga datos en formato Excel para análisis</p>
                <button mat-raised-button color="primary" (click)="exportarExcel()">
                  <mat-icon>download</mat-icon>
                  Descargar Excel
                </button>
              </mat-card>

              <mat-card class="export-card">
                <mat-icon class="export-icon">email</mat-icon>
                <h3>Enviar por Email</h3>
                <p>Envía el reporte a tu correo electrónico</p>
                <button mat-raised-button color="primary" (click)="enviarEmail()">
                  <mat-icon>send</mat-icon>
                  Enviar Reporte
                </button>
              </mat-card>

              <mat-card class="export-card">
                <mat-icon class="export-icon">schedule</mat-icon>
                <h3>Programar Reporte</h3>
                <p>Configura reportes automáticos periódicos</p>
                <button mat-raised-button color="primary" (click)="programarReporte()">
                  <mat-icon>schedule</mat-icon>
                  Configurar
                </button>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .reportes-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;

      // Normaliza todos los iconos de Reportes y Analisis para evitar cortes/desalineacion.
      mat-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        vertical-align: middle;
        overflow: visible;
        text-rendering: geometricPrecision;
        -webkit-font-smoothing: antialiased;
      }
    }

    .reportes-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;

      .header-content {
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--claro-text-primary);

          mat-icon {
            color: var(--claro-primary);
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        .subtitle {
          font-size: 14px;
          color: var(--claro-text-secondary);
          margin: 0;
        }
      }

      .header-actions {
        button {
          height: 44px;
        }
      }
    }

    .reportes-tabs {
      ::ng-deep .mat-mdc-tab-labels {
        background: white;
        border-radius: 8px 8px 0 0;
      }

      .tab-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .tab-label {
        font-weight: 500;
      }
    }

    .tab-content {
      padding: 24px;
      background: #f5f5f5;
      min-height: 600px;
    }

    .viajes-mosaicos-card {
      overflow: hidden;
    }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;

      .kpi-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        flex-shrink: 0;

        &.primary { color: var(--claro-primary); }
        &.success { color: #4CAF50; }
        &.warning { color: #FF9800; }
        &.info { color: #2196F3; }
      }

      .kpi-content {
        flex: 1;

        h3 {
          font-size: 13px;
          font-weight: 500;
          color: var(--claro-text-secondary);
          margin: 0 0 4px 0;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--claro-text-primary);
          margin: 0 0 4px 0;
        }

        .kpi-trend, .kpi-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }

          &.positive {
            color: #4CAF50;
          }

          &.negative {
            color: #F44336;
          }

          &.kpi-info {
            color: var(--claro-text-tertiary);
          }
        }
      }
    }

    /* Chart Card */
    .chart-card {
      padding: 24px !important;
      margin-bottom: 24px;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 20px 0;
      }

      .chart-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chart-bar-item {
        display: grid;
        grid-template-columns: 200px 1fr 60px;
        align-items: center;
        gap: 12px;

        .bar-label {
          display: flex;
          flex-direction: column;
          gap: 2px;

          span {
            font-size: 13px;
            color: var(--claro-text-secondary);
          }

          strong {
            font-size: 15px;
            color: var(--claro-text-primary);
          }
        }

        .bar-container {
          height: 32px;
          background: #E0E0E0;
          border-radius: 16px;
          overflow: hidden;
          position: relative;

          .bar-fill {
            height: 100%;
            border-radius: 16px;
            transition: width 0.6s ease;

            &.bar-0 { background: linear-gradient(90deg, #E30613 0%, #FF4444 100%); }
            &.bar-1 { background: linear-gradient(90deg, #2196F3 0%, #64B5F6 100%); }
            &.bar-2 { background: linear-gradient(90deg, #4CAF50 0%, #81C784 100%); }
            &.bar-3 { background: linear-gradient(90deg, #FF9800 0%, #FFB74D 100%); }
          }
        }

        .bar-percentage {
          text-align: right;
          font-size: 14px;
          font-weight: 600;
          color: var(--claro-text-primary);
        }
      }
    }

    /* Filter Card */
    .filter-card {
      padding: 20px !important;
      margin-bottom: 24px;

      .filter-row {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        flex-wrap: wrap;

        mat-form-field {
          flex: 1;
          min-width: 200px;
        }

        button {
          height: 56px;
          margin-top: 0;
        }
      }
    }

    /* Table Card */
    .table-card {
      padding: 24px !important;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 20px 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .reportes-table {
        width: 100%;
        background: white;

        th {
          background: #f5f5f5;
          font-weight: 600;
          color: var(--claro-text-primary);
        }

        td {
          color: var(--claro-text-secondary);
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;

          &.badge-aprobado {
            background: #E8F5E9;
            color: #2E7D32;
          }

          &.badge-pendiente {
            background: #FFF3E0;
            color: #E65100;
          }

          &.badge-rechazado {
            background: #FFEBEE;
            color: #C62828;
          }
        }

        .empleado-cell {
          display: flex;
          align-items: center;
          gap: 8px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: var(--claro-primary);
          }
        }
      }
    }

    /* Export Grid */
    .export-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .export-card {
      padding: 24px !important;
      text-align: center;

      .export-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--claro-primary);
        margin: 0 auto 16px;
      }

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: var(--claro-text-secondary);
        margin: 0 0 20px 0;
      }

      button {
        width: 100%;
      }
    }

    /* MÓDULO 5: Estilos para filtros avanzados de empleados */
    .filtros-empleados-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 16px;

      mat-form-field {
        width: 100%;
      }

      .filtros-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;

        button {
          min-width: 140px;
        }
      }
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: var(--claro-primary);

      mat-icon {
        font-size: 20px;
      }
    }

    .metricas-empleados-card {
      padding: 24px !important;
      margin-top: 20px;

      .titulo {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;

        .filtro-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }
      }
    }

    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .metrica-empleado-card {
      padding: 20px !important;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #667eea;
      }

      .empleado-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e0e0e0;

        .empleado-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            color: white;
            font-size: 28px;
            width: 28px;
            height: 28px;
          }
        }

        .empleado-info {
          flex: 1;

          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--claro-text-primary);
          }

          .empleado-viajes {
            font-size: 12px;
            color: var(--claro-text-secondary);
          }
        }
      }

      .metricas-detalle {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .metrica-item {
          .metrica-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            span {
              font-size: 13px;
              color: var(--claro-text-secondary);
            }

            strong {
              font-size: 15px;
              color: var(--claro-text-primary);
            }
          }

          .progress-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            position: relative;

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 4px;
              transition: width 0.6s ease;
            }

            &.secondary .progress-fill {
              background: linear-gradient(90deg, #4CAF50 0%, #81C784 100%);
            }
          }
        }

        .eficiencia-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;

          &.eficiente {
            background: #E8F5E9;
            color: #2E7D32;

            mat-icon {
              color: #2E7D32;
            }
          }

          &.moderado {
            background: #FFF3E0;
            color: #E65100;

            mat-icon {
              color: #E65100;
            }
          }

          &.alto {
            background: #FFEBEE;
            color: #C62828;

            mat-icon {
              color: #C62828;
            }
          }

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    .resumen-estadistico {
      padding: 24px !important;
      margin-top: 20px;
      background: linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%);
      border: 2px solid #e8ecff;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 20px 0;
        color: var(--claro-primary);

        mat-icon {
          font-size: 22px;
        }
      }

      .estadisticas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .estadistica-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #667eea;
          }

          .estadistica-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;

            .estadistica-label {
              font-size: 12px;
              color: var(--claro-text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .estadistica-value {
              font-size: 18px;
              font-weight: 700;
              color: var(--claro-text-primary);
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #9E9E9E;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: var(--claro-text-primary);
      }

      p {
        font-size: 14px;
        color: var(--claro-text-secondary);
        margin: 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .reportes-container {
        padding: 10px;
      }

      .reportes-header {
        flex-direction: column;
        align-items: stretch;

        .header-content {
          h1 {
            font-size: 32px;
            line-height: 1.2;
            gap: 8px;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
            }
          }

          .subtitle {
            font-size: 12px;
          }
        }

        .header-actions {
          button {
            width: 100%;
            height: 40px;
            font-size: 13px;
          }
        }
      }

      .reportes-tabs {
        ::ng-deep .mat-mdc-tab-label-container {
          background: #fff;
          border-radius: 10px;
          border: 1px solid #eceff3;
          padding: 0 2px;
        }

        ::ng-deep .mat-mdc-tab {
          min-width: 0;
          padding: 0 10px;
          height: 46px;
        }

        ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
          font-size: 11px;
          font-weight: 600;
        }

        .tab-icon {
          margin-right: 0;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .tab-content {
        padding: 12px;
        min-height: auto;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .kpi-mosaic {
        padding: 14px;
        border-radius: 10px;

        .mosaic-icon {
          font-size: 34px;
          width: 34px;
          height: 34px;
          margin-bottom: 8px;
        }

        h3 {
          font-size: 11px;
          margin-bottom: 6px;
        }

        .mosaic-value {
          font-size: 31px;
          margin-bottom: 6px;
        }

        .mosaic-trend,
        .mosaic-info {
          font-size: 11px;
        }
      }

      .chart-card,
      .filter-card,
      .viajes-mosaicos-card,
      .metricas-empleados-card,
      .resumen-estadistico,
      .export-card {
        padding: 14px !important;
      }

      .chart-bar-item {
        grid-template-columns: 1fr;
        gap: 8px;

        .bar-label {
          flex-direction: row;
          justify-content: space-between;

          span,
          strong {
            font-size: 12px;
          }
        }

        .bar-percentage {
          text-align: left;
          font-size: 12px;
        }
      }

      .filter-card .filter-row {
        flex-direction: column;

        mat-form-field, button {
          width: 100%;
        }
      }

      .tab-label {
        display: none;
      }

      .export-grid {
        grid-template-columns: 1fr;
      }

      .viaje-mosaic-item {
        padding: 12px;

        .viaje-icon {
          font-size: 26px;
          width: 26px;
          height: 26px;
          margin-bottom: 6px;
        }

        h4 {
          font-size: 13px;
        }

        .viaje-monto {
          font-size: 13px;
        }
      }
    }

    @media (max-width: 420px) {
      .reportes-tabs {
        ::ng-deep .mat-mdc-tab {
          padding: 0 6px;
        }
      }

      .reportes-header .header-content h1 {
        font-size: 26px;
      }
    }

    // ========================================================
    // Feedback Jorge 4327: Estilos para mosaicos 4x4
    // ========================================================
    .titulo {
      font-weight: 700;
      line-height: 1.5;
    }

    .monto-float-right {
      float: right;
      font-weight: 700;
    }

    .kpi-mosaic {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      &.primary {
        background: linear-gradient(135deg, #D32F2F 0%, #E91E63 100%);
        color: white;
      }

      &.success {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
        color: white;
      }

      &.warning {
        background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%);
        color: white;
      }

      &.info {
        background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%);
        color: white;
      }

      .mosaic-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.9;
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      }

      .mosaic-value {
        font-size: 36px;
        font-weight: 700;
        margin: 0 0 8px 0;
        line-height: 1;
      }

      .mosaic-trend, .mosaic-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        opacity: 0.85;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .viajes-mosaicos-card {
      padding: 24px;
      margin-top: 24px;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
      }
    }

    .viaje-mosaic-item {
      width: 100%;
      height: 100%;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      .viaje-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
        color: #2196f3;
        margin-bottom: 8px;
      }

      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        text-align: center;
      }

      .viaje-empleado {
        font-size: 12px;
        color: var(--claro-text-secondary);
        margin: 0 0 8px 0;
        text-align: center;
      }

      .viaje-fechas {
        font-size: 11px;
        color: var(--claro-text-tertiary);
        margin-bottom: 8px;
      }

      .viaje-monto {
        font-size: 14px;
        font-weight: 700;
        color: #4CAF50;
        text-align: center;
        width: 100%;
        margin-bottom: 8px;
      }

      .badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;

        &.badge-aprobado {
          background-color: #E8F5E9;
          color: #2E7D32;
        }

        &.badge-pendiente {
          background-color: #FFF3E0;
          color: #E65100;
        }

        &.badge-rechazado {
          background-color: #FFEBEE;
          color: #C62828;
        }
      }
    }

    .metrica-empleado-mosaic {
      width: 100%;
      height: 100%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border: 2px solid #e1e4e8;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        border-color: #2196f3;
      }

      .empleado-icon {
        font-size: 42px;
        width: 42px;
        height: 42px;
        color: #2196f3;
        margin-bottom: 12px;
      }

      h4 {
        margin: 0 0 16px 0;
        font-size: 15px;
        text-align: center;
      }

      .metrica-stats {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .stat-label {
            font-size: 12px;
            color: var(--claro-text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stat-value {
            font-size: 14px;
            font-weight: 700;
            color: var(--claro-text-primary);
          }
        }
      }
    }
  `]
})
export class ReportesComponent implements OnInit {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  
  currentUser = this.authStore.currentUser;
  viewportWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1366);
  
  // Computed para verificar si puede ver métricas de empleados (no aplica para rol EMPLEADO)
  canViewEmployeeMetrics = () => {
    const rol = this.currentUser()?.rol;
    // Todos excepto empleados comunes pueden ver métricas de empleados
    return rol !== 'EMPLEADO';
  };
  
  // Filtros
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  estadoFiltro = 'all';

  // MÓDULO 5: FormGroup para filtros avanzados de empleados
  filtrosEmpleadosForm: FormGroup;

  // KPIs
  totalViajes = signal(45);
  totalGastos = signal(125430.50);
  rendicionesPendientes = signal(8);
  tiempoPromedioAprobacion = signal(2.3);

  // Datos para gráficos
  gastosPorCategoria = signal<ReporteGasto[]>([
    { categoria: 'Transporte', cantidad: 120, monto: 45230, porcentaje: 36 },
    { categoria: 'Alojamiento', cantidad: 85, monto: 38450, porcentaje: 31 },
    { categoria: 'Alimentación', cantidad: 150, monto: 25840, porcentaje: 21 },
    { categoria: 'Otros', cantidad: 45, monto: 15910, porcentaje: 12 }
  ]);

  // Datos de viajes
  viajes: ReporteViaje[] = [
    { id: 'V-2026-001', empleado: 'Juan Pérez', destino: 'Lima', fechaInicio: new Date(2026, 2, 1), fechaFin: new Date(2026, 2, 3), monto: 2850, estado: 'Aprobado' },
    { id: 'V-2026-002', empleado: 'María García', destino: 'Arequipa', fechaInicio: new Date(2026, 2, 5), fechaFin: new Date(2026, 2, 7), monto: 3200, estado: 'Aprobado' },
    { id: 'V-2026-003', empleado: 'Carlos López', destino: 'Cusco', fechaInicio: new Date(2026, 2, 10), fechaFin: new Date(2026, 2, 12), monto: 4100, estado: 'Pendiente' },
    { id: 'V-2026-004', empleado: 'Ana Martínez', destino: 'Trujillo', fechaInicio: new Date(2026, 2, 15), fechaFin: new Date(2026, 2, 17), monto: 2650, estado: 'Aprobado' },
    { id: 'V-2026-005', empleado: 'Pedro Sánchez', destino: 'Piura', fechaInicio: new Date(2026, 2, 20), fechaFin: new Date(2026, 2, 22), monto: 3450, estado: 'Rechazado' },
  ];

  viajesFiltrados: ReporteViaje[] = this.viajes;

  // MÓDULO 5: Métricas por empleado con signal
  metricasEmpleados = signal<MetricaEmpleado[]>([
    { empleado: 'Juan Pérez', totalViajes: 8, totalGastos: 22400, promedio: 2800 },
    { empleado: 'María García', totalViajes: 12, totalGastos: 38450, promedio: 3204 },
    { empleado: 'Carlos López', totalViajes: 6, totalGastos: 18230, promedio: 3038 },
    { empleado: 'Ana Martínez', totalViajes: 10, totalGastos: 28900, promedio: 2890 },
    { empleado: 'Pedro Sánchez', totalViajes: 9, totalGastos: 17450, promedio: 1939 },
    { empleado: 'Laura Rodríguez', totalViajes: 7, totalGastos: 25600, promedio: 3657 },
    { empleado: 'Roberto Torres', totalViajes: 5, totalGastos: 14800, promedio: 2960 },
    { empleado: 'Carmen Flores', totalViajes: 11, totalGastos: 32100, promedio: 2918 },
  ]);

  // MÓDULO 5: Computed signals para filtrado de empleados
  empleadosDisponibles = computed(() => {
    return this.metricasEmpleados().map(m => m.empleado).sort();
  });

  metricasEmpleadosFiltradas = computed(() => {
    const valores = this.filtrosEmpleadosForm?.value;
    if (!valores) return this.metricasEmpleados();

    return this.metricasEmpleados().filter(metrica => {
      // Filtro por empleado
      if (valores.empleado && valores.empleado.length > 0) {
        if (!valores.empleado.includes(metrica.empleado)) return false;
      }

      // Filtro por monto mínimo
      if (valores.montoMin !== null && metrica.totalGastos < valores.montoMin) {
        return false;
      }

      // Filtro por monto máximo
      if (valores.montoMax !== null && metrica.totalGastos > valores.montoMax) {
        return false;
      }

      // TODO: Filtro por período (requeriría datos de fecha en MetricaEmpleado)
      
      return true;
    });
  });

  // MÓDULO 5: Computed signals para estadísticas
  totalViajesEmpleados = computed(() => {
    return this.metricasEmpleadosFiltradas().reduce((sum, m) => sum + m.totalViajes, 0);
  });

  totalGastosEmpleados = computed(() => {
    return this.metricasEmpleadosFiltradas().reduce((sum, m) => sum + m.totalGastos, 0);
  });

  promedioGeneralEmpleados = computed(() => {
    const filtradas = this.metricasEmpleadosFiltradas();
    if (filtradas.length === 0) return 0;
    return this.totalGastosEmpleados() / this.totalViajesEmpleados();
  });

  constructor() {
    // MÓDULO 5: Inicializar formulario de filtros
    this.filtrosEmpleadosForm = this.fb.group({
      empleado: [[]],
      fechaInicio: [null],
      fechaFin: [null],
      montoMin: [null],
      montoMax: [null]
    });
  }

  // Columnas de tablas
  displayedColumns = ['id', 'empleado', 'destino', 'periodo', 'monto', 'estado'];
  empleadoColumns = ['empleado', 'totalViajes', 'totalGastos', 'promedio'];

  ngOnInit() {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    this.fechaFin = hoy;
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  getKpiCols(): number {
    const width = this.viewportWidth();
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 4;
  }

  getKpiRowHeight(): string {
    const width = this.viewportWidth();
    if (width < 640) return '170px';
    if (width < 1024) return '180px';
    return '200px';
  }

  getViajesCols(): number {
    const width = this.viewportWidth();
    if (width < 768) return 1;
    if (width < 1200) return 2;
    return 4;
  }

  getViajesRowHeight(): string {
    const width = this.viewportWidth();
    if (width < 640) return '170px';
    if (width < 1024) return '175px';
    return '180px';
  }

  onTabChange(index: number) {
    console.log('Tab cambió a:', index);
  }

  aplicarFiltros() {
    console.log('Aplicando filtros:', {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      estado: this.estadoFiltro
    });
    
    // Filtrar viajes según criterios
    this.viajesFiltrados = this.viajes.filter(viaje => {
      let cumpleFechas = true;
      let cumpleEstado = true;

      // Filtro por fechas
      if (this.fechaInicio && this.fechaFin) {
        cumpleFechas = viaje.fechaInicio >= this.fechaInicio && viaje.fechaFin <= this.fechaFin;
      }

      // Filtro por estado
      if (this.estadoFiltro !== 'all') {
        cumpleEstado = viaje.estado.toLowerCase() === this.estadoFiltro.toLowerCase();
      }

      return cumpleFechas && cumpleEstado;
    });
  }

  exportarReporte() {
    alert('Exportando reporte general...');
  }

  exportarPDF() {
    alert('Generando PDF... (Funcionalidad en desarrollo)');
  }

  exportarExcel() {
    alert('Generando Excel... (Funcionalidad en desarrollo)');
  }

  enviarEmail() {
    alert('Enviando reporte por email... (Funcionalidad en desarrollo)');
  }

  programarReporte() {
    alert('Configurar reportes automáticos... (Funcionalidad en desarrollo)');
  }

  // ========== MÓDULO 5: Métodos para filtros avanzados de empleados ==========

  aplicarFiltrosEmpleados(): void {
    // El filtrado se hace automáticamente mediante computed signals
    console.log('Filtros aplicados:', this.filtrosEmpleadosForm.value);
  }

  limpiarFiltrosEmpleados(): void {
    this.filtrosEmpleadosForm.reset({
      empleado: [],
      fechaInicio: null,
      fechaFin: null,
      montoMin: null,
      montoMax: null
    });
  }

  // ========== MÓDULO 5: Métodos para cálculo de visualización ==========

  calcularPorcentajeGasto(monto: number): number {
    const maxGasto = Math.max(...this.metricasEmpleados().map(m => m.totalGastos));
    return (monto / maxGasto) * 100;
  }

  calcularPorcentajePromedio(promedio: number): number {
    const maxPromedio = Math.max(...this.metricasEmpleados().map(m => m.promedio));
    return (promedio / maxPromedio) * 100;
  }

  getEficienciaClass(promedio: number): string {
    if (promedio <= 2500) return 'eficiente';
    if (promedio <= 3200) return 'moderado';
    return 'alto';
  }

  getEficienciaIcon(promedio: number): string {
    if (promedio <= 2500) return 'thumb_up';
    if (promedio <= 3200) return 'thumbs_up_down';
    return 'warning';
  }

  getEficienciaLabel(promedio: number): string {
    if (promedio <= 2500) return 'Eficiente';
    if (promedio <= 3200) return 'Moderado';
    return 'Alto Gasto';
  }
}
