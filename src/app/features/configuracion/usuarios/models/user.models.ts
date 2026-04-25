export interface User {
    id: number;
    personaId?: number;
    tipoDocumento?: string;
    nroDocumento?: string;
    nombres?: string;
    apellidos?: string;
    email: string | null;
    telefono?: string;
    username: string;
    password?: string | null;
    activo: boolean;
    fechaCreacion?: string;

    // Campos adicionales
    companyId?: number;
    companyName?: string | null;
    empresas?: string[];
}
