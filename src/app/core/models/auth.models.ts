export interface LoginRequest {
    username?: string;
    password?: string;
    email?: string; // Supporting both for flexibility until API confirmed
}

export interface LoginResponse {
    token: string;
    username: string;
    role: string;
    companyName: string;
    tenantId: number;
    estadoCaja: string | null;
    sesionId: number | null;
    jerarquia: JerarquiaSucursal[];
}

export interface UserCompany {
    tenantId: number;
    companyName: string;
    roleName: string;
    defaultCompany: boolean;
}

export interface JerarquiaAlmacen {
    almacenId: number;
    nombre: string;
    esPrincipal: boolean;
}

export interface JerarquiaSucursal {
    sucursalId: number;
    nombre: string;
    almacenes: JerarquiaAlmacen[];
}
