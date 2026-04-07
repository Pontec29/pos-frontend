import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { AuthCarouselComponent } from './components/carousel';
import { LoaderService } from '@shared/services/loader.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    PasswordModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    AuthCarouselComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export default class LoginComponent {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly formBuilder = inject(FormBuilder);

  private readonly loaderService = inject(LoaderService);
  private readonly authService = inject(AuthService);

  hide = signal(true);
  form!: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(/^\S{3,20}$/)]],
    });
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.get('username')?.hasError('required') || this.form.get('password')?.hasError('required')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Campos incompletos',
          detail: 'Por favor, completa todos los campos.',
          life: 5000
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Errores en el formulario',
          detail: 'Por favor, corrige los errores en el formulario.',
          life: 5000
        });
      }
      return;
    }

    this.loaderService.show();
    this.isLoading.set(true);
    const { username, password } = this.form.getRawValue();

    this.authService.login({
      email: username,
      password: password
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: `Hola, ${res.username}` });
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.loaderService.hide();
        // Mostrar el mensaje específico del backend si está disponible
        const detail = err?.error?.message || err?.error?.error || 'Credenciales inválidas o error de conexión';
        this.messageService.add({ severity: 'error', summary: 'Acceso denegado', detail, life: 6000 });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
