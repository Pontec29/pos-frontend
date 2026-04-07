import { Role } from '@core/models/document-type.models';
import { RoleDTO } from './role.dto';

export class RoleAdapter {
  static adapt(dto: RoleDTO): Role {
    return {
      id: dto.id,
      name: dto.nombre,
      description: dto.descripcion,
      active: dto.activo,
      tenantId: dto.tenantId
    };
  }
}
