export type LocaleCode = 'es' | 'en';

export type SelectOption<T extends string | number | boolean | null = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

export type ValidationMessageMap = {
  required: string;
  minlength: (min: number) => string;
  maxlength: (max: number) => string;
  email: string;
  pattern: string;
};

export type FieldPreset = {
  appearance?: 'outlined' | 'filled';
  dense?: boolean;
  showAsterisk?: boolean;
  showInlineError?: boolean;
};

export const DefaultFieldPreset: FieldPreset = {
  appearance: 'outlined',
  dense: false,
  showAsterisk: true,
  showInlineError: true,
};

