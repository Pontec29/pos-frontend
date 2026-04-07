import { ValidatorFn, Validators } from '@angular/forms';

export type FormPresetKey = 'textRequired' | 'email' | 'phone' | 'dni' | 'ruc';

const PHONE_REGEX = /^[0-9\-\+\s]{7,15}$/;
const DNI_REGEX = /^[0-9]{8}$/;
const RUC_REGEX = /^[0-9]{11}$/;

const PRESET_VALIDATORS: Record<FormPresetKey, ValidatorFn[]> = {
  textRequired: [Validators.required, Validators.minLength(3)],
  email: [Validators.email],
  phone: [Validators.pattern(PHONE_REGEX)],
  dni: [Validators.pattern(DNI_REGEX)],
  ruc: [Validators.pattern(RUC_REGEX)],
};

export function validatorsFor(key: FormPresetKey | null, extra?: ValidatorFn[]): ValidatorFn[] {
  const base = key ? PRESET_VALIDATORS[key] : [];
  return extra?.length ? [...base, ...extra] : base;
}

