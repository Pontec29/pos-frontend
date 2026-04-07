import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

/**
 * Tipos de confirmación predefinidos
 */
export type ConfirmationType =
    | 'delete'      // Eliminar elemento
    | 'activate'    // Activar elemento
    | 'deactivate'  // Desactivar elemento
    | 'save'        // Guardar cambios
    | 'discard'     // Descartar cambios
    | 'custom';     // Personalizado

/**
 * Opciones para confirmación personalizada
 */
export interface CustomConfirmOptions {
    title: string;
    message: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptButtonStyleClass?: string;
}

/**
 * Servicio para simplificar el uso de diálogos de confirmación
 * 
 * @example
 * // Uso simple
 * confirmDialogService.confirm('delete', 'Usuario', () => {
 *   this.deleteUser();
 * });
 * 
 * @example
 * // Con nombre dinámico
 * confirmDialogService.confirm('delete', user.name, () => {
 *   this.userService.delete(user.id);
 * });
 */
@Injectable({
    providedIn: 'root'
})
export class ConfirmDialogService {
    private readonly confirmationService = inject(ConfirmationService);

    /**
     * Muestra un diálogo de confirmación con configuración predefinida
     * 
     * @param type Tipo de confirmación
     * @param itemName Nombre del elemento (ej: "Usuario", "Rol", etc.)
     * @param onAccept Callback cuando se acepta
     * @param onReject Callback opcional cuando se rechaza
     */
    confirm(
        type: ConfirmationType,
        itemName: string,
        onAccept: () => void,
        onReject?: () => void
    ): void {
        const config = this.getConfiguration(type, itemName);

        this.confirmationService.confirm({
            message: config.message,
            header: '',
            icon: config.icon,
            acceptLabel: config.acceptLabel,
            rejectLabel: config.rejectLabel,
            acceptButtonStyleClass: config.acceptButtonStyleClass,
            accept: onAccept,
            reject: onReject
        });
    }

    /**
     * Muestra un diálogo de confirmación personalizado
     * 
     * @param options Opciones personalizadas
     * @param onAccept Callback cuando se acepta
     * @param onReject Callback opcional cuando se rechaza
     */
    confirmCustom(
        options: CustomConfirmOptions,
        onAccept: () => void,
        onReject?: () => void
    ): void {
        this.confirmationService.confirm({
            header: '',
            message: options.message,
            icon: options.icon || 'pi pi-exclamation-triangle',
            acceptLabel: options.acceptLabel || 'Confirm',
            rejectLabel: options.rejectLabel || 'Cancel',
            acceptButtonStyleClass: options.acceptButtonStyleClass || 'delete',
            accept: onAccept,
            reject: onReject
        });
    }

    /**
     * Obtiene la configuración predefinida según el tipo
     */
    private getConfiguration(type: ConfirmationType, itemName: string) {
        const configs = {
            delete: {
                title: `Eliminar ${itemName}`,
                message: `¿Estás seguro de que deseas eliminar este ${itemName.toLowerCase()}?`,
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'delete'
            },
            activate: {
                title: `Activar ${itemName}`,
                message: `¿Estás seguro de que deseas activar "${itemName}"?`,
                icon: 'pi pi-check-circle',
                acceptLabel: 'Activar',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'success'
            },
            deactivate: {
                title: `Desactivar ${itemName}`,
                message: `¿Estás seguro de que deseas desactivar "${itemName}"?`,
                icon: 'pi pi-exclamation-circle',
                acceptLabel: 'Desactivar',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'delete'
            },
            save: {
                title: 'Guardar cambios',
                message: `¿Deseas guardar los cambios realizados?`,
                icon: 'pi pi-save',
                acceptLabel: 'Guardar',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'primary'
            },
            discard: {
                title: 'Descartar cambios',
                message: 'Tienes cambios sin guardar. ¿Deseas salir sin guardar?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Salir sin guardar',
                rejectLabel: 'Continuar editando',
                acceptButtonStyleClass: 'delete'
            },
            custom: {
                title: 'Confirmar',
                message: '¿Estás seguro?',
                icon: 'pi pi-question-circle',
                acceptLabel: 'Confirmar',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'primary'
            }
        };

        return configs[type];
    }
}
