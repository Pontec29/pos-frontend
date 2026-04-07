export interface Denominaciones {
  ID_DENOMINACION: number;
  ID_MONEDA: number;
  VALOR: number;
  TIPO: string;
  IMAGEN_URL: string;
  ESTADO: boolean;
}

// ! MOSTRAR CAJAS ABIERTAS Y CERRADAS
export interface CajaAbiertaCerrada {
  ID_CAJA_ABIERTA: number;
  ID_SUCURSAL: number;
  CAJA_NOMBRE: string;
  CODIGO: string;
  DESCRIPCION: string;
  TIPO_CAJA: string;
  ESTADO: boolean;
  EN_USO: boolean;
}

export interface CajaSesionesListar {
  ID_SESION: number;
  ID_CAJA: number;
  CAJA_NOMBRE: string;
  ID_USUARIO_APERTURA: number;
  FECHA_APERTURA: string;
  FECHA_CIERRE: string;
  ESTADO: string;
  MONTO_APERTURA_PEN: number;
  MONTO_APERTURA_USD: number;
  MONTO_CIERRE_ESPERADO_PEN: number;
  MONTO_CIERRE_REAL_PEN: number;
  MONTO_DIFERENCIA_PEN: number;
  OBSERVACIONES_APERTURA: string;
  OBSERVACIONES_CIERRE: string;
}

// ! CONSULTAR CAJA ABIERTA
export interface CajaAbierta {
  ID_SESION: number;
  ID_CAJA: number;
  CAJA_NOMBRE: string;
  ID_USUARIO_APERTURA: number;
  FECHA_APERTURA: string;
  FECHA_CIERRE: string;
  ESTADO: string;
  MONTO_APERTURA_PEN: number;
  MONTO_APERTURA_USD: number;
  MONTO_CIERRE_ESPERADO_PEN: number;
  MONTO_CIERRE_REAL_PEN: number;
  MONTO_DIFERENCIA_PEN: number;
  OBSERVACIONES_APERTURA: string;
  OBSERVACIONES_CIERRE: string;
}

export interface ConsultarEstadoSesion {
  TIENE_SESION_ABIERTA: boolean;
  SESION: CajaAbierta | null;
}

// ! APERTURA Y CIERRE DE CAJA
export interface CrearCaja {
  ID_SUCURSAL: number;
  CAJA_NOMBRE: string;
  CODIGO: string;
  DESCRIPCION: string;
  TIPO_CAJA: string;
}

export interface AperturaCajaRegistro {
  ID_CAJA: number;
  MONTO_APERTURA_PEN: number;
  // MONTO_APERTURA_USD: number;
  OBSERVACIONES_APERTURA: string;
  ARQUEOS: Arqueos[];
}

export interface Arqueos {
  ID_DENOMINACION: number;
  CANTIDAD: number;
}

export interface CierreCajaRegistro {
  ID_SESION: number;
  MONTO_CIERRE_REAL_PEN: number;
  // MONTO_CIERRE_REAL_USD: number;
  OBSERVACIONES_CIERRE: string;
  ARQUEOS: Arqueos[];
}
