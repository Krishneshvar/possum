let saleRepository: any;

export function setSaleRepository(repo: any) {
    saleRepository = repo;
}

/**
 * Generate next invoice number
 * Business logic for invoice numbering
 */
export function generateInvoiceNumber(): string {
    const lastSale = saleRepository.getLastSale();
    
    if (!lastSale || !lastSale.invoice_number) {
        return 'INV-001';
    }
    
    const lastNum = parseInt(lastSale.invoice_number.replace('INV-', ''), 10);
    const nextNum = lastNum + 1;
    return `INV-${String(nextNum).padStart(3, '0')}`;
}
