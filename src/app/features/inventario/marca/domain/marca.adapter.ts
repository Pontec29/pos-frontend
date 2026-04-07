import { MarcaDTO, MarcaUpSertDTO } from "./marca.dto";
import { MarcaListar, MarcaUpSert } from "./marca.interface";

export class MarcaAdapter {
  static adapt(dto: MarcaDTO): MarcaListar {
    return {
      ID_MARCA: dto.id,
      NOMBRE: dto.nombre,
      DESCRIPCION: dto.descripcion,
      ACTIVO: dto.activo
    };
  }

  static adaptToUpSert(request: MarcaUpSert): MarcaUpSertDTO {
    return {
      nombre: request.NOMBRE,
      descripcion: request.DESCRIPCION
    };
  }
}
