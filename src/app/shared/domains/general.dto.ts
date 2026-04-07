export interface ResponseBuscarDniOrucDto {
  tipoDocumento: number;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  digitoVerificador: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion: string;
  ubigeo: string;
  distrito: string;
  provincia: string;
  departamento: string;
  esAgenteRetencion: boolean;
  esBuenContribuyente: boolean;
  viaTipo: string;
  viaNombre: string;
  numero: string;
  zonaCodigo: string;
  zonaTipo: string;
  nombreComercial: string;
}


export interface ResponseMonedaDto {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  activo: boolean;
}

export interface ResponseBancosDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface ResponseTipoDocumentoDto {
  id: number;
  abreviatura: string;
  codigoSunat: string;
  nombre: string;
  activo: boolean;
}

export interface ResponseUbigeoDto {
  id: string;
  departamento: string;
  provincia: string;
  distrito: string;
  activo: boolean;
}

export interface ResponseAfectacionIgvDto {
  id: string;
  descripcion: string;
  generaIgv: boolean;
  esGratuito: boolean;
  esPredeterminado: boolean;
}

export interface ResponseContactoDto {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial?: string;
  direccionFiscal?: string;
  correoElectronico?: string;
  telefono?: string;
  esCliente?: boolean;
  esProveedor?: boolean;
  estado?: string;
}

export interface ResponseMetodoPagoDto {
  id: number;
  tipo: string;
  codigo: string;
  descripcion: string;
  requiereReferencia: boolean;
}

export interface ResponseEmpresaAsignadaDto {
  tenantId: number;
  razonSocial: string;
  ruc: string;
}
