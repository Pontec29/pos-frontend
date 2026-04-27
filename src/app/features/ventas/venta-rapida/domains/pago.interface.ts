export interface MetodoPago {
  id: number;
  tipo: string;
  codigo: string;
  descripcion: string;
  requiereReferencia: boolean;
  activo: boolean;
}

export interface VentaPagoRequest {
  metodoPagoId: number;
  monto: number;
  referencia?: string;
}

export interface VentaCuotaRequest {
  monto: number;
  fechaVencimiento: Date | string;
}
