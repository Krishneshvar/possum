package com.possum.ui.returns;

import com.possum.application.returns.ReturnsService;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Return;
import com.possum.domain.model.SaleItem;
import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ReturnFilter;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.ui.common.dialogs.BillPreviewDialog;
import com.possum.ui.common.controls.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

public class ReturnsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Return> returnsTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button createReturnButton;
    
    private final ReturnsService returnsService;
    private final SalesService salesService;
    private final SalesRepository salesRepository;
    private final SettingsStore settingsStore;
    private String currentSearch = "";
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public ReturnsController(ReturnsService returnsService, SalesService salesService, SalesRepository salesRepository, SettingsStore settingsStore) {
        this.returnsService = returnsService;
        this.salesService = salesService;
        this.salesRepository = salesRepository;
        this.settingsStore = settingsStore;
    }

    @FXML
    public void initialize() {
        if (createReturnButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(createReturnButton, com.possum.application.auth.Permissions.RETURNS_MANAGE);
        }
        
        setupTable();
        setupFilters();
        loadReturns();
    }

    private void setupTable() {
        TableColumn<Return, String> invoiceCol = new TableColumn<>("Invoice");
        invoiceCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().invoiceNumber()));
        
        TableColumn<Return, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().createdAt()));
        
        TableColumn<Return, BigDecimal> refundCol = new TableColumn<>("Refund");
        refundCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().totalRefund()));
        refundCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        TableColumn<Return, String> reasonCol = new TableColumn<>("Reason");
        reasonCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().reason()));
        
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
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/returns/create-return-dialog.fxml"));
            
            CreateReturnDialogController controller = new CreateReturnDialogController(salesService, salesRepository, returnsService);
            loader.setController(controller);
            
            Parent root = loader.load();
            Stage stage = new Stage();
            stage.setTitle("Process Return");
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.initOwner(returnsTable.getScene().getWindow());
            stage.setScene(new Scene(root));
            
            controller.setOnSuccess(this::loadReturns);
            
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            NotificationService.error("Failed to open return dialog");
        }
    }

    private void handleViewDetails(Return returnRecord) {
        SaleResponse saleResponse = salesService.getSaleDetails(returnRecord.saleId());
        String billHtml = BillRenderer.renderBill(saleResponse, settingsStore.loadGeneralSettings(), settingsStore.loadBillSettings());
        
        BillPreviewDialog dialog = new BillPreviewDialog(billHtml, returnsTable.getScene().getWindow());
        dialog.showAndWait();
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
