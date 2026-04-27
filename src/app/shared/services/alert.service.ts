import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly messageService = inject(MessageService);

  success(detail: string, summary: string = 'Éxito'): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  error(detail: string, summary: string = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  info(detail: string, summary: string = 'Información'): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    });
  }

  warn(detail: string, summary: string = 'Advertencia'): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000
    });
  }

  // Muestra una notificación de carga persistente
  loading(detail: string = 'Procesando...', summary: string = 'Cargando'): void {
    this.messageService.add({
      key: 'loading-toast',
      severity: 'info',
      summary,
      detail,
      sticky: true,
      icon: 'pi pi-spin pi-spinner'
    });
  }

  // Quita la notificación de carga
  clearLoading(): void {
    this.messageService.clear('loading-toast');
  }
}
