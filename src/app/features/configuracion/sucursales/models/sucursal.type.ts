// ! Tipo para sucursales (respuesta del API)
export type SucursalOption = {
    id: number;
    nombre: string;
};

export type SucursalDTO = {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    activo: boolean;
};
