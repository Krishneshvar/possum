package com.possum.application.sales;

import com.possum.application.inventory.InventoryService;
import com.possum.application.sales.dto.*;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.InsufficientStockException;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.*;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import com.possum.shared.util.TimeUtil;
import java.util.*;
import java.util.Objects;

public class SalesService {
    private final SalesRepository salesRepository;
    private final VariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final AuditRepository auditRepository;
    private final InventoryService inventoryService;
    private final TaxEngine taxEngine;
    private final PaymentService paymentService;
    private final TransactionManager transactionManager;
    private final JsonService jsonService;

    public SalesService(SalesRepository salesRepository,
                        VariantRepository variantRepository,
                        ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        AuditRepository auditRepository,
                        InventoryService inventoryService,
                        TaxEngine taxEngine,
                        PaymentService paymentService,
                        TransactionManager transactionManager,
                        JsonService jsonService) {
        this.salesRepository = salesRepository;
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.auditRepository = auditRepository;
        this.inventoryService = inventoryService;
        this.taxEngine = taxEngine;
        this.paymentService = paymentService;
        this.transactionManager = transactionManager;
        this.jsonService = jsonService;
    }

    public SaleResponse createSale(CreateSaleRequest request, long userId) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SALES_CREATE);
        request.validate();

        BigDecimal discount = request.discount() != null ? request.discount() : BigDecimal.ZERO;
        List<PaymentRequest> payments = request.payments() != null ? request.payments() : List.of();

        for (PaymentRequest payment : payments) {
            paymentService.validatePaymentMethod(payment.paymentMethodId());
        }

        List<Long> variantIds = request.items().stream().map(CreateSaleItemRequest::variantId).toList();
        Map<Long, Variant> variantMap = fetchVariantsBatch(variantIds);

        return transactionManager.runInTransaction(() -> {
            // Stock validation inside transaction
            for (CreateSaleItemRequest item : request.items()) {
                Variant variant = variantMap.get(item.variantId());
                if (variant == null) {
                    throw new NotFoundException("Variant not found: " + item.variantId());
                }

                int currentStock = inventoryService.getVariantStock(item.variantId());
                if (currentStock < item.quantity()) {
                    throw new InsufficientStockException(currentStock, item.quantity());
                }
            }

            taxEngine.init();

            // Calculate gross total
            BigDecimal grossTotal = BigDecimal.ZERO;
            List<TempItem> tempItems = new ArrayList<>();

            for (CreateSaleItemRequest item : request.items()) {
                Variant variant = variantMap.get(item.variantId());
                BigDecimal pricePerUnit = item.pricePerUnit() != null ? item.pricePerUnit() : variant.price();
                BigDecimal lineTotal = pricePerUnit.multiply(BigDecimal.valueOf(item.quantity()));
                BigDecimal lineDiscount = item.discount() != null ? item.discount() : BigDecimal.ZERO;
                BigDecimal netLineTotal = lineTotal.subtract(lineDiscount).max(BigDecimal.ZERO);

                grossTotal = grossTotal.add(netLineTotal);
                tempItems.add(new TempItem(item, pricePerUnit, netLineTotal));
            }

            // Distribute global discount
            BigDecimal distributedGlobalDiscount = BigDecimal.ZERO;
            List<TaxableItem> calculationItems = new ArrayList<>();

            for (int i = 0; i < tempItems.size(); i++) {
                TempItem tempItem = tempItems.get(i);
                Variant variant = variantMap.get(tempItem.item.variantId());
                Product product = productRepository.findProductById(variant.productId())
                        .orElseThrow(() -> new NotFoundException("Product not found"));

                BigDecimal itemGlobalDiscount = BigDecimal.ZERO;
                if (grossTotal.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(BigDecimal.ZERO) > 0) {
                    if (i == tempItems.size() - 1) {
                        itemGlobalDiscount = discount.subtract(distributedGlobalDiscount);
                    } else {
                        itemGlobalDiscount = tempItem.netLineTotal
                                .divide(grossTotal, 10, RoundingMode.HALF_UP)
                                .multiply(discount);
                        distributedGlobalDiscount = distributedGlobalDiscount.add(itemGlobalDiscount);
                    }
                }

                BigDecimal finalTaxableAmount = tempItem.netLineTotal.subtract(itemGlobalDiscount).max(BigDecimal.ZERO);
                BigDecimal effectiveUnitPrice = tempItem.item.quantity() > 0
                        ? finalTaxableAmount.divide(BigDecimal.valueOf(tempItem.item.quantity()), 10, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                TaxableItem taxableItem = new TaxableItem(
                        product.name(),
                        variant.name(),
                        effectiveUnitPrice,
                        tempItem.item.quantity(),
                        product.taxCategoryId(),
                        variant.id(),
                        product.id()
                );
                calculationItems.add(taxableItem);
            }

            Customer customer = null;
            if (request.customerId() != null) {
                customer = customerRepository.findCustomerById(request.customerId()).orElse(null);
            }

            TaxCalculationResult taxResult = taxEngine.calculate(new TaxableInvoice(calculationItems), customer);

            BigDecimal totalTax = taxResult.totalTax();
            List<ProcessedItem> processedItems = new ArrayList<>();

            for (int i = 0; i < request.items().size(); i++) {
                CreateSaleItemRequest item = request.items().get(i);
                TaxableItem calculatedItem = taxResult.getItemByIndex(i);
                Variant variant = variantMap.get(item.variantId());
                Product product = productRepository.findProductById(variant.productId())
                        .orElseThrow(() -> new NotFoundException("Product not found"));

                BigDecimal pricePerUnit = item.pricePerUnit() != null ? item.pricePerUnit() : variant.price();
                BigDecimal costPerUnit = variant.costPrice() != null ? variant.costPrice() : BigDecimal.ZERO;
                BigDecimal itemDiscount = item.discount() != null ? item.discount() : BigDecimal.ZERO;

                processedItems.add(new ProcessedItem(
                        item.variantId(),
                        variant.name(),
                        variant.sku(),
                        product.name(),
                        item.quantity(),
                        pricePerUnit,
                        costPerUnit,
                        calculatedItem.getTaxRate(),
                        calculatedItem.getTaxAmount(),
                        itemDiscount,
                        calculatedItem.getTaxRuleSnapshot()
                ));
            }

            BigDecimal totalAmount = taxResult.grandTotal();
            BigDecimal paidAmount = payments.stream()
                    .map(PaymentRequest::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String status = determineStatus(paidAmount, totalAmount);
            String fulfillmentStatus = "paid".equals(status) ? "fulfilled" : "pending";

            // Resolve primary payment method code (use first payment if multiple).
            long primaryPaymentMethodId = payments.isEmpty() ? 0L : payments.get(0).paymentMethodId();
            String invoiceNumber = generateInvoiceNumber(primaryPaymentMethodId);

            Sale sale = new Sale(
                    null,
                    invoiceNumber,
                    TimeUtil.nowUTC(),
                    totalAmount,
                    paidAmount,
                    discount,
                    totalTax,
                    status,
                    fulfillmentStatus,
                    request.customerId(),
                    userId,
                    null, null, null, null, null, null
            );

            long saleId = salesRepository.insertSale(sale);

            List<SaleItem> insertedItems = new ArrayList<>();
            for (ProcessedItem item : processedItems) {
                SaleItem saleItem = new SaleItem(
                        null,
                        saleId,
                        item.variantId,
                        item.variantName,
                        item.sku,
                        item.productName,
                        item.quantity,
                        item.pricePerUnit,
                        item.costPerUnit,
                        item.taxRate,
                        item.taxAmount,
                        item.taxRate,
                        item.taxAmount,
                        item.taxRuleSnapshot,
                        item.discountAmount,
                        null
                );

                long saleItemId = salesRepository.insertSaleItem(saleItem);

                inventoryService.deductStock(
                        item.variantId,
                        item.quantity,
                        userId,
                        InventoryReason.SALE,
                        "sale_item",
                        saleItemId
                );

                insertedItems.add(new SaleItem(
                        saleItemId,
                        saleId,
                        item.variantId,
                        item.variantName,
                        item.sku,
                        item.productName,
                        item.quantity,
                        item.pricePerUnit,
                        item.costPerUnit,
                        item.taxRate,
                        item.taxAmount,
                        item.taxRate,
                        item.taxAmount,
                        item.taxRuleSnapshot,
                        item.discountAmount,
                        null
                ));
            }

            List<Transaction> insertedTransactions = new ArrayList<>();
            for (PaymentRequest payment : payments) {
                Transaction transaction = new Transaction(
                        null,
                        payment.amount(),
                        "payment",
                        payment.paymentMethodId(),
                        null,
                        "completed",
                        TimeUtil.nowUTC(),
                        invoiceNumber,
                        null, null
                );
                long txId = salesRepository.insertTransaction(transaction, saleId);
                insertedTransactions.add(new Transaction(
                        txId,
                        payment.amount(),
                        "payment",
                        payment.paymentMethodId(),
                        null,
                        "completed",
                        TimeUtil.nowUTC(),
                        invoiceNumber,
                        null, null
                ));
            }

            Map<String, Object> auditData = Map.of(
                    "invoice_number", invoiceNumber,
                    "total_amount", totalAmount,
                    "items_count", processedItems.size()
            );
            AuditLog auditLog = new AuditLog(
                    null, userId, "CREATE", "sales", saleId,
                    null, jsonService.toJson(auditData), null, null, TimeUtil.nowUTC()
            );
            auditRepository.insertAuditLog(auditLog);

            Sale createdSale = salesRepository.findSaleById(saleId)
                    .orElseThrow(() -> new RuntimeException("Failed to retrieve created sale"));

            return new SaleResponse(createdSale, insertedItems, insertedTransactions);
        });
    }

    private Map<Long, Variant> fetchVariantsBatch(List<Long> variantIds) {
        Map<Long, Variant> map = new HashMap<>();
        for (Long id : variantIds) {
            variantRepository.findVariantByIdSync(id).ifPresent(v -> map.put(id, v));
        }
        return map;
    }

    private String determineStatus(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount.compareTo(BigDecimal.ZERO) == 0) {
            return "draft";
        } else if (paidAmount.compareTo(totalAmount) >= 0) {
            return "paid";
        } else {
            return "partially_paid";
        }
    }

    /**
     * Generates a new invoice number in the format: S{YY}{MM}{DD}{PT}{SEQ:4d}
     * e.g. S260326CH0001 for Cash on 2026-03-26 (1st cash sale of all time).
     *
     * @param primaryPaymentMethodId the ID of the first/primary payment method on the sale
     */
    private String generateInvoiceNumber(long primaryPaymentMethodId) {
        String code = "XX";
        if (primaryPaymentMethodId > 0) {
            code = salesRepository.getPaymentMethodCode(primaryPaymentMethodId)
                    .filter(c -> c != null && !c.isBlank())
                    .orElse("XX");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        String yy = String.format("%02d", today.getYear() % 100);
        String mm = String.format("%02d", today.getMonthValue());
        String dd = String.format("%02d", today.getDayOfMonth());

        long seq = salesRepository.getNextSequenceForPaymentType("S_" + code);

        return String.format("S%s%s%s%s%04d", yy, mm, dd, code, seq);
    }

    private record TempItem(CreateSaleItemRequest item, BigDecimal pricePerUnit, BigDecimal netLineTotal) {}
    private record ProcessedItem(long variantId, String variantName, String sku, String productName, 
                                  int quantity, BigDecimal pricePerUnit, BigDecimal costPerUnit,
                                  BigDecimal taxRate, BigDecimal taxAmount, BigDecimal discountAmount,
                                  String taxRuleSnapshot) {}

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

            for (UpdateSaleItemRequest req : itemRequests) {
                int currentStock = inventoryService.getVariantStock(req.variantId());
                if (currentStock < req.quantity()) {
                    throw new InsufficientStockException(currentStock, req.quantity());
                }
            }

            // 3. Recalculate Taxes and insert new items
            taxEngine.init();
            List<TaxableItem> calculationItems = new ArrayList<>();
            for (UpdateSaleItemRequest req : itemRequests) {
                Variant v = variantMap.get(req.variantId());
                Product p = productRepository.findProductById(v.productId()).orElseThrow();
                
                calculationItems.add(new TaxableItem(
                        p.name(), v.name(), req.pricePerUnit(), req.quantity(),
                        p.taxCategoryId(), v.id(), p.id()
                ));
            }

            Customer customer = sale.customerId() != null ? customerRepository.findCustomerById(sale.customerId()).orElse(null) : null;
            TaxCalculationResult taxResult = taxEngine.calculate(new TaxableInvoice(calculationItems), customer);

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
