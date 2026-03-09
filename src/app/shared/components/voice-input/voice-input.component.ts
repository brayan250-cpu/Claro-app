import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

// Declarar tipos para Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

@Component({
  selector: 'app-voice-input',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './voice-input.component.html',
  styleUrl: './voice-input.component.scss'
})
export class VoiceInputComponent {
  @Output() textCaptured = new EventEmitter<string>();
  
  state = signal<VoiceState>('idle');
  errorMessage = signal<string>('');
  
  private recognition: any;
  private silenceTimer: any;
  private isSupported = false;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const windowWithSpeech = window as unknown as IWindow;
    const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API no está soportada en este navegador');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-PE'; // Español de Perú

    // Evento cuando se detecta voz
    this.recognition.onresult = (event: any) => {
      this.resetSilenceTimer();
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Emitir el texto final cuando esté completo
      if (finalTranscript) {
        this.textCaptured.emit(finalTranscript.trim());
      }
    };

    // Evento cuando termina el reconocimiento
    this.recognition.onend = () => {
      if (this.state() === 'listening') {
        this.stop();
      }
    };

    // Evento de error
    this.recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      
      let errorMsg = 'Error al capturar voz';
      
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No se detectó voz. Intente nuevamente.';
          break;
        case 'audio-capture':
          errorMsg = 'No se pudo acceder al micrófono.';
          break;
        case 'not-allowed':
          errorMsg = 'Permiso de micrófono denegado.';
          break;
        case 'network':
          errorMsg = 'Error de conexión de red.';
          break;
      }
      
      this.errorMessage.set(errorMsg);
      this.state.set('error');
      
      // Volver a idle después de 3 segundos
      setTimeout(() => {
        if (this.state() === 'error') {
          this.state.set('idle');
          this.errorMessage.set('');
        }
      }, 3000);
    };

    // Evento cuando empieza a hablar
    this.recognition.onspeechstart = () => {
      this.state.set('listening');
    };
  }

  toggleRecording(): void {
    if (!this.isSupported) {
      alert('Su navegador no soporta reconocimiento de voz. Use Chrome o Edge.');
      return;
    }

    if (this.state() === 'idle') {
      this.start();
    } else if (this.state() === 'listening') {
      this.stop();
    }
  }

  private start(): void {
    try {
      this.state.set('listening');
      this.errorMessage.set('');
      this.recognition.start();
      this.startSilenceTimer();
    } catch (error) {
      console.error('Error al iniciar reconocimiento:', error);
      this.state.set('error');
      this.errorMessage.set('Error al iniciar el micrófono');
    }
  }

  private stop(): void {
    try {
      this.recognition.stop();
      this.clearSilenceTimer();
      this.state.set('idle');
    } catch (error) {
      console.error('Error al detener reconocimiento:', error);
    }
  }

  // Detectar silencio y parar automáticamente después de 3 segundos sin hablar
  private startSilenceTimer(): void {
    this.silenceTimer = setTimeout(() => {
      if (this.state() === 'listening') {
        this.stop();
      }
    }, 5000); // 5 segundos de silencio
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.startSilenceTimer();
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  getTooltip(): string {
    switch (this.state()) {
      case 'listening':
        return 'Escuchando... (Clic para detener)';
      case 'error':
        return this.errorMessage();
      default:
        return 'Dictar por voz';
    }
  }

  getIcon(): string {
    switch (this.state()) {
      case 'listening':
        return 'stop';
      case 'error':
        return 'mic_off';
      default:
        return 'mic';
    }
  }

  getColor(): string {
    switch (this.state()) {
      case 'listening':
        return 'warn';
      case 'error':
        return 'warn';
      default:
        return 'primary';
    }
  }
}
