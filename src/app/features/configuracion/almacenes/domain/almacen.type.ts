// ! DTO — Respuesta del API (exactamente como viene del backend)
export type AlmacenDTO = {
    id: number;
    sucursalId: number;
    nombre: string;
    codigoSunat: string;
    esPrincipal: boolean;
    permiteVenta: boolean;
    activo: boolean;
};

// ! Modelo del dominio frontend
export type Almacen = {
    id: number;
    sucursalId: number;
    nombre: string;
    codigoSunat: string;
    esPrincipal: boolean;
    permiteVenta: boolean;
    activo: boolean;
};

// ! DTO para crear y actualizar
export type CreateAlmacenDTO = {
    sucursalId: number;
    nombre: string;
    codigoSunat: string;
    esPrincipal: boolean;
    permiteVenta: boolean;
};
