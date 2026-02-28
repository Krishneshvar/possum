import { Supplier, PaymentPolicy } from '../../../types/index.js';

export interface SupplierQueryOptions {
    page?: number;
    limit?: number;
    searchTerm?: string;
    paymentPolicyId?: number;
    sortBy?: 'name' | 'contact_person' | 'phone' | 'email' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
}

export interface SupplierQueryResult {
    suppliers: Supplier[];
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
}

export interface ISupplierRepository {
    getAllSuppliers(options: SupplierQueryOptions): SupplierQueryResult;
    findSupplierById(id: number): Supplier | undefined;
    createSupplier(data: Partial<Supplier>): { lastInsertRowid: number | bigint };
    updateSupplier(id: number, data: Partial<Supplier>): { changes: number };
    deleteSupplier(id: number): { changes: number };
    getPaymentPolicies(): PaymentPolicy[];
    createPaymentPolicy(data: { name: string, days_to_pay: number, description?: string }): { lastInsertRowid: number | bigint };
}
