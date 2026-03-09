import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { SolicitudStore } from '../../../../core/stores/solicitud.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ToastService } from '../../../../shared/services/toast.service';
import { CatalogosService, Ciudad, CentroCosto } from '../../../../core/services/catalogos.service';
import { Solicitud, EstadoSolicitud } from '../../../../models';
import { VoiceInputComponent } from '../../../../shared/components/voice-input/voice-input.component';

/**
 * P-SOL-001: Formulario Nueva/Editar Solicitud
 * Permite crear o editar una solicitud de viaje
 */
@Component({
  selector: 'app-formulario-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatChipsModule,
    VoiceInputComponent
  ],
  templateUrl: './formulario-solicitud.component.html',
  styleUrls: ['./formulario-solicitud.component.scss']
})
export class FormularioSolicitudComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private solicitudService = inject(SolicitudService);
  private solicitudStore = inject(SolicitudStore);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);
  private catalogosService = inject(CatalogosService);

  solicitudForm!: FormGroup;
  isEditMode = signal(false);
  solicitudId = signal<string | null>(null);
  loading = signal(false);

  // Catálogos para autocomplete
  ciudades = signal<Ciudad[]>([]);
  centrosCosto = signal<CentroCosto[]>([]);
  motivosComunes = signal<string[]>([]);

  // Filtrados para autocomplete
  ciudadesFiltradas = signal<Ciudad[]>([]);
  centrosCostoFiltrados = signal<CentroCosto[]>([]);

  minDate = new Date();
  autoDistribucion = signal(true);

  private readonly distribucionPorcentajes = {
    montoAlojamiento: 0.40,
    montoAlimentacion: 0.30,
    montoTransporte: 0.15,
    montoImpuestos: 0.10,
    montoOtros: 0.05
  } as const;

  ngOnInit(): void {
    this.loadCatalogos();
    this.initForm();
    this.checkEditMode();
    this.setupAutocompleteFiltros();
  }

  /**
   * Carga los catálogos de opciones
   */
  loadCatalogos(): void {
    this.catalogosService.getCiudadesFrecuentes().subscribe(ciudades => {
      this.ciudades.set(ciudades);
      this.ciudadesFiltradas.set(ciudades);
    });

    this.catalogosService.getCentrosCosto().subscribe(centros => {
      this.centrosCosto.set(centros);
      this.centrosCostoFiltrados.set(centros);
    });

    this.catalogosService.getMotivosComunes().subscribe(motivos => {
      this.motivosComunes.set(motivos);
    });
  }

  /**
   * Configura los filtros de autocomplete
   */
  setupAutocompleteFiltros(): void {
    // Filtro de destino
    this.solicitudForm.get('destino')?.valueChanges.subscribe(valor => {
      if (typeof valor === 'string') {
        this.filtrarCiudades(valor);
      }
    });

    // Filtro de centro de costo
    this.solicitudForm.get('centroCosto')?.valueChanges.subscribe(valor => {
      if (typeof valor === 'string') {
        this.filtrarCentrosCosto(valor);
      }
    });
  }

  /**
   * Filtra ciudades por término de búsqueda
   */
  filtrarCiudades(termino: string): void {
    if (!termino) {
      this.ciudadesFiltradas.set(this.ciudades());
      return;
    }

    const terminoLower = termino.toLowerCase();
    const filtradas = this.ciudades().filter(c =>
      c.nombre.toLowerCase().includes(terminoLower) ||
      c.pais.toLowerCase().includes(terminoLower)
    );
    this.ciudadesFiltradas.set(filtradas);
  }

  /**
   * Filtra centros de costo por término de búsqueda
   */
  filtrarCentrosCosto(termino: string): void {
    if (!termino) {
      this.centrosCostoFiltrados.set(this.centrosCosto());
      return;
    }

    const terminoLower = termino.toLowerCase();
    const filtrados = this.centrosCosto().filter(cc =>
      cc.codigo.toLowerCase().includes(terminoLower) ||
      cc.nombre.toLowerCase().includes(terminoLower)
    );
    this.centrosCostoFiltrados.set(filtrados);
  }

  /**
   * Formatea el display de ciudades en autocomplete
   */
  displayCiudad(ciudad: Ciudad | string): string {
    if (typeof ciudad === 'string') return ciudad;
    return ciudad ? `${ciudad.nombre}, ${ciudad.pais}` : '';
  }

  /**
   * Formatea el display de centro de costo en autocomplete
   */
  displayCentroCosto(cc: CentroCosto | string): string {
    if (typeof cc === 'string') return cc;
    return cc ? `${cc.codigo} - ${cc.nombre}` : '';
  }

  /**
   * Inicializa el formulario reactivo
   */
  initForm(): void {
    this.solicitudForm = this.fb.group({
      // Datos básicos
      destino: ['', [Validators.required, Validators.minLength(3)]],
      motivoViaje: ['', [Validators.required, Validators.minLength(10)]],
      centroCosto: ['', Validators.required],
      fechaSalida: ['', Validators.required],
      fechaRetorno: ['', Validators.required],
      monedaAnticipo: ['PEN', Validators.required],

      // Detalle de viatico
      montoAlojamiento: [0, [Validators.min(0)]],
      montoAlimentacion: [0, [Validators.min(0)]],
      montoTransporte: [0, [Validators.min(0)]],
      montoImpuestos: [0, [Validators.min(0)]],
      montoOtros: [0, [Validators.min(0)]],
      justificacionOtros: ['']
    });

    this.solicitudForm.get('montoOtros')?.valueChanges.subscribe((value) => {
      const controlJustificacion = this.solicitudForm.get('justificacionOtros');
      if (!controlJustificacion) return;

      if ((Number(value) || 0) > 0) {
        controlJustificacion.setValidators([Validators.required, Validators.maxLength(200)]);
      } else {
        controlJustificacion.clearValidators();
        controlJustificacion.setValue('');
      }
      controlJustificacion.updateValueAndValidity({ emitEvent: false });
    });

    this.solicitudForm.get('fechaSalida')?.valueChanges.subscribe(() => this.aplicarDistribucionAutomatica());
    this.solicitudForm.get('fechaRetorno')?.valueChanges.subscribe(() => this.aplicarDistribucionAutomatica());
    this.solicitudForm.get('destino')?.valueChanges.subscribe(() => this.aplicarDistribucionAutomatica());
  }

  /**
   * Verifica si es modo edición
   */
  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode.set(true);
      this.solicitudId.set(id);
      this.cargarSolicitud(id);
    }
  }

  /**
   * Carga una solicitud para editar
   */
  cargarSolicitud(id: string): void {
    this.loading.set(true);
    
    this.solicitudService.getSolicitudById(id).subscribe({
      next: (solicitud) => {
        if (!solicitud) {
          this.toast.error('Solicitud no encontrada');
          this.router.navigate(['/solicitudes']);
          return;
        }
        
        if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
          this.toast.warning('Solo se pueden editar solicitudes en borrador');
          this.router.navigate(['/solicitudes/detalle', id]);
          return;
        }
        
        this.cargarDatosFormulario(solicitud);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar solicitud:', error);
        this.toast.error('Error al cargar la solicitud');
        this.router.navigate(['/solicitudes']);
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga los datos de una solicitud en el formulario
   */
  cargarDatosFormulario(solicitud: Solicitud): void {
    this.autoDistribucion.set(false);
    this.solicitudForm.patchValue({
      destino: solicitud.destino,
      motivoViaje: solicitud.motivoViaje,
      centroCosto: solicitud.centroCosto,
      fechaSalida: new Date(solicitud.fechaSalida),
      fechaRetorno: new Date(solicitud.fechaRetorno),
      monedaAnticipo: solicitud.monedaAnticipo || 'PEN',
      montoTransporte: solicitud.pasajes?.reduce((sum, p) => sum + (Number(p.monto) || 0), 0) || 0,
      montoAlojamiento: solicitud.hospedajes?.reduce((sum, h) => {
        const noches = Number(h.numNoches) || 0;
        const tarifa = Number(h.montoPorNoche) || 0;
        return sum + (noches * tarifa);
      }, 0) || 0
    });
  }

  private aplicarDistribucionAutomatica(): void {
    if (this.isEditMode() || !this.autoDistribucion()) {
      return;
    }

    const totalSugerido = this.getPresupuestoSugerido();
    if (totalSugerido <= 0) {
      return;
    }

    const redondear = (valor: number) => Number(valor.toFixed(2));
    const alojamiento = redondear(totalSugerido * this.distribucionPorcentajes.montoAlojamiento);
    const alimentacion = redondear(totalSugerido * this.distribucionPorcentajes.montoAlimentacion);
    const transporte = redondear(totalSugerido * this.distribucionPorcentajes.montoTransporte);
    const impuestos = redondear(totalSugerido * this.distribucionPorcentajes.montoImpuestos);
    const otros = redondear(totalSugerido - (alojamiento + alimentacion + transporte + impuestos));

    this.solicitudForm.patchValue({
      montoAlojamiento: alojamiento,
      montoAlimentacion: alimentacion,
      montoTransporte: transporte,
      montoImpuestos: impuestos,
      montoOtros: otros,
      justificacionOtros: otros > 0 ? 'Distribucion automatica por concepto' : ''
    }, { emitEvent: false });
  }

  recalcularDistribucionAutomatica(): void {
    this.autoDistribucion.set(true);
    this.aplicarDistribucionAutomatica();
    this.toast.success('Distribucion de viaticos recalculada automaticamente');
  }

  getDiasViaje(): number {
    const salida = this.solicitudForm.get('fechaSalida')?.value;
    const retorno = this.solicitudForm.get('fechaRetorno')?.value;
    if (!salida || !retorno) return 0;

    const f1 = new Date(salida);
    const f2 = new Date(retorno);
    if (Number.isNaN(f1.getTime()) || Number.isNaN(f2.getTime()) || f2 <= f1) {
      return 0;
    }

    const diff = f2.getTime() - f1.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getPresupuestoSugerido(): number {
    const dias = this.getDiasViaje();
    if (dias <= 0) return 0;

    const destino = String(this.solicitudForm.get('destino')?.value || '').toLowerCase();
    const internacional = !destino.includes('peru') && (destino.includes(',') || destino.includes('usa') || destino.includes('chile') || destino.includes('colombia'));
    const tarifaDiaria = internacional ? 350 : 200;
    return dias * tarifaDiaria;
  }

  /**
   * Calcula el presupuesto total
   */
  calcularPresupuestoTotal(): number {
    const formValue = this.solicitudForm.value;
    return (
      (Number(formValue.montoAlojamiento) || 0) +
      (Number(formValue.montoAlimentacion) || 0) +
      (Number(formValue.montoTransporte) || 0) +
      (Number(formValue.montoImpuestos) || 0) +
      (Number(formValue.montoOtros) || 0)
    );
  }

  getCompletionPercentage(): number {
    let completed = 0;

    if (this.isDatosBasicosCompletos()) completed += 1;
    if (this.isViaticoCompletado()) completed += 1;
    if (this.solicitudForm.valid && this.calcularPresupuestoTotal() > 0) completed += 1;

    return Math.round((completed / 3) * 100);
  }

  isDatosBasicosCompletos(): boolean {
    const controls = ['destino', 'motivoViaje', 'centroCosto', 'fechaSalida', 'fechaRetorno'];
    return controls.every((name) => this.solicitudForm.get(name)?.valid);
  }

  isViaticoCompletado(): boolean {
    if (this.calcularPresupuestoTotal() <= 0) return false;

    const montoOtros = Number(this.solicitudForm.get('montoOtros')?.value) || 0;
    if (montoOtros > 0) {
      return !!this.solicitudForm.get('justificacionOtros')?.valid;
    }

    return true;
  }

  /**
   * Guarda como borrador
   */
  guardarBorrador(): void {
    if (!this.solicitudForm.valid) {
      this.toast.warning('Por favor complete los campos requeridos');
      this.solicitudForm.markAllAsTouched();
      return;
    }

    const user = this.authStore.currentUser();
    if (!user) {
      this.toast.error('Usuario no autenticado');
      return;
    }

    this.loading.set(true);
    const formData = this.prepararDatos();

    if (this.isEditMode() && this.solicitudId()) {
      // Actualizar
      this.solicitudService.updateSolicitud(this.solicitudId()!, formData).subscribe({
        next: (solicitud) => {
          this.solicitudStore.updateSolicitud(solicitud.id, solicitud);
          this.toast.success('Solicitud actualizada');
          this.router.navigate(['/solicitudes']);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar solicitud:', error);
          this.toast.error(error);
          this.loading.set(false);
        }
      });
    } else {
      // Crear
      this.solicitudService.createSolicitud(formData, user.id, user.nombreCompleto).subscribe({
        next: (solicitud) => {
          this.solicitudStore.addSolicitud(solicitud);
          this.toast.success('Solicitud creada como borrador');
          this.router.navigate(['/solicitudes']);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al crear solicitud:', error);
          this.toast.error(error);
          this.loading.set(false);
        }
      });
    }
  }

  /**
   * Envía a aprobación
   */
  enviarAAprobacion(): void {
    if (!this.solicitudForm.valid) {
      this.toast.warning('Por favor complete todos los campos requeridos');
      this.solicitudForm.markAllAsTouched();
      return;
    }

    const user = this.authStore.currentUser();
    if (!user) return;

    this.loading.set(true);
    const formData = this.prepararDatos();

    const operacion = this.isEditMode() && this.solicitudId()
      ? this.solicitudService.updateSolicitud(this.solicitudId()!, formData)
      : this.solicitudService.createSolicitud(formData, user.id, user.nombreCompleto);

    operacion.subscribe({
      next: (solicitud) => {
        // Enviar a aprobación
        this.solicitudService.enviarAAprobacion(solicitud.id, user.id, user.nombreCompleto).subscribe({
          next: (solicitudEnviada) => {
            if (this.isEditMode()) {
              this.solicitudStore.updateSolicitud(solicitudEnviada.id, solicitudEnviada);
            } else {
              this.solicitudStore.addSolicitud(solicitudEnviada);
            }
            this.toast.success('Solicitud enviada a aprobación');
            this.router.navigate(['/solicitudes']);
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error al enviar a aprobación:', error);
            this.toast.error(error);
            this.loading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error al guardar solicitud:', error);
        this.toast.error(error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Prepara los datos del formulario
   */
  prepararDatos(): Partial<Solicitud> {
    const formValue = this.solicitudForm.value;
    
    return {
      destino: formValue.destino,
      motivoViaje: formValue.motivoViaje,
      centroCosto: formValue.centroCosto,
      fechaSalida: formValue.fechaSalida,
      fechaRetorno: formValue.fechaRetorno,
      monedaAnticipo: formValue.monedaAnticipo || 'PEN',
      pasajes: [],
      hospedajes: [],
      presupuestoTotal: this.calcularPresupuestoTotal()
    };
  }

  getMonedaAnticipo(): 'PEN' | 'USD' {
    return this.solicitudForm.get('monedaAnticipo')?.value || 'PEN';
  }

  getCurrencySymbol(moneda: 'PEN' | 'USD' | string): string {
    return moneda === 'USD' ? 'US$' : 'S/';
  }

  /**
   * Cancela y vuelve al listado
   */
  cancelar(): void {
    this.router.navigate(['/solicitudes']);
  }

  /**
   * Validación de fechas
   */
  validarFechaRetorno(): boolean {
    const fechaSalida = this.solicitudForm.get('fechaSalida')?.value;
    const fechaRetorno = this.solicitudForm.get('fechaRetorno')?.value;
    
    if (fechaSalida && fechaRetorno) {
      return new Date(fechaRetorno) > new Date(fechaSalida);
    }
    
    return true;
  }

  /**
   * Maneja el texto capturado por voz y lo agrega al campo motivoViaje
   */
  onVoiceTextCaptured(text: string): void {
    const motivoControl = this.solicitudForm.get('motivoViaje');
    if (motivoControl) {
      const currentValue = motivoControl.value || '';
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      motivoControl.setValue(newValue);
      motivoControl.markAsTouched();
    }
  }

  /**
   * Maneja texto de voz para la justificacion de otros gastos
   */
  onJustificacionOtrosCaptured(text: string): void {
    const justificacionControl = this.solicitudForm.get('justificacionOtros');
    if (!justificacionControl) return;

    const currentValue = justificacionControl.value || '';
    const newValue = currentValue ? `${currentValue} ${text}` : text;
    justificacionControl.setValue(newValue);
    justificacionControl.markAsTouched();
  }

  /**
   * Selecciona un destino rápido desde los chips
   */
  seleccionarDestinoRapido(ciudad: string): void {
    this.solicitudForm.patchValue({
      destino: ciudad
    });
    
    // Auto-seleccionar el primer centro de costo si está vacío
    if (!this.solicitudForm.get('centroCosto')?.value && this.centrosCosto().length > 0) {
      this.solicitudForm.patchValue({
        centroCosto: this.centrosCosto()[0].codigo
      });
    }

    this.toast.success(`Destino ${ciudad} seleccionado`);
  }
}
