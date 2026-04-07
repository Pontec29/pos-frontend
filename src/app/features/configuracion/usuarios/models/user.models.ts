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

    // Campos utilizados en el frontend / lógica previa
    firstName?: string | null;
    lastName?: string | null;
    active?: boolean;
    documentType?: string;
    documentNumber?: string;
    phone?: string;
    companyId?: number;
    companyName?: string | null;
}
