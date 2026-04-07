// ! VENTAS
export interface RealizarVentaRapida {
  ID_CLIENTE?: number;
  DOCUMENTO_CLIENTE?: string;
  ID_METODO_PAGO?: number;
  PRECIO_FINAL: number;
  PRODUCTOS: ProductosVenta[];
}

export interface ProductosVenta {
  ID_PRODUCTO: number;
  ID_PRESENTACION: number; // ! UNIDAD BASE (CAJA/UNIDAD)
  CANTIDAD: number;
}

// ! TARJETAS
export interface ProductCard {
  ID_PRODUCTO: number;
  CODIGO: string;
  NOMBRE: string;
  CATEGORIA_NOMBRE?: string;
  LABORATORIO_NOMBRE?: string;
  STOCK: number;
  PRECIO_CAJA: number;
  PRECIO_UNIDAD: number;
}

// ! FILTROS AVANZADOS
export interface FilterAdvanceProductos {
  ID_CATEGORIA?: number;
  ID_LABORATORIO?: number;
  ID_PRESENTACION?: number;
}
