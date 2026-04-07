import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="loading-spinner" [ngClass]="size"></div>
      <p class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .loading-spinner {
      border: 3px solid #e2e8f0;
      border-top: 3px solid #3182ce;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;

      &.small {
        width: 1.5rem;
        height: 1.5rem;
        border-width: 2px;
      }

      &.medium {
        width: 2rem;
        height: 2rem;
        border-width: 3px;
      }

      &.large {
        width: 3rem;
        height: 3rem;
        border-width: 4px;
      }
    }

    .loading-message {
      color: #4a5568;
      font-size: 1rem;
      margin: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinner {
  @Input() message: string = 'Cargando...';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
}
