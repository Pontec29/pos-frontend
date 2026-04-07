// ! VENTAS
export interface RealizarVentaRapidaDTO {
  clientId?: number;
  documentoCliente?: string;
  metodoPagoId?: number;
  precioFinal: number;
  productos: ProductosVentaDTO[];
}

export interface ProductosVentaDTO {
  productoId: number;
  presentationId: number; // ! UNIDAD BASE (CAJA/UNIDAD)
  cantidad: number;
}
