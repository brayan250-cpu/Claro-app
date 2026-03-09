import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * Componente de Cámara Web
 * Captura fotos en tiempo real usando getUserMedia API
 */
@Component({
  selector: 'app-camera-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="camera-dialog">
      <div class="camera-header">
        <h2>Capturar Comprobante</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="camera-container">
        <!-- Wrapper de centrado para video -->
        <div class="media-wrapper" [class.hidden]="loading() || error() || fotocapturada()">
          <video 
            #videoElement 
            autoplay 
            playsinline 
            class="camera-video">
          </video>
        </div>

        <!-- Wrapper de centrado para imagen capturada -->
        @if (fotocapturada()) {
          <div class="media-wrapper">
            <img [src]="fotocapturada()" alt="Foto capturada" class="captured-image" />
          </div>
        }

        <!-- Overlays según estado -->
        @if (loading()) {
          <div class="camera-loading">
            <mat-spinner diameter="60"></mat-spinner>
            <p>Iniciando cámara...</p>
          </div>
        }

        @if (error()) {
          <div class="camera-error">
            <mat-icon>error_outline</mat-icon>
            <h3>No se puede acceder a la cámara</h3>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="intentarNuevamente()">
              <mat-icon>refresh</mat-icon>
              Intentar nuevamente
            </button>
          </div>
        }

        @if (!loading() && !error() && !fotocapturada()) {
          <div class="camera-overlay">
            <div class="camera-frame">
              <div class="frame-corners">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
              </div>
            </div>
            <div class="camera-hint">
              <mat-icon>center_focus_strong</mat-icon>
              <p>Alinee el comprobante dentro del recuadro</p>
            </div>
          </div>
        }

        @if (fotocapturada()) {
          <div class="capture-confirmation">
            <div class="confirmation-badge">
              <mat-icon>check_circle</mat-icon>
              <span>Comprobante capturado</span>
            </div>
          </div>
        }
      </div>

      <div class="camera-actions">
        @if (!fotocapturada() && !loading() && !error()) {
          <button mat-raised-button color="primary" class="capture-btn" (click)="capturarFoto()">
            <mat-icon>camera</mat-icon>
            Capturar Foto
          </button>
        }

        @if (fotocapturada()) {
          <button mat-stroked-button (click)="reiniciar()">
            <mat-icon>refresh</mat-icon>
            Tomar otra
          </button>
          <button mat-raised-button color="primary" (click)="confirmar()">
            <mat-icon>check</mat-icon>
            Usar esta foto
          </button>
        }
      </div>

      <canvas #canvasElement style="display: none;"></canvas>
    </div>
  `,
  styles: [`
    .camera-dialog {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
    }

    .camera-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .camera-container {
      position: relative;
      width: 100%;
      height: 500px;
      background: #000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }

    .media-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.hidden {
        display: none;
      }
    }

    .camera-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .captured-image {
      max-width: 95%;
      max-height: 95%;
      width: auto !important;
      height: auto !important;
      object-fit: contain;
      object-position: center center;
      display: block;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      animation: zoomIn 0.3s ease-out;
      transform-origin: center center;
    }

    @keyframes zoomIn {
      0% {
        transform: scale(1.05);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .camera-frame {
      width: 75%;
      max-width: 400px;
      height: 70%;
      position: relative;
      border-radius: 12px;
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.6);

      .frame-corners {
        position: absolute;
        inset: 0;

        .corner {
          position: absolute;
          width: 32px;
          height: 32px;
          border: 4px solid #fff;

          &.top-left {
            top: -2px;
            left: -2px;
            border-right: none;
            border-bottom: none;
            border-radius: 16px 0 0 0;
          }

          &.top-right {
            top: -2px;
            right: -2px;
            border-left: none;
            border-bottom: none;
            border-radius: 0 16px 0 0;
          }

          &.bottom-left {
            bottom: -2px;
            left: -2px;
            border-right: none;
            border-top: none;
            border-radius: 0 0 0 16px;
          }

          &.bottom-right {
            bottom: -2px;
            right: -2px;
            border-left: none;
            border-top: none;
            border-radius: 0 0 16px 0;
          }
        }
      }
    }

    .camera-hint {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.7);
      padding: 12px 24px;
      border-radius: 24px;
      backdrop-filter: blur(8px);

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #fff;
        animation: pulse-hint 2s ease-in-out infinite;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #fff;
        text-align: center;
        font-weight: 500;
      }
    }

    @keyframes pulse-hint {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    .capture-confirmation {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      animation: slideDown 0.4s ease-out;

      .confirmation-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(76, 175, 80, 0.95);
        padding: 12px 24px;
        border-radius: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: #fff;
        }

        span {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }
      }
    }

    @keyframes slideDown {
      0% {
        transform: translateX(-50%) translateY(-20px);
        opacity: 0;
      }
      100% {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    .camera-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      color: white;
      background: #000;

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .camera-error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px 24px;
      text-align: center;
      color: white;
      background: #000;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #FF5252;
      }

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
        max-width: 400px;
      }
    }

    .camera-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;

      button {
        min-width: 140px;
      }

      .capture-btn {
        padding: 12px 32px;
        font-size: 16px;
        font-weight: 600;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
    }

    @media (max-width: 768px) {
      .camera-dialog {
        max-width: 100vw;
      }

      .camera-container {
        height: 400px;
      }

      .captured-image {
        max-width: 95%;
        max-height: 95%;
      }

      .camera-hint {
        bottom: 20px;
        padding: 10px 20px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        p {
          font-size: 12px;
        }
      }

      .camera-frame {
        width: 80%;
        height: 75%;
        max-width: none;
      }

      .camera-actions {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class CameraDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  
  loading = signal(true);
  error = signal<string | null>(null);
  fotocapturada = signal<string | null>(null);

  constructor(
    private dialogRef: MatDialogRef<CameraDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    // Esperar a que Angular renderice completamente el ViewChild
    this.esperarVideoElementoYIniciar();
  }

  private esperarVideoElementoYIniciar(intentos: number = 0): void {
    if (this.videoElement?.nativeElement) {
      // ViewChild disponible, iniciar cámara
      this.iniciarCamara();
    } else if (intentos < 10) {
      // Reintentar en 100ms (máximo 10 intentos = 1 segundo)
      setTimeout(() => this.esperarVideoElementoYIniciar(intentos + 1), 100);
    } else {
      // Falló después de 1 segundo
      this.loading.set(false);
      this.error.set('Error de inicialización. El componente no se cargó correctamente.');
    }
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  async iniciarCamara(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.fotocapturada.set(null); // Reset foto anterior si hay

    try {
      // Solicitar acceso a la cámara con constraints simplificados para mejor performance
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      // Asignar stream al video element
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        
        // Esperar a que el video esté completamente cargado
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.loading.set(false);
        };
      } else {
        throw new Error('Elemento de video no disponible');
      }

    } catch (err: any) {
      this.loading.set(false);
      
      if (err.name === 'NotAllowedError') {
        this.error.set('Se negó el acceso a la cámara. Por favor, otorgue permisos en la configuración del navegador.');
      } else if (err.name === 'NotFoundError') {
        this.error.set('No se encontró ninguna cámara en este dispositivo.');
      } else if (err.name === 'NotReadableError') {
        this.error.set('La cámara está siendo usada por otra aplicación.');
      } else {
        this.error.set('Error al iniciar la cámara: ' + err.message);
      }

      this.snackBar.open('No se puede acceder a la cámara', 'Cerrar', { duration: 4000 });
    }
  }

  capturarFoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    // Verificar que el video tiene dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      this.snackBar.open('Video no está listo, intente nuevamente', 'Cerrar', { duration: 2000 });
      return;
    }

    // Capturar exactamente las dimensiones del video tal como se ve
    // Sin recortes ni transformaciones - lo que ves es lo que capturas
    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    // Dibujar frame completo del video en el canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);

      // Convertir a base64 con calidad alta (0.92 para comprobantes legibles)
      const fotoBase64 = canvas.toDataURL('image/jpeg', 0.92);
      this.fotocapturada.set(fotoBase64);

      // Detener stream
      this.detenerCamara();

      // Feedback visual
      this.snackBar.open('✓ Comprobante capturado correctamente', 'Cerrar', { 
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  reiniciar(): void {
    this.fotocapturada.set(null);
    this.iniciarCamara();
  }

  confirmar(): void {
    const foto = this.fotocapturada();
    if (foto) {
      this.dialogRef.close(foto);
    }
  }

  intentarNuevamente(): void {
    this.iniciarCamara();
  }

  private detenerCamara(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
