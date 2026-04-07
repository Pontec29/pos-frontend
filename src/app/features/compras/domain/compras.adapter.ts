import { CompraDto, CompraUpsertDto } from "./compras.dto";
import { Compra, CompraCrear } from "./compras.interface";

export class ComprasAdapter {
  static adapt(dto: CompraDto): Compra {
    return {
      ID_COMPRA: dto.id,
      PROVEEDOR: dto.proveedorRazonSocial,
      EMPRESA: dto.empresaRazonSocial,
      ID_TIPO_COMPROBANTE: dto.tipoComprobanteId,
      SERIE: dto.serie,
      NUMERO: dto.numero,
      FECHA_EMISION: dto.fechaEmision,
      IMPORTE_TOTAL: dto.importeTotal,
      ESTADO: dto.estado,
      ESTADO_DESCRIPCION: dto.estadoDescripcion,
    };
  }

  static adaptToCreate(form: CompraCrear): CompraUpsertDto {
    return {
      almacenId: form.ID_ALMACEN,
      proveedorId: form.ID_PROVEEDOR,
      tipoComprobanteId: form.ID_TIPO_COMPROBANTE,
      serie: form.SERIE,
      numero: form.NUMERO,
      fechaEmision: form.FECHA_EMISION,
      fechaVencimiento: form.FECHA_VENCIMIENTO,
      monedaId: form.ID_MONEDA,
      tipoCambio: form.TIPO_CAMBIO,
      observaciones: form.OBSERVACIONES,
      detalles: form.DETALLES.map(d => ({
        productoId: d.ID_PRODUCTO,
        cantidad: d.CANTIDAD,
        unidadId: d.ID_UNIDAD,
        valorUnitario: d.VALOR_UNITARIO,
        precioUnitario: d.PRECIO_UNITARIO,
        porcentajeIgv: d.PORCENTAJE_IGV,
        codigoLote: d.CODIGO_LOTE,
        fechaVencimiento: d.FECHA_VENCIMIENTO,
      })),
    };
  }
}
