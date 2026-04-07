import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButton } from '../button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, AppButton],
  template: `
    <div class="error-container">
      <div class="error-message">
        <i [class]="icon"></i>
        {{ message }}
      </div>
      @if (showRetryButton) {
        <app-button 
          [preset]="buttonPreset" 
          [label]="retryLabel" 
          (clicked)="retry.emit()">
        </app-button>
      }
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: #fed7d7;
      color: #c53030;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      font-weight: 500;

      i {
        font-size: 1.25rem;
      }
    }
  `]
})
export class ErrorState {
  @Input() message: string = 'Ocurrió un error al cargar los datos';
  @Input() icon: string = 'pi pi-exclamation-triangle';
  @Input() showRetryButton: boolean = true;
  @Input() retryLabel: string = 'Reintentar';
  @Input() buttonPreset: 'primary' | 'secondary' | 'danger' = 'primary';
  @Output() retry = new EventEmitter<void>();
}
