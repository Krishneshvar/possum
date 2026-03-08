package com.possum.ui.returns;

import com.possum.application.auth.AuthContext;
import com.possum.application.returns.ReturnsService;
import com.possum.application.returns.dto.CreateReturnItemRequest;
import com.possum.application.returns.dto.CreateReturnRequest;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Return;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ReturnFilter;
import com.possum.shared.dto.SaleFilter;
import com.possum.ui.common.controls.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

public class ReturnsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Return> returnsTable;
    @FXML private PaginationBar paginationBar;
    
    private ReturnsService returnsService;
    private SalesService salesService;
    private SalesRepository salesRepository;
    private String currentSearch = "";
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public void initialize(ReturnsService returnsService, SalesService salesService, SalesRepository salesRepository) {
        this.returnsService = returnsService;
        this.salesService = salesService;
        this.salesRepository = salesRepository;
        
        setupTable();
        setupFilters();
        loadReturns();
    }

    private void setupTable() {
        TableColumn<Return, String> invoiceCol = new TableColumn<>("Invoice");
        invoiceCol.setCellValueFactory(new PropertyValueFactory<>("invoiceNumber"));
        
        TableColumn<Return, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("createdAt"));
        
        TableColumn<Return, BigDecimal> refundCol = new TableColumn<>("Refund");
        refundCol.setCellValueFactory(new PropertyValueFactory<>("totalRefund"));
        refundCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        TableColumn<Return, String> reasonCol = new TableColumn<>("Reason");
        reasonCol.setCellValueFactory(new PropertyValueFactory<>("reason"));
        
        returnsTable.getTableView().getColumns().addAll(invoiceCol, dateCol, refundCol, reasonCol);
        
        returnsTable.addActionColumn("View", this::handleViewDetails);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadReturns();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadReturns());
    }

    private void loadReturns() {
        returnsTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                ReturnFilter filter = new ReturnFilter(
                    null,
                    null,
                    null,
                    null,
                    currentSearch.isEmpty() ? null : currentSearch,
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    "created_at",
                    "DESC"
                );
                
                PagedResult<Return> result = returnsService.getReturns(filter);
                
                returnsTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                returnsTable.setLoading(false);
            } catch (Exception e) {
                returnsTable.setLoading(false);
                NotificationService.error("Failed to load returns");
            }
        });
    }

    @FXML
    private void handleCreateReturn() {
        // Step 1: Select sale
        Dialog<Sale> saleDialog = new Dialog<>();
        saleDialog.setTitle("Select Sale");
        saleDialog.setHeaderText("Enter invoice number or sale ID");
        
        TextField saleInput = new TextField();
        saleInput.setPromptText("Invoice number or ID");
        
        VBox content = new VBox(10, new Label("Sale:"), saleInput);
        content.setPadding(new Insets(20));
        saleDialog.getDialogPane().setContent(content);
        saleDialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        
        saleDialog.setResultConverter(btn -> {
            if (btn == ButtonType.OK) {
                try {
                    String input = saleInput.getText().trim();
                    if (input.startsWith("INV-")) {
                        return salesRepository.findSaleById(Long.parseLong(input)).orElse(null);
                    } else {
                        long saleId = Long.parseLong(input);
                        return salesRepository.findSaleById(saleId).orElse(null);
                    }
                } catch (Exception e) {
                    return null;
                }
            }
            return null;
        });
        
        saleDialog.showAndWait().ifPresent(sale -> {
            if (sale == null) {
                NotificationService.error("Sale not found");
                return;
            }
            showReturnItemsDialog(sale);
        });
    }

    private void showReturnItemsDialog(Sale sale) {
        // Step 2: Display sale items
        SaleResponse saleDetails = salesService.getSaleDetails(sale.id());
        
        Dialog<List<ReturnItemSelection>> itemDialog = new Dialog<>();
        itemDialog.setTitle("Select Items to Return");
        itemDialog.setHeaderText("Sale: " + sale.invoiceNumber());
        
        VBox content = new VBox(10);
        content.setPadding(new Insets(20));
        
        List<ReturnItemSelection> selections = new ArrayList<>();
        
        for (SaleItem item : saleDetails.items()) {
            int available = item.quantity() - (item.returnedQuantity() != null ? item.returnedQuantity() : 0);
            if (available <= 0) continue;
            
            HBox row = new HBox(10);
            CheckBox check = new CheckBox(String.format("%s - %s (Available: %d)",
                item.productName(), item.variantName(), available));
            Spinner<Integer> spinner = new Spinner<>(0, available, 0);
            spinner.setMaxWidth(80);
            spinner.setDisable(true);
            
            check.selectedProperty().addListener((obs, old, selected) -> {
                spinner.setDisable(!selected);
                if (selected) spinner.getValueFactory().setValue(available);
            });
            
            row.getChildren().addAll(check, spinner);
            content.getChildren().add(row);
            
            selections.add(new ReturnItemSelection(item, check, spinner));
        }
        
        ScrollPane scroll = new ScrollPane(content);
        scroll.setFitToWidth(true);
        scroll.setPrefHeight(300);
        
        itemDialog.getDialogPane().setContent(scroll);
        itemDialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        
        itemDialog.setResultConverter(btn -> {
            if (btn == ButtonType.OK) {
                return selections.stream()
                    .filter(s -> s.check.isSelected() && s.spinner.getValue() > 0)
                    .toList();
            }
            return null;
        });
        
        itemDialog.showAndWait().ifPresent(selected -> {
            if (selected.isEmpty()) {
                NotificationService.warning("No items selected");
                return;
            }
            showRefundPreview(sale, selected);
        });
    }

    private void showRefundPreview(Sale sale, List<ReturnItemSelection> selections) {
        // Step 4: Calculate refund preview
        BigDecimal refundTotal = selections.stream()
            .map(s -> s.item.pricePerUnit().multiply(BigDecimal.valueOf(s.spinner.getValue())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Step 5: Confirm return
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Confirm Return");
        confirm.setHeaderText("Refund Preview");
        confirm.setContentText(String.format(
            "Items: %d\nRefund Amount: %s\n\nConfirm return?",
            selections.size(), currencyFormat.format(refundTotal)
        ));
        
        TextInputDialog reasonDialog = new TextInputDialog();
        reasonDialog.setTitle("Return Reason");
        reasonDialog.setHeaderText("Enter reason for return:");
        reasonDialog.setContentText("Reason:");
        
        reasonDialog.showAndWait().ifPresent(reason -> {
            if (reason.trim().isEmpty()) {
                NotificationService.error("Reason is required");
                return;
            }
            
            confirm.showAndWait().ifPresent(response -> {
                if (response == ButtonType.OK) {
                    processReturn(sale, selections, reason);
                }
            });
        });
    }

    private void processReturn(Sale sale, List<ReturnItemSelection> selections, String reason) {
        try {
            List<CreateReturnItemRequest> items = selections.stream()
                .map(s -> new CreateReturnItemRequest(s.item.id(), s.spinner.getValue()))
                .toList();
            
            CreateReturnRequest request = new CreateReturnRequest(
                sale.id(),
                items,
                reason,
                AuthContext.getCurrentUser().id()
            );
            
            returnsService.createReturn(request);
            NotificationService.success("Return processed successfully");
            loadReturns();
            
        } catch (Exception e) {
            NotificationService.error("Return failed: " + e.getMessage());
        }
    }

    private void handleViewDetails(Return returnRecord) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Return Details");
        alert.setHeaderText("Return #" + returnRecord.id());
        alert.setContentText(String.format(
            "Invoice: %s\nDate: %s\nRefund: %s\nReason: %s\nProcessed by: %s",
            returnRecord.invoiceNumber(),
            returnRecord.createdAt(),
            currencyFormat.format(returnRecord.totalRefund()),
            returnRecord.reason(),
            returnRecord.processedByName()
        ));
        alert.showAndWait();
    }

    private static class ReturnItemSelection {
        SaleItem item;
        CheckBox check;
        Spinner<Integer> spinner;
        
        ReturnItemSelection(SaleItem item, CheckBox check, Spinner<Integer> spinner) {
            this.item = item;
            this.check = check;
            this.spinner = spinner;
        }
    }
}
