import { Injectable, signal } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { LocaleCode, ValidationMessageMap } from './types';

const ES_MESSAGES: ValidationMessageMap = {
  required: 'Este campo es obligatorio.',
  minlength: (min: number) => `Debe tener al menos ${min} caracteres.`,
  maxlength: (max: number) => `Debe tener como máximo ${max} caracteres.`,
  email: 'Ingrese un correo electrónico válido.',
  pattern: 'Formato inválido.',
};

const EN_MESSAGES: ValidationMessageMap = {
  required: 'This field is required.',
  minlength: (min: number) => `Must be at least ${min} characters.`,
  maxlength: (max: number) => `Must be at most ${max} characters.`,
  email: 'Enter a valid email address.',
  pattern: 'Invalid format.',
};

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private locale = signal<LocaleCode>('es');

  setLocale(locale: LocaleCode) {
    this.locale.set(locale);
  }

  getLocale() {
    return this.locale();
  }

  private messages(): ValidationMessageMap {
    return this.locale() === 'es' ? ES_MESSAGES : EN_MESSAGES;
  }

  firstError(control?: AbstractControl | null): string | null {
    if (!control) return null;
    const errors: ValidationErrors | null = control.errors;
    if (!errors) return null;

    const m = this.messages();
    if (errors['required']) return m.required;
    if (errors['minlength']) return m.minlength(errors['minlength'].requiredLength);
    if (errors['maxlength']) return m.maxlength(errors['maxlength'].requiredLength);
    if (errors['email']) return m.email;
    if (errors['pattern']) return m.pattern;
    return null;
  }
}

