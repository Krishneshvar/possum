# Products Module Integration Test Checklist

## Database Layer Tests

### Schema Integrity
- [ ] Products table accepts NULL for category_id
- [ ] Products table accepts NULL for tax_category_id
- [ ] Foreign key constraints are enforced
- [ ] Soft delete (deleted_at) works correctly
- [ ] Indexes exist on deleted_at columns
- [ ] Unique constraint on variant SKU works
- [ ] Default variant constraint (one per product) works

### Data Consistency
- [ ] Cannot insert product with invalid category_id
- [ ] Cannot insert product with invalid tax_category_id
- [ ] Variants cascade delete when product is deleted
- [ ] Stock calculation matches inventory_lots + adjustments

## Repository Layer Tests

### Product Repository
- [ ] insertProduct handles NULL category_id correctly
- [ ] insertProduct handles NULL tax_category_id correctly
- [ ] findProductById returns undefined for non-existent product
- [ ] findProductById excludes soft-deleted products
- [ ] findProducts filters by deleted_at IS NULL
- [ ] findProducts stock calculation is accurate
- [ ] updateProductById handles partial updates
- [ ] softDeleteProduct sets deleted_at timestamp

### Variant Repository
- [ ] insertVariant maps price to mrp correctly
- [ ] findVariantById returns null for non-existent variant
- [ ] findVariantByIdSync works without async
- [ ] findVariantsByProductId computes stock correctly
- [ ] updateVariantById updates all fields properly

## Service Layer Tests

### Product Service
- [ ] createProductWithVariants validates at least one variant
- [ ] createProductWithVariants handles NULL category_id
- [ ] createProductWithVariants uses tax_category_id not deprecated setProductTaxes
- [ ] createProductWithVariants creates inventory lots for initial stock
- [ ] createProductWithVariants logs audit trail
- [ ] updateProduct validates product exists
- [ ] updateProduct validates variant ownership
- [ ] updateProduct deletes old image after successful update
- [ ] updateProduct handles transaction rollback on error
- [ ] updateProduct logs audit trail with old/new data
- [ ] deleteProduct validates product exists
- [ ] deleteProduct wraps in transaction
- [ ] deleteProduct deletes image after successful delete
- [ ] deleteProduct logs audit trail

### Variant Service
- [ ] addVariant creates inventory lot for initial stock
- [ ] updateVariant adjusts inventory when stock changes
- [ ] updateVariant uses CORRECTION reason for adjustments
- [ ] deleteVariant soft deletes correctly

### Inventory Service
- [ ] receiveInventory creates lot and adjustment
- [ ] adjustInventory validates reason
- [ ] adjustInventory checks stock availability for negative adjustments
- [ ] adjustInventory uses FIFO for lot-less deductions
- [ ] adjustInventory logs to product flow
- [ ] adjustInventory logs to audit trail

## Controller Layer Tests

### Request Validation
- [ ] createProductController checks auth first
- [ ] createProductController validates variants array not empty
- [ ] createProductController converts category_id to NULL not 0
- [ ] createProductController cleans up image on error
- [ ] updateProductController checks auth first
- [ ] updateProductController handles NULL category_id
- [ ] updateProductController returns 404 for non-existent product
- [ ] deleteProductController checks auth first
- [ ] deleteProductController validates product ID format
- [ ] deleteProductController returns 404 for non-existent product

### Error Handling
- [ ] All controllers return proper HTTP status codes
- [ ] All controllers log errors with details
- [ ] All controllers clean up uploaded files on error
- [ ] All controllers return meaningful error messages

## Routes/Middleware Tests

### Authentication
- [ ] All product routes require authentication
- [ ] GET routes allow reports.view OR sales.create OR products.manage
- [ ] POST/PUT/DELETE routes require products.manage
- [ ] Invalid tokens return 401
- [ ] Missing permissions return 403

### Validation
- [ ] createProductSchema validates required fields
- [ ] createProductSchema validates variant structure
- [ ] createProductSchema transforms string numbers correctly
- [ ] updateProductSchema allows partial updates
- [ ] getProductSchema validates ID format

## Frontend Integration Tests

### API Layer
- [ ] productsApi handles FormData correctly
- [ ] productsApi includes auth token
- [ ] productsApi invalidates cache on mutations
- [ ] productsApi handles errors gracefully

### State Management
- [ ] productsSlice maintains filter state
- [ ] productsSlice resets page on filter change
- [ ] productsSlice clears filters correctly

### UI Components
- [ ] ProductsPage handles loading state
- [ ] ProductsPage handles error state
- [ ] ProductsPage calculates stats safely with null checks
- [ ] AddOrEditProductPage validates before submit
- [ ] AddOrEditProductPage handles create/update errors
- [ ] AddOrEditProductPage cleans up on unmount

## Edge Cases

### Concurrent Operations
- [ ] Two users creating products simultaneously
- [ ] Two users updating same product simultaneously
- [ ] Creating product while another is being deleted
- [ ] Stock adjustment during product update

### Data Integrity
- [ ] Product with no variants cannot be created
- [ ] Variant cannot be assigned to non-existent product
- [ ] Variant cannot be moved to different product
- [ ] Deleting product soft-deletes all variants
- [ ] Stock cannot go negative (or handles gracefully)

### Null/Undefined Handling
- [ ] Product with NULL category_id
- [ ] Product with NULL tax_category_id
- [ ] Product with NULL description
- [ ] Product with NULL image_path
- [ ] Variant with NULL sku
- [ ] Variant with 0 stock_alert_cap

### Invalid Input
- [ ] Empty product name
- [ ] Empty variant name
- [ ] Negative prices
- [ ] Invalid status values
- [ ] Invalid category_id (non-existent)
- [ ] Invalid tax_category_id (non-existent)
- [ ] Malformed JSON in variants
- [ ] SQL injection attempts in search

## Performance Tests

### Query Optimization
- [ ] Product list query uses indexes
- [ ] Stock calculation uses batch queries
- [ ] Soft delete queries use deleted_at index
- [ ] Pagination works efficiently with large datasets

### Transaction Performance
- [ ] Product creation with multiple variants is atomic
- [ ] Product update with variant changes is atomic
- [ ] Rollback works correctly on error

## Security Tests

### Permission Enforcement
- [ ] Cannot create product without products.manage
- [ ] Cannot update product without products.manage
- [ ] Cannot delete product without products.manage
- [ ] Can view products with reports.view
- [ ] Can view products with sales.create

### Data Exposure
- [ ] Soft-deleted products not visible in queries
- [ ] Soft-deleted variants not visible in queries
- [ ] Cannot access other user's session data
- [ ] Audit logs capture all changes

## Logging Tests

### Audit Trail
- [ ] Product creation logged with user_id
- [ ] Product update logged with old/new data
- [ ] Product deletion logged with old data
- [ ] Inventory adjustments logged
- [ ] All logs include timestamp

### Error Logging
- [ ] Failed operations logged to console
- [ ] Stack traces available for debugging
- [ ] User-friendly errors returned to client

## Integration Tests

### Cross-Module
- [ ] Product creation triggers inventory lot creation
- [ ] Product update triggers inventory adjustment
- [ ] Product deletion doesn't break sales history
- [ ] Category deletion doesn't break products (FK constraint)
- [ ] Tax category changes apply correctly

### End-to-End
- [ ] Create product → View in list → Edit → Delete
- [ ] Create product with stock → Sell item → Check stock
- [ ] Create product → Add variant → Update variant → Delete variant
- [ ] Filter products by category → Results correct
- [ ] Search products by name → Results correct
- [ ] Sort products by stock → Order correct
