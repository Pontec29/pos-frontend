import { Injectable, signal } from '@angular/core';
import { LocaleCode } from '../forms/types';

type Dict = Record<string, string>;

const ES: Dict = {
  'form.save': 'Guardar',
  'form.cancel': 'Cancelar',
  'form.required': 'Obligatorio',
};

const EN: Dict = {
  'form.save': 'Save',
  'form.cancel': 'Cancel',
  'form.required': 'Required',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private locale = signal<LocaleCode>('es');
  private dictionaries: Record<LocaleCode, Dict> = { es: ES, en: EN };

  setLocale(locale: LocaleCode) {
    this.locale.set(locale);
  }

  getLocale() {
    return this.locale();
  }

  t(key: string): string {
    const dict = this.dictionaries[this.locale()];
    return dict[key] ?? key;
  }
}

