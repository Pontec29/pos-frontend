import { Sucursal, SucursalDTO, CreateSucursalDTO } from './sucursal.type';

/**
 * Adaptador para transformar datos entre API y dominio frontend
 */
export class SucursalAdapter {

    /** Convierte un DTO del API al modelo del dominio */
    static toModel(dto: SucursalDTO): Sucursal {
        return {
            id: dto.id,
            nombre: dto.nombre,
            direccion: dto.direccion,
            telefono: dto.telefono,
            email: dto.email,
            activo: dto.activo,
        };
    }

    /** Convierte los valores del formulario a un DTO para crear/actualizar */
    static toCreateDTO(form: Record<string, unknown>): CreateSucursalDTO {
        return {
            nombre: form['nombre'] as string,
            direccion: form['direccion'] as string,
            telefono: form['telefono'] as string,
            email: form['email'] as string,
        };
    }
}
