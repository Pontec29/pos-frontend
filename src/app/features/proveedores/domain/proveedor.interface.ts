// ! LISTAR
export interface Proveedor {
  ID_PROVEEDOR: number;
  RUC: string;
  RAZONSOCIAL: string;
  CODIGO?: string;
  NOMBRE_PROVEEDOR: string;
  NOMBRES?: string;
  APELLIDOS?: string;
  TELEFONO?: string;
  EMAIL?: string;
  DIRECCION?: string;
  UBIGEO?: string;
  ACTIVO: boolean;
}

// ! CREAR Y EDITAR
export interface ProveedorCrear {
  NUMERO_DOCUMENTO: string;
  NOMBRES: string;
  APELLIDOS: string;
  DIRECCION: string;
  ID_UBIGEO: string;
  EMAIL: string;
  TELEFONO_SECUNDARIO?: string;
  RAZON_SOCIAL?: string;
  TELEFONO_PRINCIPAL: string;
  NOMBRE_COMERCIAL?: string;
}

// ! CAMBIAR ESTADO


