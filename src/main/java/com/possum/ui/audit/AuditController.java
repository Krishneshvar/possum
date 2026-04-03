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
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import com.possum.ui.common.dialogs.DialogStyler;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.possum.shared.util.TimeUtil;

public class AuditController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<AuditLog> auditTable;
    @FXML private PaginationBar paginationBar;
    
    private AuditService auditService;
    private String currentSearch = "";
    private java.util.List<String> currentActions = null;
    private String startDateStr = null;
    private String endDateStr = null;

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
        actionCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    Label badge = new Label(item.toUpperCase());
                    badge.getStyleClass().add("badge");
                    
                    String colorClass = switch (item.toUpperCase()) {
                        case "CREATE" -> "badge-success";
                        case "UPDATE" -> "badge-info";
                        case "DELETE" -> "badge-danger";
                        case "LOGIN" -> "badge-primary";
                        case "LOGOUT" -> "badge-secondary";
                        default -> "badge-warning";
                    };
                    badge.getStyleClass().add(colorClass);
                    setGraphic(badge);
                    setContentDisplay(javafx.scene.control.ContentDisplay.GRAPHIC_ONLY);
                }
            }
        });
        
        TableColumn<AuditLog, String> tableCol = new TableColumn<>("Table");
        tableCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().tableName()));
        
        TableColumn<AuditLog, Long> rowCol = new TableColumn<>("Row ID");
        rowCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().rowId()));
        
        TableColumn<AuditLog, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().createdAt()));
        dateCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    LocalDateTime localTime = TimeUtil.toLocal(item);
                    setText(localTime != null ? TimeUtil.formatStandard(localTime) : "");
                }
            }
        });
        
        auditTable.getTableView().getColumns().addAll(userCol, actionCol, tableCol, rowCol, dateCol);
        
        auditTable.addActionColumn("Details", this::showDetails);
    }

    private void setupFilters() {
        java.util.List<String> actions = java.util.List.of("CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT");
        filterBar.addMultiSelectFilter("actions", "All Actions", actions, String::toString);
        
        filterBar.addDateFilter("startDate", "From Date");
        filterBar.addDateFilter("endDate", "To Date");
        
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            @SuppressWarnings("unchecked")
            java.util.List<String> selectedActions = (java.util.List<String>) filters.get("actions");
            currentActions = (selectedActions == null || selectedActions.isEmpty()) ? null : selectedActions;
            
            LocalDate start = (LocalDate) filters.get("startDate");
            LocalDate end = (LocalDate) filters.get("endDate");
            
            startDateStr = start != null ? start.toString() : null;
            endDateStr = end != null ? end.toString() : null;
            
            loadAuditLogs();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadAuditLogs());
    }



    @FXML
    public void handleRefresh() {
        loadAuditLogs();
    }

    private void loadAuditLogs() {
        auditTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                AuditLogFilter filter = new AuditLogFilter(
                    null,
                    null,
                    null,
                    currentActions,
                    startDateStr,
                    endDateStr,
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
        DialogStyler.apply(alert);
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
