// ! LISTAR
export interface Producto {
  ID_PRODUCTO: number;
  SKU: string;
  CODIGO_BARRAS: string;
  NOMBRE: string;
  TIPO_PRODUCTO: string;
  MARCA_NOMBRE?: string;
  CATEGORIA_NOMBRE?: string;
  PRECIO_VENTA: number;
  TIPO_CONTROL_STOCK?: string;
  ACTIVO: boolean;
}

// ! CREAR Y EDITAR
export interface ProductoUpSert {
  NOMBRE?: string;
  ID_MARCA?: number;
  TIPO_PRODUCTO?: string;
  CODIGO_BARRAS?: string;
  SKU?: string;
  CODIGO_INTERNO?: string;
  ID_UNIDAD?: number;
  ID_CATEGORIA?: number;
  DESCRIPCION?: string;

  // ! UNIDADES Y PRECIOS
  ID_MONEDA?: string;
  PRECIO_COMPRA?: number;
  PRECIO_VENTA?: number;
  PRECIO_MINIMO_VENTA?: number;

  PRESENTACIONES?: PresentacionUpSert[];

  // ! CONFIGURACIÓN
  CODIGO_AFECTACION_IGV?: string;
  PORCENTAJE_IGV?: number;
  CONTROLAR_STOCK?: boolean;
  STOCK_MINIMO?: number;
  STOCK_MAXIMO?: number;
  TIPO_CONTROL_STOCK?: string;
  ACTIVO_TIENDA_ONLINE?: boolean;

  // ! STOCK DE APERTURA
  STOCK_APERTURA?: StockAperturaUpSert;
  
  IMAGEN_URL?: string;
}

export interface PresentacionUpSert {
  ID_UNIDAD: number;
  PRECIO_VENTA: number;
  FACTOR_CONVERSION_BASE: number;
  CODIGO_BARRAS: string;
  ES_PRINCIPAL: boolean;
  ACTIVO?: boolean;
}

export interface StockAperturaUpSert {
  ID_ALMACEN?: number;
  CANTIDAD: number;
  LOTE?: string; // Solo si tipoControlStock es LOTE
  FECHA_VENCIMIENTO?: string; // Solo si tipoControlStock es LOTE
  SERIES?: string[]; // Solo si tipoControlStock es SERIE
}

// ! VISTA
export interface ProductoView {
  ID_PRODUCTO: number;
  NOMBRE: string;
  ID_MARCA: number;
  TIPO_PRODUCTO: string;
  CODIGO_BARRAS: string;
  SKU: string;
  CODIGO_INTERNO: string;
  ID_CATEGORIA: number;
  ID_UNIDAD: number;
  DESCRIPCION: string;

  ID_MONEDA: string;
  PRECIO_COMPRA: number;
  PRECIO_VENTA: number;
  PRECIO_MINIMO_VENTA: number;

  CODIGO_AFECTACION_IGV: string;
  PORCENTAJE_IGV: number;
  CONTROLAR_STOCK: boolean;
  STOCK_MINIMO: number;
  STOCK_MAXIMO: number;
  TIPO_CONTROL_STOCK: string;
  ACTIVO_TIENDA_ONLINE: boolean;

  IMPUESTO_ICBPER: number;
  PERMITIR_VENTA_SIN_STOCK: boolean;
  REGISTRO_SANITARIO: string;
  CONDICION_VENTA: string;
  LABORATORIO_ID: number;
  ACCION_FARMACOLOGICA_ID: number;
  IMAGEN_URL: string;
  STOCK_APERTURA: StockAperturaUpSert;
  EDITABLE: boolean;

  ACTIVO: boolean;
  PRESENTACIONES: PresentacionUpSert[];
}

// ! LISTA DE PRODUCTOS PARA VENTA RÁPIDA
export interface ProductoVentaRapidaBase {
  pagina: number;
  cantidad: number;
  cantidadDevuelta: number;
  totalRegistros: number;
  totalPaginas: number;
  productos: ProductoVentaRapida[];
}

export interface ProductoVentaRapida {
  id: number;
  nombre: string;
  codigo: string;
  stockTotal: number;
  categoria: string;
  preciosPorUnidad: PrecioPorUnidad[];
}

export interface PrecioPorUnidad {
  unidadId: number;
  unidadNombre: string;
  unidadAbreviatura: string;
  factorConversionBase: number;
  precioVenta: number;
  esPrincipal: boolean;
}
