export interface ProductFilter {
    searchTerm?: string;
    stockStatus?: string[];
    status?: string[];
    categories?: number[];
    currentPage: number;
    itemsPerPage: number;
    sortBy?: string;
    sortOrder?: string;
}

export interface IProductRepository {
    insertProduct(data: any): any;
    findProductById(id: number): any;
    findProductImagePath(id: number): any;
    updateProductById(productId: number, data: any): any;
    softDeleteProduct(id: number): any;
    findProducts(params: ProductFilter): Promise<any>;
    findProductWithVariants(productId: number): Promise<any>;
    findProductTaxes(productId: number): any[];
    setProductTaxes(productId: number, taxIds: number[]): void;
    getProductStats(): Promise<any>;
}
