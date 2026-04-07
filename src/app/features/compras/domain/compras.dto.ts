export interface CompraDto {
  id: number;
  proveedorRazonSocial: string;
  empresaRazonSocial: string;
  tipoComprobanteId: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  importeTotal: number;
  estado: number;
  estadoDescripcion: string;
}

export interface CompraUpsertDto {
  id?: number;
  almacenId: number;
  proveedorId: number;
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
  productoId: number;
  cantidad: number;
  unidadId: number;
  valorUnitario: number;
  precioUnitario: number;
  porcentajeIgv: number;
  codigoLote: string;
  fechaVencimiento: string;
}
