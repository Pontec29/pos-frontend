export interface MarcaDTO {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

// ! CREAR Y ACTUALIZAR
export interface MarcaUpSertDTO {
  nombre?: string;
  descripcion?: string
}
