export interface MarcaListar {
  ID_MARCA: number;
  NOMBRE: string;
  DESCRIPCION: string;
  ACTIVO: boolean;
}

export interface MarcaUpSert {
  NOMBRE?: string;
  DESCRIPCION?: string;
}
