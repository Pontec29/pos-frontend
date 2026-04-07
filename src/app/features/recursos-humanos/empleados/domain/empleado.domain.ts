export interface EmpleadoDTO {
    id: number;
    nroDocumento: string;
    tipoDocumento: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    idSucursal: number;
    idCargo: number;
    cargoNombre: string;
    tieneAccesoSistema: boolean;
    porcentajeComision: number;
    fechaNacimiento: string;
    contactoEmergenciaNombre: string;
    contactoEmergenciaTelefono: string;
    fechaIngreso: string;
    sueldoActual: number;
    observaciones: string;
    activo: boolean;
    username?: string;
    password?: string;
    idRol?: number;
}

export interface Empleado extends EmpleadoDTO {}

export class EmpleadoAdapter {
    static adapt(dto: EmpleadoDTO): Empleado {
        return {
            ...dto
        };
    }

    static adaptList(dtos: EmpleadoDTO[]): Empleado[] {
        return (dtos || []).map(EmpleadoAdapter.adapt);
    }
}
