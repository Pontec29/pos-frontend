export interface CompraDto {
  id: number;
  proveedorRazonSocial: string;
  proveedorNumeroDocumento: string;
  tipoOperacionId: number;
  tipoOperacionDescripcion: string;
  tipoComprobanteId: string;
  serie: string;
  numero: string;
  fechaEmision: string;
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
  detalles: DetalleDto[];
}

export interface DetalleDto {
  id?: number;
  productoId: number;
  productoNombre?: string;
  afectacionIgvId: number;
  afectacionIgvDescripcion?: string;
  aplicaIgv?: boolean;
  cantidad: number;
  unidadId: number;
  unidadAbreviatura?: string;
  valorUnitario: number;
  precioUnitario: number;
  porcentajeIgv: number;
  valorVentaTotal?: number;
  totalIgvItem?: number;
  precioVentaTotal?: number;
  codigoLote: string;
  fechaVencimiento: string;
}
