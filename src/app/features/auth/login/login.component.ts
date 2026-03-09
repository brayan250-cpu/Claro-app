import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Componente de Login (P-GEN-001)
 * Pantalla de autenticación del sistema
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  errorMessage = signal('');
  hidePassword = signal(true);

  // Computed
  loading = this.authStore.loading;

  constructor(
    private authService: AuthService,
    private authStore: AuthStore,
    private router: Router
  ) {}

  /**
   * Maneja el submit del formulario de login
   */
  onSubmit(): void {
    const user = this.username();
    const pass = this.password();

    if (!user || !pass) {
      this.errorMessage.set('Por favor ingrese usuario y contraseña');
      return;
    }

    this.errorMessage.set('');

    this.authService.login(user, pass).subscribe({
      next: (session) => {
        console.log('Login exitoso:', session.user.nombreCompleto);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.errorMessage.set('Usuario o contraseña incorrectos');
      }
    });
  }

  /**
   * Toggle visibilidad de password
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }
}
