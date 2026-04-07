export interface RoleDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  tenantId?: number;
}
