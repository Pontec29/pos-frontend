/**
 * Modelos para el módulo de Inventario
 */

// === Stock ===
export interface Stock {
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    productBarcode: string;
    branchId: number;
    quantity: number;
    minStock: number;
    maxStock: number;
    unitName: string;
    lowStock: boolean;
    outOfStock: boolean;
}

export interface StockAdjustment {
    productId: number;
    branchId: number;
    quantity: number;
    reason: string;
}

// === Kardex ===
export interface Kardex {
    id: number;
    productId: number;
    productName: string;
    branchId: number;
    date: string;
    movementType: 'INGRESO' | 'SALIDA';
    movementDetail: 'COMPRA' | 'VENTA' | 'AJUSTE' | 'TRASLADO' | 'MERMA' | 'DEVOLUCION';
    referenceDocument: string;
    unitName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    balanceQuantity: number;
    balanceUnitCost: number;
    balanceTotalCost: number;
    description: string;
}

// === Lotes ===
export interface Lot {
    id: number;
    productId: number;
    productName: string;
    branchId: number;
    lotCode: string;
    expirationDate: string;
    initialQuantity: number;
    currentQuantity: number;
    unitCost: number;
    status: 'ACTIVO' | 'AGOTADO' | 'VENCIDO';
    daysUntilExpiration: number;
    isExpired: boolean;
    isNearExpiration: boolean;
}

// === Alertas de Inventario ===
export interface InventoryAlert {
    id: number;
    productId: number;
    productName: string;
    branchId: number;
    lotId: number;
    lotCode: string;
    alertType: 'STOCK_BAJO' | 'STOCK_AGOTADO' | 'PROXIMO_VENCER' | 'VENCIDO';
    message: string;
    alertDate: string;
    status: 'PENDIENTE' | 'LEIDA' | 'RESUELTA';
}

// === Laboratorios ===
export interface Laboratory {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export interface LaboratoryRequest {
    name: string;
    description?: string;
    active?: boolean;
}

// === Acciones Farmacológicas ===
export interface PharmacologicalAction {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export interface PharmacologicalActionRequest {
    name: string;
    description?: string;
    active?: boolean;
}

// === Principios Activos ===
export interface ActivePrinciple {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export interface ActivePrincipleRequest {
    name: string;
    description?: string;
    active?: boolean;
}
