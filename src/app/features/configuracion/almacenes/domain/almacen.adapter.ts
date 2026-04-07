import { Almacen, AlmacenDTO, CreateAlmacenDTO } from './almacen.type';

/**
 * Adaptador para transformar datos entre API y dominio frontend
 */
export class AlmacenAdapter {

    /** Convierte un DTO del API al modelo del dominio */
    static toModel(dto: AlmacenDTO): Almacen {
        return {
            id: dto.id,
            sucursalId: dto.sucursalId,
            nombre: dto.nombre,
            codigoSunat: dto.codigoSunat,
            esPrincipal: dto.esPrincipal,
            permiteVenta: dto.permiteVenta,
            activo: dto.activo,
        };
    }

    /** Convierte los valores del formulario a un DTO para crear/actualizar */
    static toCreateDTO(form: Record<string, unknown>): CreateAlmacenDTO {
        return {
            sucursalId: form['sucursalId'] as number,
            nombre: form['nombre'] as string,
            codigoSunat: form['codigoSunat'] as string,
            esPrincipal: form['esPrincipal'] as boolean,
            permiteVenta: form['permiteVenta'] as boolean,
        };
    }
}
