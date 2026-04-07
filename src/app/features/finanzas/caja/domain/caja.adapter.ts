import {
  AperturaCajaRegistroDTO,
  CajaAbiertaCerradaDTO,
  CrearCajaDTO,
  CierreCajaRegistroDTO,
  DenominacionesDTO,
  CajaAbiertaDTO,
  ConsultarEstadoSesionDTO,
  CajaSesionesListarDTO,
} from './caja.dto';
import {
  AperturaCajaRegistro,
  CajaAbiertaCerrada,
  CrearCaja,
  CierreCajaRegistro,
  Denominaciones,
  CajaAbierta,
  ConsultarEstadoSesion,
  CajaSesionesListar,
} from './caja.interface';

export class CajaAdapter {
  static adaptDenominacion(item: DenominacionesDTO): Denominaciones {
    return {
      ID_DENOMINACION: item.id,
      ID_MONEDA: item.monedaId,
      VALOR: item.valor,
      TIPO: item.tipo,
      IMAGEN_URL: item.imagenUrl,
      ESTADO: item.activo,
    };
  }

  static adaptCajaAbiertaCerrada(item: CajaAbiertaCerradaDTO): CajaAbiertaCerrada {
    return {
      ID_CAJA_ABIERTA: item.id,
      ID_SUCURSAL: item.sucursalId,
      CAJA_NOMBRE: item.nombre,
      CODIGO: item.codigo,
      DESCRIPCION: item.descripcion,
      TIPO_CAJA: item.tipoCaja,
      ESTADO: item.activo,
      EN_USO: item.enUso,
    };
  }

  static adaptCajaSesionesListar(item: CajaSesionesListarDTO): CajaSesionesListar {
    return {
      ID_SESION: item.id,
      ID_CAJA: item.cajaId,
      CAJA_NOMBRE: item.cajaNombre,
      ID_USUARIO_APERTURA: item.idUsuarioApertura,
      FECHA_APERTURA: item.fechaApertura,
      FECHA_CIERRE: item.fechaCierre,
      ESTADO: item.estado,
      MONTO_APERTURA_PEN: item.montoAperturaPen,
      MONTO_APERTURA_USD: item.montoAperturaUsd,
      MONTO_CIERRE_ESPERADO_PEN: item.montoCierreEsperadoPen,
      MONTO_CIERRE_REAL_PEN: item.montoCierreRealPen,
      MONTO_DIFERENCIA_PEN: item.montoDiferenciaPen,
      OBSERVACIONES_APERTURA: item.observacionesApertura,
      OBSERVACIONES_CIERRE: item.observacionesCierre,
    };
  }

  static adaptConsultarCajaAbierta(item: CajaAbiertaDTO): CajaAbierta {
    return {
      ID_SESION: item.id,
      ID_CAJA: item.cajaId,
      CAJA_NOMBRE: item.cajaNombre,
      ID_USUARIO_APERTURA: item.idUsuarioApertura,
      FECHA_APERTURA: item.fechaApertura,
      FECHA_CIERRE: item.fechaCierre,
      ESTADO: item.estado,
      MONTO_APERTURA_PEN: item.montoAperturaPen,
      MONTO_APERTURA_USD: item.montoAperturaUsd,
      MONTO_CIERRE_ESPERADO_PEN: item.montoCierreEsperadoPen,
      MONTO_CIERRE_REAL_PEN: item.montoCierreRealPen,
      MONTO_DIFERENCIA_PEN: item.montoDiferenciaPen,
      OBSERVACIONES_APERTURA: item.observacionesApertura,
      OBSERVACIONES_CIERRE: item.observacionesCierre,
    };
  }

  static adaptConsultarEstadoSesion(item: ConsultarEstadoSesionDTO): ConsultarEstadoSesion {
    return {
      TIENE_SESION_ABIERTA: item.tieneSesionAbierta,
      SESION: item.sesion ? CajaAdapter.adaptConsultarCajaAbierta(item.sesion) : null,
    };
  }

  static adaptCrearCaja(item: CrearCaja): CrearCajaDTO {
    return {
      sucursalId: item.ID_SUCURSAL,
      nombre: item.CAJA_NOMBRE,
      codigo: item.CODIGO,
      descripcion: item.DESCRIPCION,
      tipoCaja: item.TIPO_CAJA,
    };
  }

  static adaptAperturaCaja(item: AperturaCajaRegistro): AperturaCajaRegistroDTO {
    return {
      cajaId: item.ID_CAJA,
      montoAperturaPen: item.MONTO_APERTURA_PEN,
      // montoAperturaUsd: item.MONTO_APERTURA_USD,
      observacionesApertura: item.OBSERVACIONES_APERTURA,
      arqueos: item.ARQUEOS.map((arqueo) => ({
        denominacionId: arqueo.ID_DENOMINACION,
        cantidad: arqueo.CANTIDAD,
      })),
    };
  }

  static adaptCierreCaja(item: CierreCajaRegistro): CierreCajaRegistroDTO {
    return {
      cajaId: item.ID_SESION,
      montoCierreRealPen: item.MONTO_CIERRE_REAL_PEN,
      // montoCierreRealUsd: item.MONTO_CIERRE_REAL_USD,
      observacionesCierre: item.OBSERVACIONES_CIERRE,
      arqueos: item.ARQUEOS.map((arqueo) => ({
        denominacionId: arqueo.ID_DENOMINACION,
        cantidad: arqueo.CANTIDAD,
      })),
    };
  }
}
