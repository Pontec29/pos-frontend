import { CompraDto, CompraUpsertDto } from "./compras.dto";
import { Compra, CompraCrear } from "./compras.interface";

export class ComprasAdapter {
  static adapt(dto: CompraDto): Compra {
    return {
      ID_COMPRA: dto.id,
      PROVEEDOR: dto.proveedorRazonSocial,
      ID_PROVEEDOR: dto.proveedorId,
      ID_ALMACEN: dto.almacenId,
      ID_TIPO_OPERACION: dto.tipoOperacionId,
      EMPRESA: dto.proveedorRazonSocial,
      ID_TIPO_COMPROBANTE: dto.tipoComprobanteId,
      SERIE: dto.serie,
      NUMERO: dto.numero,
      FECHA_EMISION: dto.fechaEmision,
      FECHA_VENCIMIENTO: dto.fechaVencimiento,
      ID_MONEDA: dto.monedaId,
      TIPO_CAMBIO: dto.tipoCambio,
      IMPORTE_TOTAL: dto.importeTotal,
      ESTADO: dto.estado,
      ESTADO_DESCRIPCION: dto.estadoDescripcion,
      OBSERVACIONES: dto.observaciones,
      DETALLES: dto.detalles?.map(d => ({
        ID_PRODUCTO: d.productoId,
        PRODUCTO_NOMBRE: d.productoNombre,
        ID_AFECTACION_IGV: d.afectacionIgvId,
        AFECTACION_NOMBRE: d.afectacionIgvDescripcion,
        CANTIDAD: d.cantidad,
        ID_UNIDAD: d.unidadId,
        UNIDAD_NOMBRE: d.unidadAbreviatura,
        FACTOR_CONVERSION: d.factorConversion,
        VALOR_UNITARIO: d.valorUnitario,
        PRECIO_UNITARIO: d.precioUnitario,
        PORCENTAJE_IGV: d.porcentajeIgv,
        CODIGO_LOTE: d.codigoLote,
        FECHA_VENCIMIENTO: d.fechaVencimiento,
        SUBTOTAL: d.valorVentaTotal,
        IGV: d.totalIgvItem,
        TOTAL: d.precioVentaTotal
      }))
    };
  }

  static adaptToCreate(form: CompraCrear | any): CompraUpsertDto {
    return {
      almacenId: form.ID_ALMACEN,
      proveedorId: form.ID_PROVEEDOR,
      tipoOperacionId: form.ID_TIPO_OPERACION,
      tipoComprobanteId: form.ID_TIPO_COMPROBANTE,
      serie: form.SERIE,
      numero: form.NUMERO,
      fechaEmision: form.FECHA_EMISION,
      fechaVencimiento: form.FECHA_VENCIMIENTO,
      monedaId: form.ID_MONEDA,
      tipoCambio: form.TIPO_CAMBIO,
      observaciones: form.OBSERVACIONES,
      generaIngreso: form.GENERA_INGRESO,
      detalles: form.DETALLES.map((d: any) => ({
        productoId: d.ID_PRODUCTO,
        afectacionIgvId: d.ID_AFECTACION_IGV,
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
