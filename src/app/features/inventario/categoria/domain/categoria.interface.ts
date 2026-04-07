export interface Categoria {
  ID_CATEGORIA: number;
  NOMBRE: string;
  DESCRIPCION: string;
  ACTIVO: boolean;
}

// ! CREAR Y ACTUALIZAR
export interface CategoriaUpSert {
  NOMBRE?: string;
  DESCRIPCION?: string;
}
