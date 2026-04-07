# Sistema de Formularios con PrimeNG

## Objetivos

- Formularios modulares, reutilizables y tipados (TypeScript).
- Presets configurables: estilos, validaciones, mensajes de error.
- Wrappers reutilizables y validación centralizada.
- Responsive y theming consistente con PrimeNG y PrimeFlex.
- Soporte de internacionalización (i18n).

## Estructura

- `src/app/shared/forms/`
  - `types.ts`: Tipos compartidos (`FieldPreset`, `SelectOption`, etc.).
  - `validation.service.ts`: Mensajes de error estandarizados por locale.
  - `form-field.(ts|html|scss)`: Wrapper base para campos.
  - `text-field.(ts|html)`: Input de texto (PrimeNG `pInputText`).
  - `select-field.(ts|html)`: Select (PrimeNG `p-select`).
  - `checkbox-field.(ts|html)`: Checkbox (PrimeNG `p-checkbox`).
  - `date-field.(ts|html)`: DatePicker (PrimeNG `p-datepicker`).
  - `presets.ts`: Validadores preconfigurados (email, phone, dni, ruc).
  - `form-factory.ts`: Helpers para crear `FormControl` con presets.
- `src/app/shared/i18n/i18n.service.ts`: Diccionarios y locale.
- `src/app/app.config.ts`: Theming PrimeNG (preset Aura extendido).
- `src/app/features/forms/demo.(ts|html)`: Página de ejemplo.

## Crear nuevos formularios

1. Define el `FormGroup` tipado y usa `createControl` para controles:
   ```ts
   form = this.fb.group({
     name: createControl<string>('textRequired', ''),
     email: createControl<string>('email', ''),
     group: this.fb.control<string | null>(null),
     created: this.fb.control<Date | null>(new Date()),
     whatsapp: this.fb.control<boolean | null>(true),
   });
   ```
2. Usa los componentes base:
   ```html
   <app-text-field label="Nombre" [control]="form.controls.name" [required]="true" />
   <app-select-field label="Grupo" [control]="form.controls.group" [options]="groupOptions" />
   <app-date-field label="Fecha" [control]="form.controls.created" />
   <app-checkbox-field
     label="WhatsApp"
     checkboxLabel="Permitir notificaciones"
     [control]="form.controls.whatsapp"
   />
   ```

## Extender componentes base

- Agrega nuevas propiedades a los wrappers respetando la API de PrimeNG.
- Mantén la validación en `ValidationService` y evita lógica en plantillas.
- Para nuevos tipos de campo, crea `xxx-field.(ts|html)` siguiendo el patrón.

## Aplicar presets existentes

- Usa `createControl` con clave de preset:
  - `'textRequired'`: requerido + mínimo 3 caracteres
  - `'email'`: email válido
  - `'phone'`: 7–15 dígitos, `+`, `-`, espacios
  - `'dni'`: 8 dígitos
  - `'ruc'`: 11 dígitos
- Combina validadores adicionales:
  ```ts
  createControl<string>('textRequired', '', [Validators.maxLength(50)]);
  ```

## Internacionalización

- Establece locale:
  ```ts
  i18n.setLocale('es'); // o 'en'
  validation.setLocale('es');
  ```
- Los mensajes de error del sistema se actualizan automáticamente.

## Theming

- `app.config.ts` define el preset de PrimeNG (Aura extendido).
- Estilos globales en `src/styles.scss` aseguran coherencia: bordes, focus, tipografías.
- Usa PrimeFlex (`grid`, `col-12 md:col-6`) para responsive.

## Buenas prácticas

- Usa `FormGroup` tipado para tipos fuertes y seguridad en plantillas.
- Centraliza validaciones y mensajes; evita duplicación.
- Composición sobre herencia: wrappers pequeños y configurables.
- No mezcles lógica de negocio en componentes de UI de formulario.
- Mantén consistencia visual: utiliza `FieldPreset` y estilos globales.
