/**
 * Interfaz de módulo para el frontend
 * Campos en español para uso interno
 */
export interface Modulo {
    id: number;
    etiqueta: string;
    icono: string | null;
    ruta: string | null;
    moduloEmpresaId: number | null;
    seleccionado: boolean;
    hijos: Modulo[] | null;
}
