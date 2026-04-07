package com.possum.application.sales;

import com.possum.application.inventory.InventoryService;
import com.possum.application.sales.dto.*;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.InsufficientStockException;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.*;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.domain.repositories.*;
import com.possum.domain.services.TaxCalculator;
import com.possum.domain.services.SaleCalculator;

import java.math.BigDecimal;
import com.possum.shared.util.TimeUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public class SalesService {
    private final SalesRepository salesRepository;
    private final VariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final AuditRepository auditRepository;
    private final InventoryService inventoryService;
    private final TaxCalculator taxCalculator;
    private final SaleCalculator saleCalculator;
    private final PaymentService paymentService;
    private final TransactionManager transactionManager;
    private final JsonService jsonService;
    private final SettingsStore settingsStore;
    private final InvoiceNumberService invoiceNumberService;


    public SalesService(SalesRepository salesRepository,
                        VariantRepository variantRepository,
                        ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        AuditRepository auditRepository,
                        InventoryService inventoryService,
                        TaxCalculator taxCalculator,
                        SaleCalculator saleCalculator,
                        PaymentService paymentService,
                        TransactionManager transactionManager,
                        JsonService jsonService,
                        SettingsStore settingsStore,
                        InvoiceNumberService invoiceNumberService) {
        this.salesRepository = salesRepository;
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.auditRepository = auditRepository;
        this.inventoryService = inventoryService;
        this.taxCalculator = taxCalculator;
        this.saleCalculator = saleCalculator;
        this.paymentService = paymentService;
        this.transactionManager = transactionManager;
        this.jsonService = jsonService;
        this.settingsStore = settingsStore;
        this.invoiceNumberService = invoiceNumberService;
    }


    public SaleResponse createSale(CreateSaleRequest request, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_CREATE);
        request.validate();

        // 1. Fetch all variants in batch to minimize queries
        List<Long> variantIds = request.items().stream().map(CreateSaleItemRequest::variantId).toList();
        Map<Long, Variant> variantMap = fetchVariantsBatch(variantIds);

        // 2. Build SaleDraft for calculation
        SaleDraft draft = new SaleDraft();
        if (request.customerId() != null) {
            Customer customer = customerRepository.findCustomerById(request.customerId()).orElse(null);
            draft.setSelectedCustomer(customer);
        }
        
        draft.setOverallDiscountValue(request.discount() != null ? request.discount() : BigDecimal.ZERO);
        draft.setDiscountFixed(true); 

        for (CreateSaleItemRequest itemReq : request.items()) {
            Variant v = variantMap.get(itemReq.variantId());
            if (v == null) {
                throw new NotFoundException("Variant not found: " + itemReq.variantId());
            }
            CartItem cartItem = new CartItem(v, itemReq.quantity());
            cartItem.setPricePerUnit(itemReq.pricePerUnit() != null ? itemReq.pricePerUnit() : v.price());
            cartItem.setDiscountType("fixed");
            cartItem.setDiscountValue(itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO);
            
            draft.addItem(cartItem);
        }

        // 3. Perform Domain Calculation
        saleCalculator.recalculate(draft);

        // 4. Persistence logic
        long saleId = transactionManager.runInTransaction(() -> {
            boolean enforceInventoryRestrictions = isInventoryRestrictionsEnabled();
            
            // Generate Invoice Number
            String invoiceNumber = invoiceNumberService.generate(userId);
            
            Sale saleEntity = new Sale(
                    null,
                    invoiceNumber,
                    com.possum.shared.util.TimeUtil.nowUTC(),
                    draft.getTotal(),
                    BigDecimal.ZERO, // paid amount (updated later)
                    draft.getDiscountTotal(),
                    draft.getTaxAmount(),
                    "draft", 
                    "pending",
                    draft.getSelectedCustomer() != null ? draft.getSelectedCustomer().id() : null,
                    userId,
                    null, null, null, null, null, null
            );

            long newSaleId = salesRepository.insertSale(saleEntity);
            
            // Save Items
            for (CartItem cartItem : draft.getItems()) {
                SaleItem item = new SaleItem(
                        null,
                        newSaleId,
                        cartItem.getVariant().id(),
                        cartItem.getVariant().name(),
                        cartItem.getVariant().sku(),
                        cartItem.getVariant().productName(),
                        cartItem.getQuantity(),
                        cartItem.getPricePerUnit(),
                        cartItem.getVariant().costPrice(),
                        cartItem.getTaxRate(),
                        cartItem.getTaxAmount(),
                        cartItem.getTaxRate(), 
                        cartItem.getTaxAmount(), 
                        cartItem.getTaxRuleSnapshot(),
                        cartItem.getDiscountAmount(),
                        null
                );
                salesRepository.insertSaleItem(item);

                // Stock deduction
                if (enforceInventoryRestrictions) {
                    int currentStock = inventoryService.getVariantStock(cartItem.getVariant().id());
                    if (currentStock < cartItem.getQuantity()) {
                        throw new InsufficientStockException(currentStock, cartItem.getQuantity());
                    }
                }

                inventoryService.deductStock(
                        cartItem.getVariant().id(),
                        cartItem.getQuantity(),
                        userId,
                        InventoryReason.SALE,
                        null,
                        newSaleId
                );
            }

            // Handle payments
            BigDecimal totalPaid = BigDecimal.ZERO;
            if (request.payments() != null) {
                for (PaymentRequest p : request.payments()) {
                    totalPaid = totalPaid.add(p.amount());
                    Transaction transaction = new Transaction(
                            null, p.amount(), "payment", p.paymentMethodId(), 
                            null, "completed", com.possum.shared.util.TimeUtil.nowUTC(), 
                            invoiceNumber, null, null
                    );
                    salesRepository.insertTransaction(transaction, newSaleId);
                }
            }

            // Update Status
            String status = "draft";
            if (totalPaid.compareTo(draft.getTotal()) >= 0) status = "paid";
            else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) status = "partially_paid";
            
            salesRepository.updateSaleStatus(newSaleId, status);
            salesRepository.updateSalePaidAmount(newSaleId, totalPaid);
            if (status.equals("paid") || status.equals("partially_paid")) {
                salesRepository.updateFulfillmentStatus(newSaleId, "fulfilled");
            }
            
            // Audit
            auditRepository.log("sales", newSaleId, "CREATE", jsonService.toJson(saleEntity), userId);
            
            return newSaleId;
        });

        // 5. Finalize Response
        Sale saleResult = salesRepository.findSaleById(saleId).orElseThrow();
        List<SaleItem> itemsResult = salesRepository.findSaleItems(saleId);
        List<Transaction> transactionsResult = salesRepository.findTransactionsBySaleId(saleId);

        return new SaleResponse(saleResult, itemsResult, transactionsResult);
    }

    private Map<Long, Variant> fetchVariantsBatch(List<Long> variantIds) {
        Map<Long, Variant> map = new HashMap<>();
        for (Long id : variantIds) {
            variantRepository.findVariantByIdSync(id).ifPresent(v -> map.put(id, v));
        }
        return map;
    }

    public SaleResponse getSaleDetails(long saleId) {
        Sale sale = salesRepository.findSaleById(saleId)
                .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));
        List<SaleItem> items = salesRepository.findSaleItems(saleId);
        List<Transaction> transactions = salesRepository.findTransactionsBySaleId(saleId);
        return new SaleResponse(sale, items, transactions);
    }

    public Optional<Sale> findSaleByInvoiceNumber(String invoiceNumber) {
        return salesRepository.findSaleByInvoiceNumber(invoiceNumber);
    }

    /**
     * Updates all items of a sale in a single batch.
     * This restores stock for missing items and deducts for new ones,
     * recalculates all taxes, and updates the sale totals.
     */
    public void updateSaleItems(long saleId, List<UpdateSaleItemRequest> itemRequests, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        
        transactionManager.runInTransaction(() -> {
            Sale sale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));

            if ("cancelled".equals(sale.status()) || "refunded".equals(sale.status())) {
                throw new ValidationException("Cannot edit items for a " + sale.status() + " sale");
            }

            List<SaleItem> oldItems = salesRepository.findSaleItems(saleId);
            
            // 1. Restore stock for all old items
            for (SaleItem oldItem : oldItems) {
                inventoryService.restoreStock(
                        oldItem.variantId(),
                        "sale_item",
                        oldItem.id(),
                        oldItem.quantity(),
                        userId,
                        InventoryReason.CORRECTION,
                        "bill_edit_restoration",
                        saleId
                );
                salesRepository.deleteSaleItem(oldItem.id());
            }

            // 2. Fetch variants and validate stock for new items
            List<Long> variantIds = itemRequests.stream().map(UpdateSaleItemRequest::variantId).toList();
            Map<Long, Variant> variantMap = fetchVariantsBatch(variantIds);

            boolean enforceInventoryRestrictions = isInventoryRestrictionsEnabled();
            for (UpdateSaleItemRequest req : itemRequests) {
                if (enforceInventoryRestrictions) {
                    int currentStock = inventoryService.getVariantStock(req.variantId());
                    if (currentStock < req.quantity()) {
                        throw new InsufficientStockException(currentStock, req.quantity());
                    }
                }
            }

            // 3. Recalculate Taxes and insert new items
            List<TaxableItem> itemsToCalculate = new ArrayList<>();
            for (UpdateSaleItemRequest req : itemRequests) {
                Variant v = variantMap.get(req.variantId());
                Product p = productRepository.findProductById(v.productId()).orElseThrow();
                
                itemsToCalculate.add(new TaxableItem(
                        p.name(), v.name(), req.pricePerUnit(), req.quantity(),
                        p.taxCategoryId(), v.id(), p.id()
                ));
            }

            Customer customer = sale.customerId() != null ? customerRepository.findCustomerById(sale.customerId()).orElse(null) : null;
            TaxCalculationResult taxResult = taxCalculator.calculate(new TaxableInvoice(itemsToCalculate), customer);


            for (int i = 0; i < itemRequests.size(); i++) {
                UpdateSaleItemRequest req = itemRequests.get(i);
                TaxableItem calculated = taxResult.getItemByIndex(i);
                Variant v = variantMap.get(req.variantId());
                Product p = productRepository.findProductById(v.productId()).orElseThrow();

                SaleItem item = new SaleItem(
                        null, saleId, v.id(), v.name(), v.sku(), p.name(),
                        req.quantity(), req.pricePerUnit(), v.costPrice(),
                        calculated.getTaxRate(), calculated.getTaxAmount(),
                        calculated.getTaxRate(), calculated.getTaxAmount(),
                        calculated.getTaxRuleSnapshot(), req.discount(), null
                );
                long newItemId = salesRepository.insertSaleItem(item);
                
                // Deduct stock for new item
                inventoryService.deductStock(
                        v.id(), req.quantity(), userId, InventoryReason.SALE,
                        "sale_item", newItemId
                );
            }

            // 4. Update Sale Header Totals
            salesRepository.updateSaleTotals(
                    saleId, 
                    taxResult.grandTotal(), 
                    taxResult.totalTax(), 
                    sale.discount() // Keep existing global discount for now
            );

            // 5. Audit the change
            Map<String, Object> oldSummary = Map.of("item_count", oldItems.size(), "total", sale.totalAmount());
            Map<String, Object> newSummary = Map.of("item_count", itemRequests.size(), "total", taxResult.grandTotal());
            
            AuditLog auditLog = new AuditLog(
                    null, userId, "UPDATE", "sales", saleId,
                    jsonService.toJson(oldSummary), jsonService.toJson(newSummary),
                    jsonService.toJson(Map.of("reason", "Line item correction")),
                    null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            return null;
        });
    }

    public void addItemToSale(long saleId, CreateSaleItemRequest item, long userId) {
         // Reusing update logic would be better, but for single add:
         throw new UnsupportedOperationException("Use updateSaleItems for batch modifications.");
    }

    public void removeItemFromSale(long saleId, long saleItemId, long userId) {
         throw new UnsupportedOperationException("Use updateSaleItems for batch modifications.");
    }

    public void cancelSale(long saleId, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        transactionManager.runInTransaction(() -> {
            Sale sale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));

            if ("cancelled".equals(sale.status())) {
                throw new ValidationException("Sale is already cancelled");
            }
            if ("refunded".equals(sale.status())) {
                throw new ValidationException("Cannot cancel a refunded sale");
            }

            List<SaleItem> items = salesRepository.findSaleItems(saleId);
            for (SaleItem item : items) {
                inventoryService.restoreStock(
                        item.variantId(),
                        "sale_item",
                        item.id(),
                        item.quantity(),
                        userId,
                        InventoryReason.CORRECTION,
                        "sale_cancellation",
                        saleId
                );
            }

            salesRepository.updateSaleStatus(saleId, "cancelled");
            salesRepository.updateFulfillmentStatus(saleId, "cancelled");

            Map<String, Object> oldData = Map.of("status", sale.status());
            Map<String, Object> newData = Map.of("status", "cancelled");
            AuditLog auditLog = new AuditLog(
                    null, userId, "UPDATE", "sales", saleId,
                    jsonService.toJson(oldData), jsonService.toJson(newData),
                    jsonService.toJson(Map.of("reason", "Cancellation")),
                    null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            return null;
        });
    }

    public void completeSale(long saleId, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        transactionManager.runInTransaction(() -> {
            Sale sale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));

            if ("fulfilled".equals(sale.fulfillmentStatus())) {
                throw new ValidationException("Sale is already fulfilled");
            }
            if ("cancelled".equals(sale.status())) {
                throw new ValidationException("Cannot fulfill a cancelled sale");
            }

            salesRepository.updateFulfillmentStatus(saleId, "fulfilled");

            Map<String, Object> oldData = Map.of("fulfillment_status", sale.fulfillmentStatus());
            Map<String, Object> newData = Map.of("fulfillment_status", "fulfilled");
            AuditLog auditLog = new AuditLog(
                    null, userId, "UPDATE", "sales", saleId,
                    jsonService.toJson(oldData), jsonService.toJson(newData),
                    null, null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            return null;
        });
    }

    private boolean isInventoryRestrictionsEnabled() {
        try {
            return settingsStore.loadGeneralSettings().isInventoryAlertsAndRestrictionsEnabled();
        } catch (Exception ex) {
            return true;
        }
    }

    public List<PaymentMethod> getPaymentMethods() {
        return paymentService.getActivePaymentMethods();
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findCustomers(
            new com.possum.shared.dto.CustomerFilter(null, null, null, 1, 1000, "name", "asc")
        ).items();
    }

    public com.possum.shared.dto.PagedResult<Sale> findSales(com.possum.shared.dto.SaleFilter filter) {
        return salesRepository.findSales(filter);
    }

    public com.possum.application.sales.dto.SaleStats getSaleStats(com.possum.shared.dto.SaleFilter filter) {
        return salesRepository.getSaleStats(filter);
    }

    public boolean upsertLegacySale(LegacySale legacySale) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        if (legacySale == null) {
            throw new ValidationException("Legacy sale data is required");
        }
        if (legacySale.invoiceNumber() == null || legacySale.invoiceNumber().isBlank()) {
            throw new ValidationException("Invoice number is required for legacy sale");
        }
        if (legacySale.saleDate() == null) {
            throw new ValidationException("Sale date is required for legacy sale");
        }
        if (legacySale.netAmount() == null || legacySale.netAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Legacy net amount must be zero or greater");
        }
        return salesRepository.upsertLegacySale(legacySale);
    }

    public void changeSalePaymentMethod(long saleId, long newPaymentMethodId, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        
        transactionManager.runInTransaction(() -> {
            Sale sale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));

            if ("cancelled".equals(sale.status()) || "refunded".equals(sale.status())) {
                throw new ValidationException("Cannot change payment method for a " + sale.status() + " sale");
            }

            if (!salesRepository.paymentMethodExists(newPaymentMethodId)) {
                throw new NotFoundException("Payment method not found: " + newPaymentMethodId);
            }

            List<Transaction> transactions = salesRepository.findTransactionsBySaleId(saleId);
            Transaction primaryTx = transactions.stream()
                    .filter(t -> "payment".equals(t.type()))
                    .findFirst()
                    .orElseThrow(() -> new ValidationException("No payment transaction found for this sale"));

            if (primaryTx.paymentMethodId() == newPaymentMethodId) {
                return null; // No change needed
            }

            salesRepository.updateTransactionPaymentMethod(saleId, newPaymentMethodId);

            Map<String, Object> oldData = Map.of("payment_method_id", primaryTx.paymentMethodId());
            Map<String, Object> newData = Map.of("payment_method_id", newPaymentMethodId);
            
            AuditLog auditLog = new AuditLog(
                    null, userId, "UPDATE", "transactions", primaryTx.id(),
                    jsonService.toJson(oldData), jsonService.toJson(newData),
                    jsonService.toJson(Map.of("reason", "Payment method correction", "sale_id", saleId)),
                    null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            return null;
        });
    }

    public void changeSaleCustomer(long saleId, Long newCustomerId, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_MANAGE);
        
        transactionManager.runInTransaction(() -> {
            Sale sale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new NotFoundException("Sale not found: " + saleId));

            if ("cancelled".equals(sale.status()) || "refunded".equals(sale.status())) {
                throw new ValidationException("Cannot change customer for a " + sale.status() + " sale");
            }

            if (Objects.equals(sale.customerId(), newCustomerId)) {
                return null; // No change
            }

            salesRepository.updateSaleCustomer(saleId, newCustomerId);

            Map<String, Object> oldData = Map.of("customer_id", sale.customerId() != null ? sale.customerId() : -1L);
            Map<String, Object> newData = Map.of("customer_id", newCustomerId != null ? newCustomerId : -1L);
            
            AuditLog auditLog = new AuditLog(
                    null, userId, "UPDATE", "sales", saleId,
                    jsonService.toJson(oldData), jsonService.toJson(newData),
                    jsonService.toJson(Map.of("reason", "Customer correction")),
                    null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            return null;
        });
    }
}
