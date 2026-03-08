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
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.cell.PropertyValueFactory;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class TransactionsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Transaction> transactionsTable;
    @FXML private PaginationBar paginationBar;
    
    private TransactionService transactionService;
    private String currentSearch = "";
    private String currentType = null;
    private String startDate = null;
    private String endDate = null;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public void initialize(TransactionService transactionService) {
        this.transactionService = transactionService;
        
        setupTable();
        setupFilters();
        loadTransactions();
    }

    private void setupTable() {
        TableColumn<Transaction, String> typeCol = new TableColumn<>("Type");
        typeCol.setCellValueFactory(new PropertyValueFactory<>("type"));
        
        TableColumn<Transaction, BigDecimal> amountCol = new TableColumn<>("Amount");
        amountCol.setCellValueFactory(new PropertyValueFactory<>("amount"));
        amountCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(currencyFormat.format(item));
                    setStyle(item.compareTo(BigDecimal.ZERO) < 0 ? "-fx-text-fill: red;" : "-fx-text-fill: green;");
                }
            }
        });
        
        TableColumn<Transaction, String> paymentCol = new TableColumn<>("Payment Method");
        paymentCol.setCellValueFactory(new PropertyValueFactory<>("paymentMethodName"));
        
        TableColumn<Transaction, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));
        
        TableColumn<Transaction, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("transactionDate"));
        
        TableColumn<Transaction, String> refCol = new TableColumn<>("Reference");
        refCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setText(null);
                } else {
                    Transaction tx = getTableView().getItems().get(getIndex());
                    if (tx.saleId() != null) {
                        setText("Sale #" + tx.saleId() + (tx.invoiceNumber() != null ? " (" + tx.invoiceNumber() + ")" : ""));
                    } else if (tx.purchaseOrderId() != null) {
                        setText("PO #" + tx.purchaseOrderId());
                    } else {
                        setText("-");
                    }
                }
            }
        });
        
        transactionsTable.getTableView().getColumns().addAll(typeCol, amountCol, paymentCol, statusCol, dateCol, refCol);
    }

    private void setupFilters() {
        ComboBox<String> typeFilter = filterBar.addFilter("type", "Type");
        typeFilter.getItems().addAll("All", "payment", "refund", "purchase");
        typeFilter.setValue("All");
        
        ComboBox<String> dateFilter = filterBar.addFilter("dateRange", "Date Range");
        dateFilter.getItems().addAll("All", "Today", "This Week", "This Month");
        dateFilter.setValue("All");
        
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            String type = (String) filters.get("type");
            currentType = "All".equals(type) ? null : type;
            
            String range = (String) filters.get("dateRange");
            updateDateRange(range);
            
            loadTransactions();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadTransactions());
    }

    private void updateDateRange(String range) {
        LocalDate now = LocalDate.now();
        switch (range) {
            case "Today":
                startDate = now.toString();
                endDate = now.toString();
                break;
            case "This Week":
                startDate = now.minusDays(7).toString();
                endDate = now.toString();
                break;
            case "This Month":
                startDate = now.withDayOfMonth(1).toString();
                endDate = now.toString();
                break;
            default:
                startDate = null;
                endDate = null;
        }
    }

    private void loadTransactions() {
        transactionsTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                TransactionFilter filter = new TransactionFilter(
                    startDate,
                    endDate,
                    currentType,
                    null,
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
}
