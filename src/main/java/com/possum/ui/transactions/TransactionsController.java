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

    public TransactionsController(TransactionService transactionService) {
this.transactionService = transactionService;
    }

    @FXML
    public void initialize() {
        
        setupTable();
        setupFilters();
        loadTransactions();
    }

    private void setupTable() {
        TableColumn<Transaction, String> typeCol = new TableColumn<>("Type");
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
                    setText(currencyFormat.format(item));
                    setStyle(item.compareTo(BigDecimal.ZERO) < 0 ? "-fx-text-fill: red;" : "-fx-text-fill: green;");
                }
            }
        });
        
        TableColumn<Transaction, String> paymentCol = new TableColumn<>("Payment Method");
        paymentCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().paymentMethodName()));
        
        TableColumn<Transaction, String> statusCol = new TableColumn<>("Status");
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
        refCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setText(null);
                } else {
                    Transaction tx = getTableView().getItems().get(getIndex());
                    if (tx.saleId() != null) {
                        setText(tx.invoiceNumber() != null ? tx.invoiceNumber() : "Sale #" + tx.saleId());
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
        typeFilter.getItems().addAll("All", "Sale", "Refund", "Purchase");
        typeFilter.setValue("All");
        
        ComboBox<String> dateFilter = filterBar.addFilter("dateRange", "Date Range");
        dateFilter.getItems().addAll("All", "Today", "This Week", "This Month");
        dateFilter.setValue("All");
        
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            String type = (String) filters.get("type");
            if ("All".equals(type)) {
                currentType = null;
            } else if ("Sale".equals(type)) {
                currentType = "payment";
            } else {
                currentType = type.toLowerCase();
            }
            
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
