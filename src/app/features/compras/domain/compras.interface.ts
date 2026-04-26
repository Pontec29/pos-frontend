export interface Compra {
  ID_COMPRA: number;
  PROVEEDOR: string;
  ID_PROVEEDOR: number;
  ID_ALMACEN: number;
  ID_TIPO_OPERACION: number;
  EMPRESA: string;
  ID_TIPO_COMPROBANTE: string;
  SERIE: string;
  NUMERO: string;
  FECHA_EMISION: string;
  FECHA_VENCIMIENTO: string;
  ID_MONEDA: string;
  TIPO_CAMBIO: number;
  IMPORTE_TOTAL: number;
  ESTADO: number;
  ESTADO_DESCRIPCION: string;
  OBSERVACIONES: string;
  DETALLES: Detalle[];
}

export interface CompraCrear {
  ID_COMPRA?: number;
  ID_ALMACEN: number;
  ID_PROVEEDOR: number;
  ID_TIPO_OPERACION: number;
  ID_TIPO_COMPROBANTE: string;
  SERIE: string;
  NUMERO: string;
  FECHA_EMISION: string;
  FECHA_VENCIMIENTO: string;
  ID_MONEDA: string;
  TIPO_CAMBIO: number;
  OBSERVACIONES: string;
  DETALLES: Detalle[];
}

export interface Detalle {
  ID_PRODUCTO: number;
  PRODUCTO_NOMBRE?: string;
  ID_AFECTACION_IGV: number;
  AFECTACION_NOMBRE?: string;
  CANTIDAD: number;
  ID_UNIDAD: number;
  UNIDAD_NOMBRE?: string;
  FACTOR_CONVERSION?: number;
  VALOR_UNITARIO: number;
  PRECIO_UNITARIO: number;
  PORCENTAJE_IGV: number;
  CODIGO_LOTE: string;
  FECHA_VENCIMIENTO: string;
  SUBTOTAL?: number;
  IGV?: number;
  TOTAL?: number;
}

export interface TipoOperacion {
  id: number;
  codigoSunat: string;
  descripcion: string;
  estado: boolean;
}

export interface SunatAfectacionIgv {
  id: number;
  codigoSunat: string;
  descripcion: string;
  aplicaIgv: boolean;
  esBonificacion: boolean;
}



