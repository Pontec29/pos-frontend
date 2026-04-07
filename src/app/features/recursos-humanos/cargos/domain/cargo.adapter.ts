import { CargoDTO } from './cargo.dto';
import { Cargo } from './cargo.interface';

export class CargoAdapter {
    static adapt(dto: CargoDTO): Cargo {
        return {
            id: dto.id,
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            activo: dto.activo
        };
    }

    static adaptList(dtos: CargoDTO[]): Cargo[] {
        return (dtos || []).map(CargoAdapter.adapt);
    }
}
