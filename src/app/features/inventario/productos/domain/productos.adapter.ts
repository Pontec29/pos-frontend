import { Producto, ProductoUpSert, PresentacionUpSert, ProductoView } from "./productos.interface";
import { ProductoDTO, ProductoUpSertDTO, ProductoViewDTO } from "./productos.dto";

export class ProductoAdapter {
  static adapt(p: ProductoDTO): Producto {
    return {
      ID_PRODUCTO: p.id,
      SKU: p.sku,
      CODIGO_BARRAS: p.codigoBarras,
      NOMBRE: p.nombre,
      TIPO_PRODUCTO: p.tipoProducto,
      MARCA_NOMBRE: p.marcaNombre,
      CATEGORIA_NOMBRE: p.categoriaNombre,
      PRECIO_VENTA: p.precioVenta,
      TIPO_CONTROL_STOCK: p.tipoControlStock,
      ACTIVO: p.activo
    };
  }

  static adaptToView(p: ProductoViewDTO): ProductoView {
    return {
      ID_PRODUCTO: p.id,
      NOMBRE: p.nombre,
      ID_MARCA: p.marcaId,
      TIPO_PRODUCTO: p.tipoProducto,
      CODIGO_BARRAS: p.codigoBarras,
      SKU: p.sku,
      CODIGO_INTERNO: p.codigoInterno,
      ID_CATEGORIA: p.categoriaId,
      ID_UNIDAD: p.unidadId,
      DESCRIPCION: p.descripcion,

      ID_MONEDA: p.monedaId,
      PRECIO_COMPRA: Number(p.precioCompra),
      PRECIO_VENTA: Number(p.precioVenta),
      PRECIO_MINIMO_VENTA: Number(p.precioMinimoVenta),

      CODIGO_AFECTACION_IGV: p.codigoAfectacionIgv,
      PORCENTAJE_IGV: Number(p.porcentajeIgv),
      CONTROLAR_STOCK: Boolean(p.controlarStock),
      STOCK_MINIMO: Number(p.stockMinimo),
      STOCK_MAXIMO: Number(p.stockMaximo),
      TIPO_CONTROL_STOCK: p.tipoControlStock,
      ACTIVO_TIENDA_ONLINE: Boolean(p.activoTiendaOnline),

      IMPUESTO_ICBPER: Number(p.impuestoIcbper),
      PERMITIR_VENTA_SIN_STOCK: Boolean(p.permitirVentaSinStock),
      REGISTRO_SANITARIO: p.registroSanitario,
      CONDICION_VENTA: p.condicionVenta,
      LABORATORIO_ID: p.laboratorioId,
      ACCION_FARMACOLOGICA_ID: p.accionFarmacologicaId,
      IMAGEN_URL: p.imagenUrl,

      STOCK_APERTURA: p.stockApertura ? {
        ID_ALMACEN: p.stockApertura.almacenId,
        CANTIDAD: Number(p.stockApertura.cantidad),
        LOTE: p.stockApertura.lote,
        FECHA_VENCIMIENTO: p.stockApertura.fechaVencimiento,
        SERIES: p.stockApertura.series
      } : undefined as any,

      EDITABLE: Boolean(p.editable),
      ACTIVO: Boolean(p.activo),

      PRESENTACIONES: p.presentaciones?.map(pres => ({
        ID_UNIDAD: pres.unidadId,
        PRECIO_VENTA: Number(pres.precioVenta),
        FACTOR_CONVERSION_BASE: Number(pres.factorConversionBase),
        CODIGO_BARRAS: pres.codigoBarras,
        ES_PRINCIPAL: Boolean(pres.esPrincipal),
        ACTIVO: Boolean(pres.activo)
      })) || []
    };
  }

  static adaptToUpSert(form: ProductoUpSert): ProductoUpSertDTO {
    const dto: ProductoUpSertDTO = {
      nombre: form.NOMBRE,
      marcaId: form.ID_MARCA,
      unidadId: form.ID_UNIDAD,
      tipoProducto: form.TIPO_PRODUCTO,
      codigoBarras: form.CODIGO_BARRAS,
      sku: form.SKU,
      // codigoInterno: form.CODIGO_INTERNO,
      categoriaId: form.ID_CATEGORIA,
      descripcion: form.DESCRIPCION,

      monedaId: form.ID_MONEDA,
      precioCompra: form.PRECIO_COMPRA,
      precioVenta: form.PRECIO_VENTA,
      precioMinimoVenta: form.PRECIO_MINIMO_VENTA,

      presentaciones: form.PRESENTACIONES?.map(p => ({
        unidadId: p.ID_UNIDAD,
        precioVenta: p.PRECIO_VENTA,
        factorConversionBase: p.FACTOR_CONVERSION_BASE,
        codigoBarras: p.CODIGO_BARRAS,
        esPrincipal: p.ES_PRINCIPAL,
        activo: p.ACTIVO,
      })),

      codigoAfectacionIgv: form.CODIGO_AFECTACION_IGV,
      porcentajeIgv: form.PORCENTAJE_IGV,
      controlarStock: form.CONTROLAR_STOCK,
      stockMinimo: form.STOCK_MINIMO,
      stockMaximo: form.STOCK_MAXIMO,
      tipoControlStock: form.TIPO_CONTROL_STOCK, // ! SOLO PERMITE 'NORMAL', 'LOTE' O 'SERIE'
      activoTiendaOnline: form.ACTIVO_TIENDA_ONLINE,

      stockApertura: form.STOCK_APERTURA ? {
        almacenId: form.STOCK_APERTURA.ID_ALMACEN ?? 1, // Default value if needed
        cantidad: form.STOCK_APERTURA.CANTIDAD,
        lote: form.STOCK_APERTURA.LOTE,
        fechaVencimiento: form.STOCK_APERTURA.FECHA_VENCIMIENTO,
        series: form.STOCK_APERTURA.SERIES,
      } : undefined,

      imagenUrl: form.IMAGEN_URL
    };
    return this.cleanPayload(dto);
  }

  static formToPayload(formValue: any, presentaciones: import('./productos.interface').PresentacionUpSert[], seriales?: string[]): ProductoUpSert {
    const stockApertura = formValue.stockInicial > 0 ? {
      ID_ALMACEN: 1, // Assuming default value based on example
      CANTIDAD: formValue.stockInicial,
      LOTE: formValue.tipoControlStock === 'LOTE' ? formValue.codigoLote : undefined,
      FECHA_VENCIMIENTO: formValue.tipoControlStock === 'LOTE' ? formValue.fechaVencimiento : undefined,
      SERIES: formValue.tipoControlStock === 'SERIE' ? (seriales && seriales.length > 0 ? seriales : (formValue.numeroSerie ? [formValue.numeroSerie] : undefined)) : undefined
    } : undefined;

    return {
      NOMBRE: formValue.nombreProducto,
      ID_MARCA: formValue.marcaId,
      TIPO_PRODUCTO: formValue.tipoProducto,
      CODIGO_BARRAS: formValue.codigoBarra,
      ID_UNIDAD: formValue.unidadMedidaId,
      SKU: formValue.sku,
      // CODIGO_INTERNO: formValue.codigoInterno,
      ID_CATEGORIA: formValue.categoriaId,
      DESCRIPCION: formValue.description,

      ID_MONEDA: formValue.monedaId,
      PRECIO_COMPRA: Number(formValue.precioCompra),
      PRECIO_VENTA: Number(formValue.precioVenta),
      PRECIO_MINIMO_VENTA: Number(formValue.precioMinimoVenta),

      PRESENTACIONES: presentaciones,

      CODIGO_AFECTACION_IGV: formValue.afectacionIgvId,
      PORCENTAJE_IGV: 18.00,
      CONTROLAR_STOCK: formValue.controlStock,
      STOCK_MINIMO: formValue.minStock,
      STOCK_MAXIMO: formValue.maxStock,
      TIPO_CONTROL_STOCK: formValue.tipoControlStock,
      ACTIVO_TIENDA_ONLINE: formValue.activeOnlineStore,
      // PERMITIR_VENTA_SIN_STOCK: formValue.negativeStock,

      IMAGEN_URL: formValue.image,

      STOCK_APERTURA: stockApertura
    };
  }

  private static cleanPayload(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      const cleanedArray = obj
        .map(item => this.cleanPayload(item))
        .filter(item => item !== undefined && item !== null);
      return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    if (typeof obj === 'object') {
      const cleanedObj: any = {};
      let hasValidFields = false;

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const cleanedValue = this.cleanPayload(value);

          if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
            cleanedObj[key] = cleanedValue;
            hasValidFields = true;
          }
        }
      }
      return hasValidFields ? cleanedObj : undefined;
    }
    return obj;
  }
}
