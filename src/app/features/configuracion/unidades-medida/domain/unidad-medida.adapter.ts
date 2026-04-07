import { UnidadMedidaDTO } from "./unidad-medida.dto";
import { UnidadMedidaListar } from "./unidad-medida.interface";

export class UnidadMedidaAdapter {
  static adapt(dto: UnidadMedidaDTO): UnidadMedidaListar {
    return {
      ID_UNIDAD_MEDIDA: dto.id,
      CODIGO_SUNAT: dto.codigoSunat,
      DESCRIPCION_SUNAT: dto.descripcionSunat,
      Abreviatura: dto.abreviatura,
      NOMBRE_COMERCIAL: dto.nombreComercial,
      ES_BASE: dto.esBase,
      ACTIVO: dto.activo
    };
  }
}
