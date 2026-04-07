import { ModuloDTO } from './modulo.dto';
import { Modulo } from './modulo.interface';

/**
 * Adaptador para convertir DTO del backend a interfaz del frontend
 */
export class ModuloAdapter {
    static adaptar(dto: ModuloDTO): Modulo {
        return {
            id: dto.id,
            etiqueta: dto.nombre,
            icono: dto.icono,
            ruta: dto.ruta,
            moduloEmpresaId: dto.companyModuleId,
            seleccionado: dto.activo,
            hijos: dto.hijos ? dto.hijos.map(item => ModuloAdapter.adaptar(item)) : null
        };
    }

    static adaptarLista(dtos: ModuloDTO[]): Modulo[] {
        return dtos.map(dto => ModuloAdapter.adaptar(dto));
    }
}
