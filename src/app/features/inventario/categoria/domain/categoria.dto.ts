export interface CategoriaDTO {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

// ! CREAR Y ACTUALIZAR
export interface CategoriaUpSertDTO {
  nombre?: string;
  descripcion?: string;
}
