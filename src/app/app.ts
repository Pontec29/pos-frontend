import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalConfirmacionComponent } from './shared/ui/modal-confirmacion/modal-confirmacion.component';
import { ToastModule } from 'primeng/toast';
import { LoaderService } from '@shared/services/loader.service';
import { LoaderComponent } from '@shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ModalConfirmacionComponent, ToastModule, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Nexu-Pos');
  private readonly loaderService = inject(LoaderService);

  isLoading = this.loaderService.isLoading;
}
