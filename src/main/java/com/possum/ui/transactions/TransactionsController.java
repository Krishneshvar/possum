package com.possum.ui.transactions;

import com.possum.application.auth.AuthContext;
import com.possum.application.transactions.TransactionService;
import com.possum.domain.model.Transaction;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.TransactionFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.Label;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class TransactionsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Transaction> transactionsTable;
    @FXML private PaginationBar paginationBar;
    
    private final TransactionService transactionService;
    private final com.possum.application.sales.SalesService salesService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private List<String> currentTypes = null;
    private List<Long> currentPaymentMethodIds = null;
    private java.time.LocalDate fromDate = null;
    private java.time.LocalDate toDate = null;
    private BigDecimal currentMinAmount = null;
    private BigDecimal currentMaxAmount = null;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public TransactionsController(TransactionService transactionService, 
                                  com.possum.application.sales.SalesService salesService,
                                  WorkspaceManager workspaceManager) {
        this.transactionService = transactionService;
        this.salesService = salesService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        
        setupTable();
        setupFilters();
        loadTransactions();
    }

    @FXML
    private void handleRefresh() {
        loadTransactions();
    }

    private void setupTable() {
        TableColumn<Transaction, String> typeCol = new TableColumn<>("Type");
        typeCol.setSortable(false);
        typeCol.setCellValueFactory(cellData -> {
            String type = cellData.getValue().type();
            if ("payment".equals(type)) return new SimpleStringProperty("Sale");
            return new SimpleStringProperty(toTitleCase(type));
        });
        
        TableColumn<Transaction, BigDecimal> amountCol = new TableColumn<>("Amount");
        amountCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().amount()));
        amountCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(currencyFormat.format(item.abs()));
                    setStyle(item.compareTo(BigDecimal.ZERO) < 0 ? "-fx-text-fill: #ef4444;" : "-fx-text-fill: #10b981;");
                }
            }
        });
        
        TableColumn<Transaction, String> paymentCol = new TableColumn<>("Payment Method");
        paymentCol.setSortable(false);
        paymentCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().paymentMethodName()));
        
        TableColumn<Transaction, String> statusCol = new TableColumn<>("Status");
        statusCol.setSortable(false);
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(toTitleCase(cellData.getValue().status())));
        
        TableColumn<Transaction, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().transactionDate()));
        dateCol.setCellFactory(col -> new TableCell<>() {
            private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
            @Override
            protected void updateItem(LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    // Convert from UTC to the system's local timezone for accurate local display
                    ZonedDateTime utcZoned = item.atZone(ZoneId.of("UTC"));
                    ZonedDateTime localZoned = utcZoned.withZoneSameInstant(ZoneId.systemDefault());
                    setText(localZoned.format(formatter));
                }
            }
        });
        
        TableColumn<Transaction, String> refCol = new TableColumn<>("Reference");
        refCol.setSortable(false);
        refCol.setCellValueFactory(cellData -> {
            Transaction tx = cellData.getValue();
            return new SimpleStringProperty(tx.invoiceNumber() != null ? tx.invoiceNumber() : "-");
        });
        refCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null || "-".equals(item)) {
                    setText(item);
                    setGraphic(null);
                } else {
                    javafx.scene.layout.HBox container = new javafx.scene.layout.HBox(10);
                    container.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
                    
                    Label label = new Label(item);
                    javafx.scene.control.Button viewBtn = new javafx.scene.control.Button("👁");
                    viewBtn.getStyleClass().add("button-icon-only");
                    viewBtn.setStyle("-fx-padding: 0 4; -fx-font-size: 10px;");
                    viewBtn.setOnAction(e -> handleViewBill(item));
                    
                    container.getChildren().addAll(label, viewBtn);
                    setGraphic(container);
                    setText(null);
                }
            }
        });
        
        transactionsTable.getTableView().getColumns().addAll(typeCol, amountCol, paymentCol, statusCol, dateCol, refCol);
    }

    private void handleViewBill(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) return;
        
        salesService.findSaleByInvoiceNumber(invoiceNumber).ifPresent(sale -> {
            java.util.Map<String, Object> params = new java.util.HashMap<>();
            params.put("sale", sale);
            workspaceManager.openOrFocusWindow("Bill: " + sale.invoiceNumber(), "/fxml/sales/sale-detail-view.fxml", params);
        });
    }

    private void setupFilters() {
        filterBar.addMultiSelectFilter("type", "All Types", 
                List.of("Sale", "Refund", "Purchase"),
                s -> s,
                false
        );

        List<com.possum.domain.model.PaymentMethod> pms = salesService.getPaymentMethods();
        filterBar.addMultiSelectFilter("paymentMethod", "All Payments", pms, 
                com.possum.domain.model.PaymentMethod::name,
                false);

        filterBar.addDateFilter("fromDate", "From Date");
        filterBar.addDateFilter("toDate", "To Date");
        filterBar.addTextFilter("minAmount", "Min Amount");
        filterBar.addTextFilter("maxAmount", "Max Amount");
        
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            List<String> types = (List<String>) filters.get("type");
            if (types == null || types.isEmpty()) {
                currentTypes = null;
            } else {
                currentTypes = types.stream()
                        .map(t -> "Sale".equals(t) ? "payment" : t.toLowerCase())
                        .toList();
            }

            List<com.possum.domain.model.PaymentMethod> selectedPms = (List<com.possum.domain.model.PaymentMethod>) filters.get("paymentMethod");
            if (selectedPms == null || selectedPms.isEmpty()) {
                currentPaymentMethodIds = null;
            } else {
                currentPaymentMethodIds = selectedPms.stream()
                        .map(com.possum.domain.model.PaymentMethod::id)
                        .toList();
            }

            fromDate = (LocalDate) filters.get("fromDate");
            toDate = (LocalDate) filters.get("toDate");

            currentMinAmount = parseBigDecimal(filters.get("minAmount"));
            currentMaxAmount = parseBigDecimal(filters.get("maxAmount"));
            
            loadTransactions();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadTransactions());
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        try {
            String s = value.toString().replaceAll("[^0-9.\\-]", "");
            return s.isEmpty() ? null : new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }

    private void loadTransactions() {
        transactionsTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                TransactionFilter filter = new TransactionFilter(
                    fromDate != null ? fromDate.atStartOfDay().toString() : null,
                    toDate != null ? toDate.atTime(23, 59, 59).toString() : null,
                    currentTypes,
                    currentMinAmount,
                    currentMaxAmount,
                    currentPaymentMethodIds,
                    null,
                    currentSearch.isEmpty() ? null : currentSearch,
                    paginationBar.getCurrentPage() + 1,
                    paginationBar.getPageSize(),
                    "transaction_date",
                    "DESC"
                );
                
                Set<String> permissions = new HashSet<>(AuthContext.getCurrentUser().permissions());
                PagedResult<Transaction> result = transactionService.getTransactions(filter, permissions);
                
                transactionsTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                transactionsTable.setLoading(false);
            } catch (Exception e) {
                transactionsTable.setLoading(false);
                NotificationService.error("Failed to load transactions");
            }
        });
    }
    private String toTitleCase(String input) {
        if (input == null || input.isEmpty()) return "";
        String[] words = input.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) continue;
            sb.append(Character.toUpperCase(word.charAt(0)))
              .append(word.substring(1))
              .append(" ");
        }
        return sb.toString().trim();
    }
}
