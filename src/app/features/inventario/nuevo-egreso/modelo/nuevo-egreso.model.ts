export interface CodigoSunatSalida {
    codigo: string;
    nombre: string;
}

export interface MovimientoSalidaPayload {
    tipoMovimiento: string;
    almacenOrigenId: number;
    codigoOperacionSunat: string;
    documentoReferencia: string;
    fechaEmision: string;
    observacion: string;
    detalles: Array<{
        productoId: number;
        unidadId?: number;
        loteId?: number;
        cantidad: number;
        factorConversion: number;
        costoUnitario: number;
    }>;
}

export interface MovimientoResponse {
    id: number;
    tipoMovimiento: string;
    serie: string;
    numero: string;
    documentoFormateado: string;
    codigoOperacionSunat: string;
    documentoReferencia: string;
    almacenOrigenId: number;
    almacenOrigenNombre: string;
    almacenDestinoId: number | null;
    almacenDestinoNombre: string | null;
    fechaEmision: string;
    estado: string;
    observacion: string;
    motivoAnulacion: string | null;
    createdAt: string;
    detalles: DetalleMovimientoResponse[];
}

export interface DetalleMovimientoResponse {
    id: number;
    productoId: number;
    productoNombre: string;
    loteId: number | null;
    codigoLote: string | null;
    unidadId: number;
    unidadAbreviatura: string;
    cantidad: number;
    factorConversion: number;
    cantidadBase: number;
    costoUnitario: number;
    subtotal: number;
    tipoControlStock: string;
    fechaVencimiento: string | null;
}

export interface MovimientoResumen {
    id: number;
    tipoMovimiento: string;
    serie: string;
    numero: string;
    documentoFormateado: string;
    almacenOrigenNombre: string;
    almacenDestinoNombre: string | null;
    fechaEmision: string;
    estado: string;
    cantidadItems: number;
    createdAt: string;
}
