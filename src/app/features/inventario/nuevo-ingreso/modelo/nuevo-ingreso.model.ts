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
