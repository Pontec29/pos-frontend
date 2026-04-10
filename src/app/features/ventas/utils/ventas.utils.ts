/**
 * Utilidades y helpers para el módulo de ventas
 */

import { TipoAfectacionIGV, TipoMoneda } from "../models/venta.models";


// === Constantes ===
export const IGV_RATE = 0.18;
export const MAX_DECIMAL_PLACES = 2;

// === Configuración por tipo de comprobante ===
export const COMPROBANTE_CONFIG = {
    FACTURA: {
        requireRuc: true,
        maxAmount: null,
        series: ['F001', 'F002', 'F003']
    },
    BOLETA: {
        requireRuc: false,
        maxAmount: 700, // Requiere DNI si supera este monto
        series: ['B001', 'B002', 'B003']
    },
    NOTA_CREDITO: {
        requireRuc: true,
        maxAmount: null,
        series: ['FC01', 'BC01']
    },
    TICKET: {
        requireRuc: false,
        maxAmount: 5,
        series: ['T001']
    }
} as const;

// === Tipos de error para validaciones ===
export interface VentaValidationError {
    field: string;
    message: string;
    code?: string;
}

// === Interfaces para reportes ===
export interface VentaReporte {
    fecha: string;
    totalVentas: number;
    cantidadComprobantes: number;
    ventasPorTipo: Record<string, number>;
    ventasPorFormaPago: Record<string, number>;
    promedioVenta: number;
}

// === Funciones utilitarias ===
export class VentasUtils {

    /**
     * Calcula el IGV de un monto gravado
     */
    static calcularIGV(montoGravado: number): number {
        return this.roundToDecimals(montoGravado * IGV_RATE);
    }

    /**
     * Calcula la base imponible desde un monto que incluye IGV
     */
    static calcularBaseImponible(montoConIGV: number): number {
        return this.roundToDecimals(montoConIGV / (1 + IGV_RATE));
    }

    /**
     * Redondea un número a la cantidad especificada de decimales
     */
    static roundToDecimals(value: number, decimals: number = MAX_DECIMAL_PLACES): number {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Formatea un monto según la moneda
     */
    static formatearMonto(monto: number, moneda: TipoMoneda = 'PEN'): string {
        const simbolo = moneda === 'PEN' ? 'S/' : '$';
        return `${simbolo} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Valida si un monto es válido
     */
    static esMontoValido(monto: number): boolean {
        return monto >= 0 && Number.isFinite(monto);
    }

    /**
     * Genera el número de comprobante
     */
    static generarNumeroComprobante(serie: string, correlativo: number): string {
        return `${serie}-${correlativo.toString().padStart(8, '0')}`;
    }

    /**
     * Obtiene la descripción de la afectación IGV
     */
    static getDescripcionAfectacion(codigo: TipoAfectacionIGV): string {
        const descripciones = {
            '10': 'Gravado - Operación Onerosa',
            '20': 'Exonerado - Operación Onerosa',
            '30': 'Inafecto - Operación Onerosa',
            '40': 'Exportación'
        };
        return descripciones[codigo] || 'Desconocido';
    }

    /**
     * Valida si un detalle de venta es correcto
     */
    static validarDetalle(detalle: any): VentaValidationError[] {
        const errores: VentaValidationError[] = [];

        if (!detalle.productoId) {
            errores.push({ field: 'productoId', message: 'Producto es requerido' });
        }

        if (!detalle.cantidad || detalle.cantidad <= 0) {
            errores.push({ field: 'cantidad', message: 'La cantidad debe ser mayor a 0' });
        }

        if (!detalle.precioUnitario || detalle.precioUnitario < 0) {
            errores.push({ field: 'precioUnitario', message: 'El precio debe ser mayor o igual a 0' });
        }

        if (!detalle.afectacion) {
            errores.push({ field: 'afectacion', message: 'Tipo de afectación es requerido' });
        }

        return errores;
    }

    /**
     * Convierte un objeto Date a string en formato ISO para la API
     */
    static dateToApiString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Parsea un string de fecha de la API a Date
     */
    static apiStringToDate(dateString: string): Date {
        return new Date(dateString);
    }

    /**
     * Calcula el total de una línea de detalle
     */
    static calcularTotalLinea(cantidad: number, precioUnitario: number, descuento: number = 0): number {
        const subtotal = cantidad * precioUnitario;
        const montoDescuento = subtotal * (descuento / 100);
        return this.roundToDecimals(subtotal - montoDescuento);
    }

    /**
     * Obtiene las series disponibles para un tipo de comprobante
     */
    static getSeriesDisponibles(tipoComprobante: keyof typeof COMPROBANTE_CONFIG): string[] {
        return [...(COMPROBANTE_CONFIG[tipoComprobante]?.series || [])];
    }

    /**
     * Verifica si un comprobante requiere RUC
     */
    static requiereRuc(tipoComprobante: keyof typeof COMPROBANTE_CONFIG): boolean {
        return COMPROBANTE_CONFIG[tipoComprobante]?.requireRuc ?? false;
    }

    /**
     * Obtiene el monto máximo sin requerimiento adicional
     */
    static getMontoMaximo(tipoComprobante: keyof typeof COMPROBANTE_CONFIG): number | null {
        return COMPROBANTE_CONFIG[tipoComprobante]?.maxAmount ?? null;
    }
}

// === Constantes para códigos SUNAT ===
export const CODIGOS_SUNAT = {
    TIPOS_DOCUMENTO_IDENTIDAD: {
        DNI: '1',
        EXTRANJERIA: '4',
        RUC: '6',
        PASAPORTE: '7',
        CEDULA_DIPLOMATICA: 'A'
    },

    TIPOS_COMPROBANTE: {
        FACTURA: '01',
        BOLETA: '03',
        NOTA_CREDITO: '07',
        NOTA_DEBITO: '08'
    },

    MONEDAS: {
        PEN: 'PEN',
        USD: 'USD',
        EUR: 'EUR'
    },

    FORMAS_PAGO: {
        EFECTIVO: '01',
        TARJETA_CREDITO: '02',
        TARJETA_DEBITO: '03',
        TRANSFERENCIA: '04',
        CHEQUE: '05'
    }
} as const;

// === Validadores de documentos peruanos ===
export class DocumentValidators {

    /**
     * Valida un número de DNI peruano
     */
    static validarDNI(dni: string): boolean {
        return /^\d{8}$/.test(dni);
    }

    /**
     * Valida un número de RUC peruano
     */
    static validarRUC(ruc: string): boolean {
        if (!/^\d{11}$/.test(ruc)) return false;

        // Validación del dígito verificador
        const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let sum = 0;

        for (let i = 0; i < 10; i++) {
            sum += parseInt(ruc[i]) * factors[i];
        }

        const remainder = sum % 11;
        const checkDigit = remainder < 2 ? remainder : 11 - remainder;

        return parseInt(ruc[10]) === checkDigit;
    }

    /**
     * Obtiene el tipo de documento basado en el número
     */
    static getTipoDocumento(documento: string): string {
        documento = documento.replace(/\D/g, ''); // Solo números

        if (this.validarDNI(documento)) return CODIGOS_SUNAT.TIPOS_DOCUMENTO_IDENTIDAD.DNI;
        if (this.validarRUC(documento)) return CODIGOS_SUNAT.TIPOS_DOCUMENTO_IDENTIDAD.RUC;

        return CODIGOS_SUNAT.TIPOS_DOCUMENTO_IDENTIDAD.DNI; // Por defecto
    }
}
