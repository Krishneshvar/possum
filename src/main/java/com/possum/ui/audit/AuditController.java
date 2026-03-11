package com.possum.ui.audit;

import com.possum.application.audit.AuditService;
import com.possum.domain.model.AuditLog;
import com.possum.shared.dto.AuditLogFilter;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TableColumn;
import javafx.scene.control.cell.PropertyValueFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AuditController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<AuditLog> auditTable;
    @FXML private PaginationBar paginationBar;
    
    private AuditService auditService;
    private String currentSearch = "";
    private String currentAction = null;
    private String startDate = null;
    private String endDate = null;

    public AuditController(AuditService auditService) {
this.auditService = auditService;
    }

    @FXML
    public void initialize() {
        
        setupTable();
        setupFilters();
        loadAuditLogs();
    }

    private void setupTable() {
        TableColumn<AuditLog, String> userCol = new TableColumn<>("User");
        userCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().userName()));
        
        TableColumn<AuditLog, String> actionCol = new TableColumn<>("Action");
        actionCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().action()));
        
        TableColumn<AuditLog, String> tableCol = new TableColumn<>("Table");
        tableCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().tableName()));
        
        TableColumn<AuditLog, Long> rowCol = new TableColumn<>("Row ID");
        rowCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().rowId()));
        
        TableColumn<AuditLog, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().createdAt()));
        
        auditTable.getTableView().getColumns().addAll(userCol, actionCol, tableCol, rowCol, dateCol);
        
        auditTable.addActionColumn("Details", this::showDetails);
    }

    private void setupFilters() {
        ComboBox<String> actionFilter = filterBar.addFilter("action", "Action");
        actionFilter.getItems().addAll("All", "CREATE", "UPDATE", "DELETE", "login", "logout");
        actionFilter.setValue("All");
        
        ComboBox<String> dateFilter = filterBar.addFilter("dateRange", "Date Range");
        dateFilter.getItems().addAll("All", "Today", "This Week", "This Month");
        dateFilter.setValue("All");
        
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            String action = (String) filters.get("action");
            currentAction = "All".equals(action) ? null : action;
            
            String range = (String) filters.get("dateRange");
            updateDateRange(range);
            
            loadAuditLogs();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadAuditLogs());
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

    private void loadAuditLogs() {
        auditTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                AuditLogFilter filter = new AuditLogFilter(
                    null,
                    null,
                    null,
                    currentAction,
                    startDate,
                    endDate,
                    currentSearch.isEmpty() ? null : currentSearch,
                    "created_at",
                    "DESC",
                    paginationBar.getCurrentPage() + 1,
                    paginationBar.getPageSize()
                );
                
                PagedResult<AuditLog> result = auditService.listAuditEvents(filter);
                
                auditTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                auditTable.setLoading(false);
            } catch (Exception e) {
                auditTable.setLoading(false);
                NotificationService.error("Failed to load audit logs");
            }
        });
    }

    private void showDetails(AuditLog log) {
        javafx.scene.control.Alert alert = new javafx.scene.control.Alert(javafx.scene.control.Alert.AlertType.INFORMATION);
        alert.setTitle("Audit Log Details");
        alert.setHeaderText("Event #" + log.id());
        
        StringBuilder content = new StringBuilder();
        content.append("User: ").append(log.userName()).append("\n");
        content.append("Action: ").append(log.action()).append("\n");
        content.append("Table: ").append(log.tableName()).append("\n");
        content.append("Row ID: ").append(log.rowId()).append("\n");
        content.append("Date: ").append(log.createdAt()).append("\n\n");
        
        if (log.oldData() != null) {
            content.append("Old Data:\n").append(log.oldData()).append("\n\n");
        }
        if (log.newData() != null) {
            content.append("New Data:\n").append(log.newData()).append("\n\n");
        }
        if (log.eventDetails() != null) {
            content.append("Event Details:\n").append(log.eventDetails()).append("\n");
        }
        
        alert.setContentText(content.toString());
        alert.showAndWait();
    }
}
