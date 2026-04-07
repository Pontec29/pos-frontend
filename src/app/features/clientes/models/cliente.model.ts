/**
 * Interfaz que representa un cliente tal como lo retorna el API (GET /api/v1/clientes).
 */
// TODO: Se utiliza en el buscador (autocomplete) de clientes
export interface Cliente {
    id: number;
    tipoDocumento: string;
    numeroDocumento: string;
    razonSocial: string;
    direccionFiscal: string;
    correoElectronico: string;
    telefono: string;
    esCliente: boolean;
    esProveedor: boolean;
    estado: boolean;
}

/**
 * Para la tabla de clientes
 */
export interface ClienteTable {
    id: number;
    tipoDocumento: string;
    numeroDocumento: string;
    razonSocial: string;
    nombreComercial: string;
    email: string;
    telefonoPrincipal: string;
    genero: string | null;
    fechaCreacion: string;
    activo: boolean;
}

/**
 * DTO para crear o actualizar un cliente (POST/PUT /api/v1/clientes).
 */
export interface ClienteFormDto {
    id?: number;
    tipoDocCodigo: string;
    numeroDocumento: string;
    razonSocial: string;
    nombreComercial: string;
    nombres: string;
    apellidos: string;
    direccionFiscal: string;
    ubigeoId: string;
    email: string;
    telefonoPrincipal: string;
    genero: string | null;
}

/** Opciones genéricas para selects */
export type SelectOption<T extends string | number | boolean = string> = {
    label: string;
    value: T;
};
