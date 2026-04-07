
export interface Supplier {
    id: number;
    documentType: 'RUC' | 'DNI';
    documentNumber: string;
    businessName: string;
    tradeName: string;
    address: string;
    phone: string;
    email: string;
    contactName: string;
    contactPhone: string;
    creditDays: number;
    active: boolean;
}

export interface SupplierRequest {
    documentType?: string;
    documentNumber: string;
    businessName: string;
    tradeName?: string;
    address?: string;
    phone?: string;
    email?: string;
    contactName?: string;
    contactPhone?: string;
    creditDays?: number;
    active?: boolean;
}

// === Compra ===
export interface Purchase {
    id: number;
    branchId: number;
    branchName: string;
    supplierId: number;
    supplierName: string;
    supplierRuc: string;
    voucherTypeId: string;
    voucherTypeName: string;
    series: string;
    number: string;
    fullDocumentNumber: string;
    issueDate: string;
    dueDate: string;
    receptionDate: string;
    currencyId: string;
    exchangeRate: number;
    subtotal: number;
    igvAmount: number;
    discountAmount: number;
    total: number;
    status: 'REGISTRADO' | 'PROCESADO' | 'ANULADO';
    observations: string;
    details?: PurchaseDetail[];
}

export interface PurchaseRequest {
    branchId: number;
    supplierId: number;
    voucherTypeId: string;
    series: string;
    number: string;
    issueDate: string;
    dueDate?: string;
    currencyId?: string;
    exchangeRate?: number;
    observations?: string;
    details: PurchaseDetailRequest[];
}

export interface PurchaseDetail {
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    unitId: number;
    unitName: string;
    quantity: number;
    unitCost: number;
    discountPercentage: number;
    igvPercentage: number;
    subtotal: number;
    tax: number;
    total: number;
    lotCode: string;
    expirationDate: string;
}

export interface PurchaseDetailRequest {
    productId: number;
    unitId?: number;
    quantity: number;
    unitCost: number;
    discountPercentage?: number;
    igvPercentage?: number;
    lotCode?: string;
    expirationDate?: string;
}

