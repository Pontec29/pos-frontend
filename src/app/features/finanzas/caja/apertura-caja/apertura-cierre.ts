import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, startWith, switchMap, throwError } from 'rxjs';
import {
  AperturaCajaRegistro,
  Arqueos,
  CajaAbiertaCerrada,
  CajaSesionesListar,
  CierreCajaRegistro,
} from '@caja/domain/caja.interface';
import { CajaService } from '@caja/service/caja.service';
import { AppButton } from '@shared/ui/button';
import {
  PRIMENG_FILTER_MODULES,
  PRIMENG_FORM_MODULES,
  PRIMENG_TABLE_MODULES,
} from '@shared/ui/prime-imports';
import { MessageService, SortEvent } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ArqueoCaja } from './components/arqueo-caja/arqueo-caja';
import { AuthService } from '@auth/services/auth.service';
import { CurrencyFormatPipe } from '@shared/pipe/currencyFormat.pipe';
import { DateFormatPipe } from '@shared/pipe/dateFormat.pipe';

interface CajaOption {
  label: string;
  value: number;
  disabled: boolean;
}

@Component({
  selector: 'app-apertura-cierre',
  imports: [
    CommonModule,
    AppButton,
    ReactiveFormsModule,
    ...PRIMENG_TABLE_MODULES,
    ...PRIMENG_FILTER_MODULES,
    ...PRIMENG_FORM_MODULES,
    TooltipModule,
    ArqueoCaja,
    CurrencyFormatPipe,
    DateFormatPipe
  ],
  templateUrl: './apertura-cierre.html',
  styleUrl: './apertura-cierre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AperturaCierre implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly cajaService = inject(CajaService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dataSesiones = signal<CajaSesionesListar[]>([]);
  readonly cajas = signal<CajaAbiertaCerrada[]>([]);
  readonly cajasLoading = signal(false);
  readonly cajasError = signal<string | null>(null);
  readonly cajaSesionLoading = signal(false);
  readonly cajaSesionNombre = signal('');
  readonly sesionCajaId = signal<number | null>(null);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchText = signal('');
  readonly rows = signal(10);
  readonly first = signal(0);
  readonly sortField = signal<string | null>(null);
  readonly sortOrder = signal(1);
  readonly totalRecords = signal(0);

  readonly closing = signal(false);
  readonly cierreCompletado = signal(false);

  readonly isModalOpen = signal(false);
  readonly modalContext = signal<'apertura' | 'cierre'>('apertura');
  readonly montoFinalAperturaArqueo = signal(0);
  readonly montoFinalCierreArqueo = signal(0);
  readonly arqueoConfirmadoApertura = signal(false);
  readonly arqueoConfirmadoCierre = signal(false);

  readonly formApertura = this.fb.group({
    cajaId: [null, Validators.required],
    montoApertura: [null, Validators.required],
    observacionApertura: [''],
    arqueos: this.fb.array<Arqueos>([]),
  });

  readonly formCierre = this.fb.group({
    cajaId: [null, Validators.required],
    montoCierre: [null, Validators.required],
    observacionCierre: [''],
    arqueos: this.fb.array<Arqueos>([]),
  });

  private readonly aperturaFormValue = toSignal(
    this.formApertura.valueChanges.pipe(startWith(this.formApertura.getRawValue())),
    { initialValue: this.formApertura.getRawValue() },
  );
  private readonly aperturaFormStatus = toSignal(
    this.formApertura.statusChanges.pipe(startWith(this.formApertura.status)),
    { initialValue: this.formApertura.status },
  );
  private readonly cierreFormStatus = toSignal(
    this.formCierre.statusChanges.pipe(startWith(this.formCierre.status)),
    { initialValue: this.formCierre.status },
  );

  readonly esFormularioAperturaDeshabilitado = this.authService.cajaAbierta;
  readonly esFormularioCierreDeshabilitado = computed(
    () => this.cajaSesionLoading() || !this.sesionCajaId(),
  );

  readonly cajaOptions = computed<CajaOption[]>(() =>
    this.cajas().map((caja) => ({
      value: caja.ID_CAJA_ABIERTA,
      disabled: !caja.ESTADO || caja.EN_USO,
      label: `${caja.CAJA_NOMBRE} · ${caja.CODIGO} · ${caja.EN_USO ? 'En uso' : 'Disponible'}`,
    })),
  );
  readonly cajasEmpty = computed(
    () => !this.cajasLoading() && !this.cajasError() && this.cajas().length === 0,
  );
  readonly hasError = computed(() => !this.loading() && Boolean(this.errorMessage()));

  readonly canSubmitApertura = computed(() => {
    this.aperturaFormStatus();
    return this.formApertura.valid && this.arqueoConfirmadoApertura();
  });
  readonly isCierreFormValid = computed(() => {
    this.cierreFormStatus();
    return this.formCierre.valid && !this.formCierre.pending;
  });
  readonly isCierreLocked = computed(() => this.closing() || this.cierreCompletado());

  readonly selectedCajaApertura = computed(
    () =>
      this.cajas().find(
        (c) => c.ID_CAJA_ABIERTA === (this.extractId(this.aperturaFormValue()?.cajaId) ?? 0),
      ) ?? null,
  );

  readonly aperturaTooltip = computed(() => {
    this.aperturaFormValue();
    const missing: string[] = [];
    if (!this.extractId(this.formApertura.controls.cajaId.value)) missing.push('seleccionar caja');
    if (
      !this.formApertura.controls.montoApertura.value ||
      Number(this.formApertura.controls.montoApertura.value) <= 0
    )
      missing.push('enviar denominaciones');
    if (!this.arqueoConfirmadoApertura()) missing.push('confirmar arqueo');
    return missing.length ? `Completar: ${missing.join(', ')}` : '';
  });

  readonly aperturaDeshabilitadaTooltip = computed(() =>
    this.authService.cajaAbierta()
      ? 'La caja ya está abierta. Debe cerrar la caja actual antes de abrir una nueva.'
      : '',
  );
  readonly cierreDeshabilitadoTooltip = computed(() => {
    if (this.cajaSesionLoading()) return 'Cargando estado de caja...';
    return this.esFormularioCierreDeshabilitado() ? 'No hay una caja abierta para cerrar.' : '';
  });
  readonly tooltipApertura = computed(() =>
    this.arqueoConfirmadoApertura()
      ? `Monto final: ${this.formatCurrency(this.montoFinalAperturaArqueo())}`
      : 'Aún no se han enviado denominaciones',
  );
  readonly tooltipCierre = computed(() =>
    this.arqueoConfirmadoCierre()
      ? `Monto final: ${this.formatCurrency(this.montoFinalCierreArqueo())}`
      : 'Aún no se han enviado denominaciones',
  );

  ngOnInit(): void {
    this.loadCajasCatalogo();
    this.loadCajaSesionActual();
    this.loadAperturas();
  }

  abrirDenominacion(context: 'apertura' | 'cierre' = 'apertura'): void {
    this.modalContext.set(context);
    this.isModalOpen.set(true);
  }
  cerrarDenominacion(): void {
    this.isModalOpen.set(false);
  }

  onArqueoSeleccionado(arqueos: Arqueos[]): void {
    const formArray = this.fb.array(
      arqueos.map((a) =>
        this.fb.group({ ID_DENOMINACION: [a.ID_DENOMINACION], CANTIDAD: [a.CANTIDAD] }),
      ),
    );
    if (this.modalContext() === 'cierre') {
      this.formCierre.setControl('arqueos', formArray as any);
      this.arqueoConfirmadoCierre.set(false);
    } else {
      this.formApertura.setControl('arqueos', formArray as any);
      this.arqueoConfirmadoApertura.set(false);
    }
  }

  onMontoFinalSeleccionado(montoFinal: number): void {
    if (this.modalContext() === 'cierre') {
      this.formCierre.controls.montoCierre.setValue(montoFinal as any);
      this.montoFinalCierreArqueo.set(montoFinal);
      this.arqueoConfirmadoCierre.set(
        montoFinal > 0 && this.getArqueosFromForm('cierre').length > 0,
      );
    } else {
      this.formApertura.controls.montoApertura.setValue(montoFinal as any);
      this.montoFinalAperturaArqueo.set(montoFinal);
      this.arqueoConfirmadoApertura.set(
        montoFinal > 0 && this.getArqueosFromForm('apertura').length > 0,
      );
    }
    this.cerrarDenominacion();
  }

  onCajaCatalogInteraction(): void {
    this.loadCajasCatalogo();
  }
  onCajaAperturaChange(value: unknown): void {
    this.formApertura.controls.cajaId.setValue(this.extractId(value) as any);
  }

  onCustomSort(event: SortEvent): void {
    const field = event.field ?? null;
    const order = event.order ?? 1;
    if (this.sortField() === field && this.sortOrder() === order) return;
    this.sortField.set(field);
    this.sortOrder.set(order);
    this.first.set(0);
    this.loadAperturas();
  }

  onSubmit(): void {
    if (this.formApertura.invalid) {
      this.formApertura.markAllAsTouched();
      return this.toast('warn', 'Formulario incompleto', 'Complete todos los campos obligatorios');
    }
    if (!this.isCajaDisponible(this.formApertura.controls.cajaId.value))
      return this.toast(
        'warn',
        'Caja no disponible',
        'Seleccione una caja disponible para apertura',
      );
    if (!this.validarArqueo('apertura')) return;

    const formValue = this.formApertura.getRawValue();
    const cajaId = this.extractId(formValue.cajaId);
    if (!cajaId)
      return this.toast(
        'warn',
        'Caja inválida',
        'La caja seleccionada no tiene un identificador válido',
      );

    const payload: AperturaCajaRegistro = {
      ID_CAJA: cajaId,
      MONTO_APERTURA_PEN: Number(formValue.montoApertura),
      OBSERVACIONES_APERTURA: formValue.observacionApertura ?? '',
      ARQUEOS: this.mapArqueos(formValue.arqueos),
    };

    this.cajaService
      .abrirCaja(payload)
      .pipe(
        switchMap((res) => {
          if (!res.success)
            return throwError(() => new Error(res.message || 'No se pudo aperturar la caja'));
          return this.authService.actualizarSesion({ estadoCaja: 'ABIERTA' }).pipe(map(() => res));
        }),
      )
      .subscribe({
        next: () => {
          this.toast('success', 'Éxito', 'Apertura de caja registrada correctamente');
          this.loadCajaSesionActual();
          this.loadAperturas();
        },
        error: (err) =>
          this.toast('error', 'Error', err?.message || 'No se pudo aperturar la caja'),
      });
  }

  onSubmitCierre(): void {
    if (this.isCierreLocked()) return;
    if (this.formCierre.invalid || this.formCierre.pending) {
      this.formCierre.markAllAsTouched();
      return this.toast(
        'warn',
        'Formulario incompleto',
        'Complete correctamente todos los campos de cierre',
      );
    }
    const sesionId = this.extractId(this.formCierre.getRawValue().cajaId);
    if (!sesionId)
      return this.toast(
        'warn',
        'Sesión no disponible',
        'No existe una sesión de caja abierta para cerrar',
      );
    if (!this.validarArqueo('cierre')) return;

    this.closing.set(true);
    this.formCierre.disable({ emitEvent: false });

    const rawValue = this.formCierre.getRawValue();
    const cierrePayload: CierreCajaRegistro = {
      ID_SESION: sesionId,
      MONTO_CIERRE_REAL_PEN: Number(rawValue.montoCierre),
      OBSERVACIONES_CIERRE: String(rawValue.observacionCierre ?? ''),
      ARQUEOS: this.mapArqueos(rawValue.arqueos),
    };

    this.cajaService
      .cerrarCaja(cierrePayload)
      .pipe(
        switchMap((res) => {
          if (!res.success)
            return throwError(
              () => new Error(res.message || 'No se pudo registrar el cierre de caja'),
            );
          return this.authService.actualizarSesion({ estadoCaja: 'CERRADA' }).pipe(map(() => res));
        }),
        finalize(() => this.closing.set(false)),
      )
      .subscribe({
        next: () => {
          this.cierreCompletado.set(true);
          this.toast('success', 'Éxito', 'Cierre de caja registrado correctamente');
          this.loadCajaSesionActual();
          this.loadAperturas();
        },
        error: (err) => {
          this.toast('error', 'Error', err?.message || 'No se pudo registrar el cierre de caja');
          this.formCierre.enable({ emitEvent: false });
        },
      });
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.loadAperturas();
  }
  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.first.set(0);
    this.loadAperturas();
  }
  reloadMovimientos(): void {
    this.loadAperturas();
  }

  private loadAperturas(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.cajaService.getAllCajaSesiones().subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!response.success) {
          this.errorMessage.set(
            response.message || 'No se pudo cargar el listado de movimientos de caja',
          );
          this.dataSesiones.set([]);
          this.totalRecords.set(0);
          return;
        }
        let rows = [...(response.data ?? [])];
        if (this.searchText()) {
          const search = this.searchText().toLowerCase();
          rows = rows.filter((item) =>
            `${item.ID_SESION} ${item.CAJA_NOMBRE} ${item.MONTO_APERTURA_PEN} ${item.MONTO_CIERRE_REAL_PEN} ${item.FECHA_APERTURA} ${item.FECHA_CIERRE ?? ''}`
              .toLowerCase()
              .includes(search),
          );
        }
        const field = this.sortField();
        if (field) {
          const order = this.sortOrder();
          rows.sort((a, b) => {
            const v1 = a[field as keyof CajaSesionesListar];
            const v2 = b[field as keyof CajaSesionesListar];
            if (v1 == null && v2 != null) return -1;
            if (v1 != null && v2 == null) return 1;
            if (v1 == null || v2 == null) return 0;
            return v1 < v2 ? -order : v1 > v2 ? order : 0;
          });
        }
        this.totalRecords.set(rows.length);
        this.dataSesiones.set(rows.slice(this.first(), this.first() + this.rows()));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.name === 'TimeoutError'
            ? 'Tiempo de espera agotado al cargar movimientos de caja'
            : err?.message || 'Error al cargar movimientos de caja',
        );
        this.dataSesiones.set([]);
        this.totalRecords.set(0);
      },
    });
  }

  private loadCajasCatalogo(): void {
    this.cajasLoading.set(true);
    this.cajasError.set(null);
    this.cajaService
      .getCajaAbierta()
      .pipe(
        finalize(() => this.cajasLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.cajas.set([]);
            this.cajasError.set(response.message || 'No se pudo cargar el catálogo de cajas');
            return;
          }
          this.cajas.set(response.data ?? []);
          this.syncSelectedCajasWithCatalog();
        },
        error: (err) => {
          this.cajas.set([]);
          this.cajasError.set(
            err?.name === 'TimeoutError'
              ? 'Tiempo de espera agotado al listar cajas'
              : err?.message || 'No se pudo cargar el catálogo de cajas',
          );
        },
      });
  }

  private loadCajaSesionActual(): void {
    this.cajaSesionLoading.set(true);
    this.cajaService
      .getAllConsultarCajaAbierta()
      .pipe(finalize(() => this.cajaSesionLoading.set(false)))
      .subscribe({
        next: (response) => {
          const sesion = response.data?.SESION;
          if (!response.success || !response.data?.TIENE_SESION_ABIERTA || !sesion) {
            this.cajaSesionNombre.set('Sin caja abierta');
            this.sesionCajaId.set(null);
            this.formCierre.controls.cajaId.setValue(null);
            return;
          }
          this.cajaSesionNombre.set(sesion.CAJA_NOMBRE || 'Caja sin nombre');
          this.sesionCajaId.set(sesion.ID_SESION ?? null);
          this.formCierre.controls.cajaId.setValue(sesion.ID_SESION as any);
        },
        error: () => {
          this.cajaSesionNombre.set('No disponible');
          this.sesionCajaId.set(null);
          this.formCierre.controls.cajaId.setValue(null);
        },
      });
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────
  private isCajaDisponible(cajaId: unknown): boolean {
    const id = this.extractId(cajaId);
    const caja = id ? this.cajas().find((c) => c.ID_CAJA_ABIERTA === id) : null;
    return Boolean(caja?.ESTADO && !caja.EN_USO);
  }

  private validarArqueo(context: 'apertura' | 'cierre'): boolean {
    const arqueos = this.getArqueosFromForm(context);
    const montoFormulario = Number(
      context === 'cierre'
        ? (this.formCierre.controls.montoCierre.value ?? 0)
        : (this.formApertura.controls.montoApertura.value ?? 0),
    );
    const montoArqueo =
      context === 'cierre' ? this.montoFinalCierreArqueo() : this.montoFinalAperturaArqueo();
    if (!arqueos.length)
      return this.toastFalse(
        'warn',
        'Denominaciones requeridas',
        'Debe ingresar y enviar denominaciones antes de continuar',
      );
    if (
      arqueos.some(
        (a) =>
          !Number.isInteger(Number(a.ID_DENOMINACION)) ||
          Number(a.ID_DENOMINACION) <= 0 ||
          !Number.isInteger(Number(a.CANTIDAD)) ||
          Number(a.CANTIDAD) <= 0,
      )
    )
      return this.toastFalse(
        'warn',
        'Denominaciones inválidas',
        'Revise que todas las cantidades sean enteros positivos',
      );
    if (montoFormulario <= 0 || montoArqueo <= 0)
      return this.toastFalse(
        'warn',
        'Monto inválido',
        'El monto final de denominaciones debe ser mayor a cero',
      );
    if (Math.abs(montoFormulario - montoArqueo) > 0.01)
      return this.toastFalse(
        'error',
        'Diferencia detectada',
        'El monto del formulario no coincide con el total enviado de denominaciones',
      );
    return true;
  }

  private getArqueosFromForm(context: 'apertura' | 'cierre'): Arqueos[] {
    const raw = (context === 'cierre' ? this.formCierre : this.formApertura).getRawValue();
    return (raw.arqueos ?? [])
      .filter(Boolean)
      .map((a) => ({
        ID_DENOMINACION: Number(a?.ID_DENOMINACION ?? 0),
        CANTIDAD: Number(a?.CANTIDAD ?? 0),
      }));
  }

  private mapArqueos(arqueos: any[]): Arqueos[] {
    return (arqueos ?? []).map((a) => ({
      ID_DENOMINACION: a?.ID_DENOMINACION ?? 0,
      CANTIDAD: a?.CANTIDAD ?? 0,
    }));
  }

  private syncSelectedCajasWithCatalog(): void {
    const id = this.extractId(this.formApertura.controls.cajaId.value);
    if (id && !this.cajas().some((c) => c.ID_CAJA_ABIERTA === id))
      this.formApertura.controls.cajaId.setValue(null);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  private extractId(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (typeof value === 'object') return this.extractId((value as { value?: unknown }).value);
    return null;
  }

  private toast(severity: string, summary: string, detail: string, life = 3000): void {
    this.messageService.add({ severity, summary, detail, life });
  }

  private toastFalse(severity: string, summary: string, detail: string): false {
    this.toast(severity, summary, detail);
    return false;
  }
}
