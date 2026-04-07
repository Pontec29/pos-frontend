/**
 * Modelos para el módulo de Notas de Salida
 */

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
