import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AppButton } from '@shared/ui/button';
import { PRIMENG_FORM_MODULES } from '@shared/ui/prime-imports';
import { CurrencyFormatPipe } from '@shared/pipe/currencyFormat.pipe';

@Component({
  selector: 'app-gestion-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButton,
    ...PRIMENG_FORM_MODULES,
    CurrencyFormatPipe
  ],
  templateUrl: './gestion-sesion.component.html',
  styleUrl: './gestion-sesion.component.scss'
})
export class GestionSesionComponent {
  // Inputs
  isCajaAbierta = input.required<boolean>();
  formApertura = input.required<FormGroup>();
  formCierre = input.required<FormGroup>();
  cajaOptions = input.required<any[]>();
  cajaSesionNombre = input.required<string>();
  arqueoConfirmadoApertura = input.required<boolean>();
  arqueoConfirmadoCierre = input.required<boolean>();
  canSubmitApertura = input.required<boolean>();
  isCierreFormValid = input.required<boolean>();
  closing = input.required<boolean>();

  // Outputs
  onVolver = output<void>();
  onAbrirDenominacion = output<'apertura' | 'cierre'>();
  onSubmitApertura = output<void>();
  onSubmitCierre = output<void>();
}
