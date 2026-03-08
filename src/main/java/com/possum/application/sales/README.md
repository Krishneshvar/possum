# Sales Module

## Overview

The Sales module implements the complete POS transaction engine, replicating the exact business logic from the TypeScript implementation. It handles sale creation, tax calculation, inventory deduction, payment processing, and sale lifecycle management.

## Architecture

### Services

#### SalesService
Main orchestrator for all sale operations.

**Key Methods:**
- `createSale(CreateSaleRequest, userId)` - Create new sale with items and payments
- `getSaleDetails(saleId)` - Retrieve sale with items and transactions
- `cancelSale(saleId, userId)` - Cancel sale and restore inventory
- `completeSale(saleId, userId)` - Mark sale as fulfilled
- `getPaymentMethods()` - Get active payment methods

**Transaction Boundaries:**
All mutating operations run inside database transactions via TransactionManager.

#### TaxEngine
Handles tax calculation with support for:
- INCLUSIVE and EXCLUSIVE pricing modes
- Simple and compound tax rules
- Rule filtering by category, price thresholds, customer type, date validity
- Precise BigDecimal arithmetic with proper rounding

**Key Methods:**
- `init()` - Load active tax profile and rules (must be called before calculate)
- `calculate(TaxableInvoice, Customer)` - Calculate taxes for invoice

#### PaymentService
Manages payment methods and transaction recording.

**Key Methods:**
- `validatePaymentMethod(paymentMethodId)` - Validate payment method exists
- `getActivePaymentMethods()` - Get all active payment methods
- `recordTransaction(Transaction)` - Record transaction (internal use)

## Business Logic

### Sale Creation Flow

1. **Validation**
   - Validate request inputs
   - Validate payment methods exist

2. **Stock Check** (inside transaction)
   - Verify stock availability for all items
   - Throws InsufficientStockException if unavailable

3. **Discount Calculation**
   - Calculate line totals after line-level discounts
   - Distribute global discount proportionally
   - Last item gets remainder to avoid rounding errors

4. **Tax Calculation**
   - Initialize TaxEngine with active profile
   - Calculate taxes on post-discount prices
   - Handle INCLUSIVE vs EXCLUSIVE modes
   - Apply compound tax rules correctly

5. **Status Determination**
   - `draft` - No payment (paidAmount = 0)
   - `partially_paid` - Partial payment (0 < paidAmount < totalAmount)
   - `paid` - Full payment (paidAmount >= totalAmount)
   - Paid sales auto-fulfill (fulfillmentStatus = 'fulfilled')

6. **Inventory Deduction**
   - FIFO deduction from oldest lots first
   - Creates inventory adjustments linked to sale items

7. **Transaction Recording**
   - Record payment transactions
   - Link to sale via sale_id

8. **Audit Logging**
   - Log sale creation event

### Discount Distribution

**Two-tier system:**

1. **Line-level discount** - Applied directly to line total
2. **Global discount** - Distributed proportionally across items

```
For each item (except last):
  itemGlobalDiscount = (netLineTotal / grossTotal) × globalDiscount

For last item:
  itemGlobalDiscount = globalDiscount - distributedGlobalDiscount
```

### Tax Calculation

**INCLUSIVE mode:**
- Tax is extracted from item price
- Grand total = subtotal (tax already included)

**EXCLUSIVE mode:**
- Tax is added to item price
- Grand total = subtotal + tax

**Compound rules:**
- Simple rules: tax on base amount
- Compound rules: tax on (base + accumulated tax)

**Rounding:**
- Tax per line: 2 decimals, ROUND_HALF_UP
- Total tax: sum of rounded line taxes

### Inventory Integration

**Deduction (on sale creation):**
```java
inventoryService.deductStock(
    variantId,
    quantity,
    userId,
    InventoryReason.SALE,
    "sale_item",
    saleItemId
);
```

**Restoration (on sale cancellation):**
```java
inventoryService.restoreStock(
    variantId,
    "sale_item",
    saleItemId,
    quantity,
    userId,
    InventoryReason.CORRECTION,
    "sale_cancellation",
    saleId
);
```

## Usage Examples

### Create Simple Sale
```java
CreateSaleItemRequest item = new CreateSaleItemRequest(
    variantId,
    quantity,
    null,  // No discount
    null   // Use default price
);

PaymentRequest payment = new PaymentRequest(
    amount,
    paymentMethodId
);

CreateSaleRequest request = new CreateSaleRequest(
    List.of(item),
    customerId,
    null,  // No global discount
    List.of(payment)
);

SaleResponse response = salesService.createSale(request, userId);
```

### Create Sale with Discounts
```java
CreateSaleItemRequest item = new CreateSaleItemRequest(
    variantId,
    quantity,
    BigDecimal.valueOf(5.00),  // Line discount
    null
);

CreateSaleRequest request = new CreateSaleRequest(
    List.of(item),
    customerId,
    BigDecimal.valueOf(10.00),  // Global discount
    List.of(payment)
);

SaleResponse response = salesService.createSale(request, userId);
```

### Cancel Sale
```java
salesService.cancelSale(saleId, userId);
```

### Complete Sale
```java
salesService.completeSale(saleId, userId);
```

## Dependencies

### Required Services
- **InventoryService** - Stock deduction and restoration
- **TransactionManager** - Database transaction management
- **JsonService** - JSON serialization for audit logs

### Required Repositories
- **SalesRepository** - Sale and transaction persistence
- **VariantRepository** - Variant lookup
- **ProductRepository** - Product lookup
- **CustomerRepository** - Customer lookup
- **TaxRepository** - Tax profile and rule lookup
- **AuditRepository** - Audit log persistence

## Error Handling

### Custom Exceptions
- `InsufficientStockException` - Not enough stock for sale
- `NotFoundException` - Sale, variant, product, or payment method not found
- `ValidationException` - Invalid input or state transition

### Validation Rules
- Discount cannot be negative
- Payment amount must be positive
- Payment method must exist and be active
- Cannot cancel refunded sales
- Cannot fulfill cancelled sales
- Cannot add items to existing sales (atomic creation only)

## Invoice Numbering

Format: `INV-XXX` (3-digit zero-padded)
- Sequential based on last sale
- Starts at INV-001 if no previous sales
- Generated inside transaction

## Status Transitions

```
draft → partially_paid → paid → fulfilled
  ↓                        ↓
cancelled              cancelled
```

**Forbidden transitions:**
- Cannot cancel refunded sales
- Cannot fulfill cancelled sales

## Monetary Precision

All monetary values use `BigDecimal` with:
- Scale: 2 decimals for storage
- Rounding: HALF_UP
- Precision: 10 decimals during calculations

## Testing

See `SalesServiceExample.java` for usage examples.

### Key Test Scenarios
1. Sale with line discounts only
2. Sale with global discount only
3. Sale with both discount types
4. Sale with INCLUSIVE tax
5. Sale with EXCLUSIVE tax
6. Sale with compound tax rules
7. Sale with multiple payments
8. Sale cancellation and inventory restoration
9. Insufficient stock handling
10. Tax-exempt customer

## Notes

- **Atomic Sale Creation**: Sales are created atomically with all items. Adding/removing items after creation is not supported (matches TypeScript implementation).
- **Stock Validation**: Stock checks happen INSIDE transactions to prevent race conditions.
- **FIFO Inventory**: Inventory deduction uses FIFO (First-In-First-Out) from oldest lots.
- **LIFO Restoration**: Inventory restoration uses LIFO (Last-In-First-Out) reversal.
- **Auto-Fulfillment**: Fully paid sales automatically set fulfillmentStatus to 'fulfilled'.
