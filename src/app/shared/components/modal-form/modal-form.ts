import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, input, output } from '@angular/core';
import { Proveedor } from '@proveedores/domain/proveedor.interface';
import { ApartadoConfig, ModalData } from '@shared/domains/apartadoType.model';
import { AppButton } from '@shared/ui/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormProveedor } from '@proveedores/components/form-proveedor/form-proveedor';
import { FormRolComponent } from '../../../features/configuracion/roles/components/form-rol/form-rol';
import { Role } from '../../../features/configuracion/roles/domain/role.interface';
import { FormCargoComponent } from '../../../features/recursos-humanos/cargos/components/form-cargo/form-cargo';
import { Cargo } from '../../../features/recursos-humanos/cargos/domain/cargo.interface';
import { FormUsuarioComponent } from '../../../features/configuracion/usuarios/components/form-usuario/form-usuario';
import { User } from '../../../features/configuracion/usuarios/models/user.models';
import { FormSucursalComponent } from '../../../features/configuracion/sucursales/components/form-sucursal/form-sucursal';
import { Sucursal } from '../../../features/configuracion/sucursales/domain/sucursal.type';
import { FormUnidadMedidaComponent } from '../../../features/configuracion/unidades-medida/components/form-unidad-medida/form-unidad-medida';
import { UnidadMedidaListar } from '../../../features/configuracion/unidades-medida/domain/unidad-medida.interface';

@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule, DialogModule, FormProveedor, FormRolComponent, FormCargoComponent, FormUsuarioComponent, FormSucursalComponent, FormUnidadMedidaComponent, AppButton],
  templateUrl: './modal-form.html',
  styleUrl: './modal-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalForm {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ! RECIBIR DATA
  readonly data = input.required<ModalData<any>>();
  closed = output<{ saved: boolean; result?: unknown }>();

  @ViewChild('formComponent') formComponent?: FormProveedor | FormRolComponent | FormCargoComponent | FormUsuarioComponent | FormSucursalComponent | FormUnidadMedidaComponent;

  private readonly configMap: Record<string, ApartadoConfig> = {
    proveedor: { articulo: 'del', nombre: 'Proveedor' },
    rol: { articulo: 'del', nombre: 'Rol' },
    cargo: { articulo: 'del', nombre: 'Cargo' },
    usuario: { articulo: 'del', nombre: 'Usuario' },
    sucursal: { articulo: 'de la', nombre: 'Sucursal' },
    'unidad-medida': { articulo: 'de la', nombre: 'Unidad de Medida' },
    // !AGREGAR MÁS APARTADOS AQUI
  };

  private config = computed(() => {
    const key = this.data()?.view;
    const defaultConfig: ApartadoConfig = {
      articulo: 'del',
      nombre: this.data()?.view,
    };
    return this.configMap[key] || defaultConfig;
  });

  readonly title = computed(() => {
    const mode = this.data().mode;
    const nombre = this.config().nombre;
    return mode === 'create'
      ? `Nuevo ${nombre}`
      : `Actualizar ${nombre}`;

  });

  readonly description = computed(() => {
    const nombre = this.config().nombre?.toLowerCase();
    const articulo = this.config().articulo;
    const mode = this.data().mode;
    return mode === 'create'
      ? `Ingrese la información ${articulo} ${nombre}.`
      : `Actualice la información ${articulo} ${nombre}.`;
  });

  readonly actionText = computed(() =>
    this.data().mode === 'create'
      ? 'Crear'
      : 'Actualizar'
  );

  // ! DATOS PARA ACTUALIZAR
  readonly updateData = computed(() => this.data().dataUpdate);
  readonly apartado = computed(() => this.data().view);
  readonly currentProveedor = computed(() => (this.data().view === 'proveedor' ? (this.updateData() as Proveedor | undefined) ?? null : null));
  readonly currentRol = computed(() => (this.data().view === 'rol' ? (this.updateData() as Role | undefined) ?? null : null));
  readonly currentCargo = computed(() => (this.data().view === 'cargo' ? (this.updateData() as Cargo | undefined) ?? null : null));
  readonly currentUsuario = computed(() => (this.data().view === 'usuario' ? (this.updateData() as User | undefined) ?? null : null));
  readonly currentSucursal = computed(() => (this.data().view === 'sucursal' ? (this.updateData() as Sucursal | undefined) ?? null : null));
  readonly currentUnidadMedida = computed(() => (this.data().view === 'unidad-medida' ? (this.updateData() as UnidadMedidaListar | undefined) ?? null : null));

  submitForm() {
    this.formComponent?.onSubmit();
  }

  onSaveSuccess(result: unknown) {
    this.closed.emit({ saved: true, result });
  }

  onClose() {
    const isSubmitting = Boolean(this.formComponent?.isSubmitting?.());

    if (isSubmitting) {
      this.messageService.add({
        severity: 'info',
        summary: 'Procesando',
        detail: 'Espere a que finalice la operación.',
        life: 2000,
      });
      return;
    }

    this.closed.emit({ saved: false });
  }

  onOverlayClick() {
    this.onClose();
  }
}
