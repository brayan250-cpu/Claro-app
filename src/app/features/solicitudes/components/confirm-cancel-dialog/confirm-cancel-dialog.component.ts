import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface ConfirmCancelDialogData {
  title: string;
  message: string;
  solicitudCodigo: string;
  requireMotivo: boolean;
}

/**
 * Diálogo de confirmación para cancelar solicitud
 */
@Component({
  selector: 'app-confirm-cancel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="dialog-icon warn">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <mat-dialog-content>
        <p class="dialog-message">{{ data.message }}</p>
        <p class="solicitud-code">
          <strong>Solicitud:</strong> {{ data.solicitudCodigo }}
        </p>

        @if (data.requireMotivo) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo de cancelación</mat-label>
            <textarea
              matInput
              [(ngModel)]="motivo"
              rows="3"
              placeholder="Ingrese el motivo..."
              required
            ></textarea>
            <mat-hint>Este campo es obligatorio</mat-hint>
          </mat-form-field>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          Volver
        </button>
        <button
          mat-raised-button
          color="warn"
          (click)="onConfirm()"
          [disabled]="data.requireMotivo && !motivo.trim()"
        >
          <mat-icon>cancel</mat-icon>
          Cancelar Solicitud
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 400px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .dialog-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;

        &.warn {
          color: #f57c00;
        }
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
    }

    mat-dialog-content {
      .dialog-message {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: var(--claro-text-secondary);
        line-height: 1.5;
      }

      .solicitud-code {
        margin: 0 0 20px 0;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 14px;

        strong {
          color: var(--claro-text-primary);
        }
      }

      .full-width {
        width: 100%;
      }
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;

      button {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    @media (max-width: 600px) {
      .dialog-container {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class ConfirmCancelDialogComponent {
  motivo: string = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmCancelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCancelDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.motivo.trim());
  }
}
