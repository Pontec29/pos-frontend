export interface Compra {
  ID_COMPRA: number;
  PROVEEDOR: string;
  EMPRESA: string;
  ID_TIPO_COMPROBANTE: string;
  SERIE: string;
  NUMERO: string;
  FECHA_EMISION: string;
  IMPORTE_TOTAL: number;
  ESTADO: number;
  ESTADO_DESCRIPCION: string;
}

export interface CompraCrear {
  ID_COMPRA?: number;
  ID_ALMACEN: number;
  ID_PROVEEDOR: number;
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
  CANTIDAD: number;
  ID_UNIDAD: number;
  VALOR_UNITARIO: number;
  PRECIO_UNITARIO: number;
  PORCENTAJE_IGV: number;
  CODIGO_LOTE: string;
  FECHA_VENCIMIENTO: string;
}

