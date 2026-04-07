import { CategoriaDTO, CategoriaUpSertDTO } from "./categoria.dto";
import { Categoria, CategoriaUpSert } from "./categoria.interface";

export class CategoriaAdapter {
  static adapt(item: CategoriaDTO): Categoria {
    return {
      ID_CATEGORIA: item.id,
      NOMBRE: item.nombre,
      DESCRIPCION: item.descripcion,
      ACTIVO: item.activo,
    };
  }

  static adaptToUpSert(request: CategoriaUpSert): CategoriaUpSertDTO {
    return {
      nombre: request.NOMBRE,
      descripcion: request.DESCRIPCION,
    };
  }
}
