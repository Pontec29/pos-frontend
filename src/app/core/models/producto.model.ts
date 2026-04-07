/**
 * Modelos globales para búsqueda y selección de productos.
 * Reutilizable en múltiples módulos (inventario, ventas, compras, etc.)
 */

/**
 * Presentación/unidad de un producto (empaque, caja, etc.)
 */
export interface ProductoPresentacion {
    id: number;
    unidadId: number;
    unidadNombre: string;
    factorConversionBase: number;
    precioVenta: number;
    codigoBarras: string | null;
    esPrincipal: boolean;
}

/**
 * Producto devuelto por el endpoint de búsqueda.
 * Incluye presentaciones activas para formularios de ingreso/venta.
 */
export interface ProductoBusqueda {
    id: number;
    codigoInterno: string;
    nombre: string;
    tipoControlStock: 'NORMAL' | 'LOTE' | 'SERIE';
    precioCompra: number;
    presentaciones: ProductoPresentacion[];
}

export interface ProductoBusquedaResponse {
    success: boolean;
    message: string;
    data: ProductoBusqueda[];
}
