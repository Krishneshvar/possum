export interface PurchaseOrderQueryOptions {
    page?: number;
    limit?: number;
    searchTerm?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | string;
}

export interface CreatePOItem {
    variant_id: number;
    quantity: number;
    unit_cost: number;
}

export interface CreatePOData {
    supplier_id: number;
    created_by: number;
    items: CreatePOItem[];
}

export interface UpdatePOData {
    supplier_id: number;
    updated_by: number;
    items: CreatePOItem[];
}

export interface IPurchaseRepository {
    getAllPurchaseOrders(options: PurchaseOrderQueryOptions): any;
    getPurchaseOrderById(id: number): any;
    createPurchaseOrder(data: CreatePOData): number;
    updatePurchaseOrder(id: number, data: UpdatePOData): any;
    receivePurchaseOrder(poId: number, userId: number): any;
    cancelPurchaseOrder(id: number): any;
}
