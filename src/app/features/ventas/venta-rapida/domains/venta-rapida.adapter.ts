import { RealizarVentaRapidaDTO } from './venta-rapida.dto';
import { RealizarVentaRapida } from './venta-rapida.interface';

export class RealizarVentasAdapter {
  static adaptToCreate(form: RealizarVentaRapida): RealizarVentaRapidaDTO {
    return {
      clientId: form.ID_CLIENTE,
      documentoCliente: form.DOCUMENTO_CLIENTE,
      metodoPagoId: form.ID_METODO_PAGO,
      precioFinal: form.PRECIO_FINAL,
      productos: form.PRODUCTOS.map((p) => ({
        productoId: p.ID_PRODUCTO,
        presentationId: p.ID_PRESENTACION,
        cantidad: p.CANTIDAD,
      })),
    };
  }
}
