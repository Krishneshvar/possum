// Core business logic package - Explicit exports for clean API surface

// Audit
export * from './modules/audit/audit.service.js';
export type { IAuditRepository, AuditLogFilters } from './modules/audit/audit.repository.interface.js';

// Auth
export * from './modules/auth/auth.service.js';
export type { ISessionRepository } from './modules/auth/auth.repository.interface.js';

// Categories
export * from './modules/categories/category.service.js';
export type { ICategoryRepository } from './modules/categories/category.repository.interface.js';

// Customers
export * from './modules/customers/customer.service.js';
export type { ICustomerRepository, CustomerFilter, CustomerWriteFields, PaginatedCustomers } from './modules/customers/customer.repository.interface.js';

// Inventory
export * from './modules/inventory/inventory.service.js';
export type { IInventoryRepository } from './modules/inventory/inventory.repository.interface.js';

// ProductFlow
export * from './modules/productFlow/productFlow.service.js';
export type { IProductFlowRepository, FlowQueryOptions } from './modules/productFlow/productFlow.repository.interface.js';

// Products
export * from './modules/products/product.service.js';
export type { IProductRepository, ProductFilter } from './modules/products/product.repository.interface.js';

// Purchase
export * from './modules/purchase/purchase.service.js';
export type { IPurchaseRepository, PurchaseOrderQueryOptions, CreatePOItem, CreatePOData } from './modules/purchase/purchase.repository.interface.js';

// Reports
export * from './modules/reports/reports.service.js';
export type { IReportsRepository } from './modules/reports/reports.repository.interface.js';

// Returns
export * from './modules/returns/return.service.js';
export * from './modules/returns/return.calculator.js';
export type { IReturnRepository, ReturnFilters } from './modules/returns/return.repository.interface.js';

// Sales
export * from './modules/sales/sale.service.js';
export * from './modules/sales/sale.utils.js';
export type { ISaleRepository, SaleFilter, PaginatedSales } from './modules/sales/sale.repository.interface.js';

// Suppliers
export * from './modules/suppliers/supplier.service.js';
export type { ISupplierRepository, SupplierQueryOptions, SupplierQueryResult } from './modules/suppliers/supplier.repository.interface.js';

// Taxes
export * from './modules/taxes/tax.engine.js';
export type { ITaxRepository, TaxProfile, TaxCategory, TaxRule } from './modules/taxes/tax.repository.interface.js';

// Transactions
export * from './modules/transactions/transactions.service.js';
export type { ITransactionRepository, PaginatedTransactions, TransactionRecord, TransactionQueryParams } from './modules/transactions/transactions.repository.interface.js';

// Users
export * from './modules/users/user.service.js';
export type { IUserRepository, UserFilter, PaginatedUsers } from './modules/users/user.repository.interface.js';

// Variants
export * from './modules/variants/variant.service.js';
export type { IVariantRepository, VariantQueryOptions } from './modules/variants/variant.repository.interface.js';
