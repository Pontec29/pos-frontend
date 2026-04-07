// ! DTO — Respuesta del API (exactamente como viene del backend)
export type SucursalDTO = {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    activo: boolean;
};

// ! Modelo del dominio frontend
export type Sucursal = {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    activo: boolean;
};

// ! DTO para crear y actualizar
export type CreateSucursalDTO = {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
};
