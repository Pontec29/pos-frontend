// ! LISTAR
export interface ProveedorDTO {
  id: number;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string;
  activo: boolean
}
// ! CREAR Y EDITAR
export interface ProveedorCreateDTO {
  tipoDocCodigo: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  direccionFiscal: string;
  ubigeoId: string;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  razonSocial?: string;
  nombreComercial?: string;
}

// ! CAMBIAR ESTADO


