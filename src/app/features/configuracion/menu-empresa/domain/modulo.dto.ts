/**
 * DTO del módulo recibido desde el backend
 * Estructura del API: /api/auth/companies/{id}/modules-tree
 */
export interface ModuloDTO {
    id: number;
    nombre: string;
    icono: string | null;
    ruta: string | null;
    companyModuleId: number | null;
    activo: boolean;
    hijos: ModuloDTO[] | null;
}
