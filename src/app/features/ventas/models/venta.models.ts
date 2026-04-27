// ─────────────────────────────────────────────────────────────────
//  TIPOS BASE
// ─────────────────────────────────────────────────────────────────
export type TipoComprobante = 'FACTURA' | 'BOLETA' | 'TICKET' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
export type FormaPago = 'CONTADO' | 'CREDITO';
export type EstadoVenta = 'EMITIDO' | 'ANULADO' | 'PENDIENTE';
export type TipoMoneda = 'PEN' | 'USD' | 'EUR';
export type TipoAfectacionIGV = '10' | '20' | '30' | '40';

// ─────────────────────────────────────────────────────────────────
//  RESUMEN (para la tabla principal de facturación)
// ─────────────────────────────────────────────────────────────────
export interface VentaResumen {
  id: number;
  tipoComprobanteId: number;    // Antes string, ahora ID numérico (INTEGER en BD)
  comprobanteCodigoSunat: string; // "01", "03", etc.
  serie: string;
  numero: string;
  fEmision: string;             // Antes fechaEmision, ahora fEmision (ISO string)
  clienteNombre: string | null;
  clienteNumeroDocumento: string | null;
  monedaId: number;             // Antes string, ahora ID numérico
  moneda: string;               // ISO "PEN"
  total: number;
  estado: EstadoVenta;
  formaPago: FormaPago;
  enviadoSunat: boolean;
}

// ─────────────────────────────────────────────────────────────────
//  DETALLE (línea de producto)
// ─────────────────────────────────────────────────────────────────
export interface DetalleVentaResponse {
  id: number;
  item: number;
  productoId: number;
  productoCodigo: string | null;
  productoNombre: string;
  productoDescripcion: string | null;

  loteId: number | null;
  loteNumero: string | null;
  fechaVencimiento: string | null;

  cantidad: number;
  unidadMedidaId: number | null;
  unidadMedidaNombre: string | null;

  tipoAfectacionId: string | null;

  precioUnitario: number;
  precioUnitarioTotal: number;
  costoUnitario: number;
  costoUnitarioTotal: number;

  descuentoPorcentaje: number;
  descuentoMonto: number;
  montoDescuentoIgv: number;

  igvPorcentaje: number;
  igvMonto: number;

  subtotal: number;
  total: number;
  observaciones: string | null;
}

// ─────────────────────────────────────────────────────────────────
//  CUOTA
// ─────────────────────────────────────────────────────────────────
export interface CuotaResponse {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  estado: string;
  fechaPago: string | null;
  montoPagado: number;
}

export interface VentaPagoResponse {
  id: number;
  metodoPagoId: number;
  monto: number;
  referencia: string | null;
}

// ─────────────────────────────────────────────────────────────────
//  RESPUESTA COMPLETA (detalle de una venta)
// ─────────────────────────────────────────────────────────────────
export interface VentaResponse {
  id: number;
  sucursalId: number;
  almacenId: number;

  tipoComprobanteId: number;
  comprobanteCodigoSunat: string;
  serie: string;
  numero: string;
  fEmision: string;
  fVencimiento: string | null; // LocalDateTime -> string

  clienteId: number | null;
  clienteTipoDocumentoId: number | null;
  clienteNumeroDocumento: string | null;
  clienteNombre: string | null;

  monedaId: number;
  moneda: string;
  tipoCambio: number;

  subtotal: number;
  descuentoPorcentaje: number;
  totalGravado: number;
  totalInafecto: number;
  totalExonerado: number;
  totalGratuito: number;
  totalExportacion: number;
  descuentoMonto: number;
  igvPorcentaje: number;
  igvMonto: number;
  total: number;

  detraccion: boolean;
  montoDetraccion: number;
  porcentajeDetraccion: number;

  retencion: boolean;
  montoRetencion: number;
  porcentajeRetencion: number;

  totalNeto: number;

  estado: EstadoVenta;
  metodoPagoId: number;
  formaPago: FormaPago;
  diasCredito: number;
  fechaVencimiento: string | null; // Pago (DATE) -> string

  cajaId: number | null;
  idUsuarioVendedor: number;

  observaciones: string | null;
  motivoAnulacion: string | null;
  tieneReceta: boolean;
  recetaId: number | null;

  enviadoSunat: boolean;
  fechaEnvioSunat: string | null;
  codigoHashSunat: string | null;

  fCreacion: string;

  detalles: DetalleVentaResponse[];
  cuotas: CuotaResponse[];
  pagos: VentaPagoResponse[];
}

// ─────────────────────────────────────────────────────────────────
//  REQUEST — Detalle
// ─────────────────────────────────────────────────────────────────
export interface DetalleVentaRequest {
  productoId: number;
  productoCodigo?: string;
  productoNombre: string;
  productoDescripcion?: string;

  loteId?: number;
  loteNumero?: string;
  fechaVencimiento?: string;

  cantidad: number;
  unidadMedidaId?: number;
  unidadMedidaNombre?: string;

  tipoAfectacionId?: string;

  precioUnitario: number;
  precioUnitarioTotal: number;
  costoUnitario: number;
  costoUnitarioTotal: number;

  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  montoDescuentoIgv?: number;

  igvPorcentaje?: number;
  igvMonto?: number;

  subtotal: number;
  total: number;
  observaciones?: string;
}

// ─────────────────────────────────────────────────────────────────
//  REQUEST — Cuota
// ─────────────────────────────────────────────────────────────────
export interface CuotaRequest {
  numeroCuota: number;
  fechaVencimiento: string;   // ISO date YYYY-MM-DD
  monto: number;
}

// ─────────────────────────────────────────────────────────────────
//  REQUEST — Crear Venta
// ─────────────────────────────────────────────────────────────────
export interface VentaRequest {
  sucursalId: number;
  almacenId: number;

  tipoComprobanteId: number;
  comprobanteCodigoSunat: string;
  serie: string;
  numero: string;
  fVencimiento?: string;
  fechaVencimiento?: string; // Pago

  clienteId?: number;
  clienteTipoDocumentoId?: number;
  clienteNumeroDocumento?: string;
  clienteNombre?: string;

  monedaId: number;
  moneda: string;
  tipoCambio?: number;

  subtotal?: number;
  descuentoPorcentaje?: number;
  totalGravado?: number;
  totalInafecto?: number;
  totalExonerado?: number;
  totalGratuito?: number;
  totalExportacion?: number;
  descuentoMonto?: number;
  igvPorcentaje?: number;
  igvMonto?: number;
  total: number;

  detraccion?: boolean;
  montoDetraccion?: number;
  porcentajeDetraccion?: number;

  retencion?: boolean;
  montoRetencion?: number;
  porcentajeRetencion?: number;

  totalNeto: number;

  metodoPagoId: number;
  formaPago: string; // "CONTADO" | "CREDITO"
  diasCredito?: number;

  cajaId?: number;
  idUsuarioVendedor: number;

  observaciones?: string;
  tieneReceta?: boolean;
  recetaId?: number;

  detalles: DetalleVentaRequest[];
  cuotas?: CuotaRequest[];
  pagos: { metodoPagoId: number; monto: number; referencia?: string }[];
}

// ─────────────────────────────────────────────────────────────────
//  OPCIONES DE SELECTORES (Valores dummy para que no rompa, el componente debe mapear IDs reales)
// ─────────────────────────────────────────────────────────────────
export const TIPOS_COMPROBANTE = [
  { label: 'Factura', value: 1, sunat: '01' },
  { label: 'Boleta', value: 2, sunat: '03' },
  { label: 'Nota de Crédito', value: 3, sunat: '07' },
  { label: 'Nota de Débito', value: 4, sunat: '08' },
];

export const FORMAS_PAGO = [
  { label: 'Contado', value: 'CONTADO' },
  { label: 'Crédito', value: 'CREDITO' },
];

export const TIPOS_AFECTACION = [
  { label: '10 – Gravado Op. Onerosa', value: '10' },
  { label: '20 – Exonerado Op. Onerosa', value: '20' },
  { label: '30 – Inafecto Op. Onerosa', value: '30' },
  { label: '40 – Exportación', value: '40' },
];
