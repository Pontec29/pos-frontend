export interface DenominacionesDTO {
  id: number;
  monedaId: number;
  valor: number;
  tipo: string;
  imagenUrl: string;
  activo: boolean;
}

export interface CajaAbiertaCerradaDTO {
  id: number;
  sucursalId: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  tipoCaja: string;
  activo: boolean;
  enUso: boolean;
}

export interface CajaSesionesListarDTO {
  id: number;
  cajaId: number;
  cajaNombre: string;
  idUsuarioApertura: number;
  fechaApertura: string;
  fechaCierre: string;
  estado: string;
  montoAperturaPen: number;
  montoAperturaUsd: number;
  montoCierreEsperadoPen: number;
  montoCierreRealPen: number;
  montoDiferenciaPen: number;
  observacionesApertura: string;
  observacionesCierre: string;
}

// ! CONSULTAR CAJA ABIERTA
export interface CajaAbiertaDTO {
  id: number;
  cajaId: number;
  cajaNombre: string;
  idUsuarioApertura: number;
  fechaApertura: string;
  fechaCierre: string;
  estado: string;
  montoAperturaPen: number;
  montoAperturaUsd: number;
  montoCierreEsperadoPen: number;
  montoCierreRealPen: number;
  montoDiferenciaPen: number;
  observacionesApertura: string;
  observacionesCierre: string;
}

export interface ConsultarEstadoSesionDTO {
  tieneSesionAbierta: boolean;
  sesion: CajaAbiertaDTO | null;
}

// ! APERTURA Y CIERRE DE CAJA
export interface CrearCajaDTO {
  sucursalId: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  tipoCaja: string;
}

export interface AperturaCajaRegistroDTO {
  cajaId: number;
  montoAperturaPen: number;
  // montoAperturaUsd: number;
  observacionesApertura: string;
  arqueos: ArqueosDTO[];
}

export interface ArqueosDTO {
  denominacionId: number;
  cantidad: number;
}

export interface CierreCajaRegistroDTO {
  cajaId: number;
  montoCierreRealPen: number;
  // montoCierreRealUsd: number;
  observacionesCierre: string;
  arqueos: ArqueosDTO[];
}
