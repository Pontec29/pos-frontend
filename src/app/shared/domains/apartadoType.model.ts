type apartadoType =
  | 'proveedor' | 'usuario' | 'rol' | 'cargo' | 'sucursal' | 'unidad-medida'

export interface ModalData<T>{
  view: apartadoType;
  mode: 'create' | 'update';
  dataUpdate?: T; // ! SOLO PARA ACTUALIZAR
}

export type ApartadoConfig = {
  prefijo?: string;
  articulo?: string;
  nombre?: string;
};
