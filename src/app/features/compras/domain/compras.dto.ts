export interface CompraDto {
  id: number;
  almacenId: number;
  proveedorId: number;
  proveedorRazonSocial: string;
  proveedorNumeroDocumento: string;
  tipoOperacionId: number;
  tipoOperacionDescripcion: string;
  tipoComprobanteId: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monedaId: string;
  tipoCambio: number;
  observaciones: string;
  totalGravado: number;
  totalInafecto: number;
  totalExonerado: number;
  totalIgv: number;
  totalGratuito: number;
  importeTotal: number;
  estado: number;
  estadoDescripcion: string;
  detalles: DetalleDto[];
}

export interface CompraUpsertDto {
  id?: number;
  almacenId: number;
  proveedorId: number;
  tipoOperacionId: number;
  tipoComprobanteId: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monedaId: string;
  tipoCambio: number;
  observaciones: string;

  // Opciones de Ingreso Almacén
  generaIngreso?: boolean;

  detalles: DetalleDto[];
}

export interface DetalleDto {
  id?: number;
  productoId: number;
  productoNombre: string;
  afectacionIgvId: number;
  afectacionIgvDescripcion: string;
  aplicaIgv: boolean;
  cantidad: number;
  unidadId: number;
  unidadAbreviatura: string;
  factorConversion: number;
  valorUnitario: number;
  precioUnitario: number;
  porcentajeIgv: number;
  codigoLote: string;
  fechaVencimiento: string;
  valorVentaTotal: number;
  totalIgvItem: number;
  precioVentaTotal: number;
}
