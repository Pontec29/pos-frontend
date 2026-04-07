import { RoleDTO } from './role.dto';
import { Role } from './role.interface';

export class RoleAdapter {
    static adapt(dto: RoleDTO): Role {
        return {
            id: dto.id,
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            activo: dto.activo
        };
    }

    static adaptList(dtos: RoleDTO[]): Role[] {
        return (dtos || []).map(RoleAdapter.adapt);
    }
}
