export interface CodigoSunat {
    codigo: string;
    nombre: string;
}

export interface MovimientoEntradaPayload {
    tipoMovimiento: string;
    almacenDestinoId: number;
    codigoOperacionSunat: string;
    documentoReferencia: string;
    fechaEmision: string;
    observacion: string;
    detalles: Array<{
        productoId: number;
        unidadId?: number;
        cantidad: number;
        factorConversion: number;
        costoUnitario: number;
        codigoLote: string | null;
        fechaVencimiento: string | null;
    }>;
}

export interface MovimientoResumenIngreso {
    id: number;
    tipoMovimiento: string;
    serie: string;
    numero: string;
    documentoFormateado: string;
    almacenOrigenNombre: string | null;
    almacenDestinoNombre: string;
    fechaEmision: string;
    estado: string;
    cantidadItems: number;
    createdAt: string;
}

export interface MovimientoResponse {
    id: number;
    tipoMovimiento: string;
    serie: string;
    numero: string;
    documentoFormateado: string;
    codigoOperacionSunat: string;
    documentoReferencia: string;
    almacenOrigenId: number | null;
    almacenOrigenNombre: string | null;
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
    productoSku: string;
    productoNombre: string;
    loteId: number | null;
    codigoLote: string | null;
    unidadId: number | null;
    unidadAbreviatura: string | null;
    cantidad: number;
    factorConversion: number;
    cantidadBase: number;
    costoUnitario: number;
    subtotal: number;
    fechaVencimiento: string | null;
    tipoControlStock: 'NORMAL' | 'LOTE' | 'SERIE';
}
