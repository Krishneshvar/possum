package com.possum.ui.inventory;

import com.possum.application.auth.AuthContext;
import com.possum.application.inventory.InventoryService;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.model.Variant;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.FormDialog;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableColumn;
import javafx.scene.control.cell.PropertyValueFactory;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public class InventoryController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Variant> inventoryTable;
    @FXML private PaginationBar paginationBar;
    
    private InventoryService inventoryService;
    private VariantRepository variantRepository;
    private String currentSearch = "";
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public void initialize(InventoryService inventoryService, VariantRepository variantRepository) {
        this.inventoryService = inventoryService;
        this.variantRepository = variantRepository;
        
        setupTable();
        setupFilters();
        loadInventory();
    }

    private void setupTable() {
        TableColumn<Variant, String> productCol = new TableColumn<>("Product");
        productCol.setCellValueFactory(new PropertyValueFactory<>("productName"));
        
        TableColumn<Variant, String> variantCol = new TableColumn<>("Variant");
        variantCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        
        TableColumn<Variant, String> skuCol = new TableColumn<>("SKU");
        skuCol.setCellValueFactory(new PropertyValueFactory<>("sku"));
        
        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(new PropertyValueFactory<>("stock"));
        
        TableColumn<Variant, Integer> alertCol = new TableColumn<>("Alert Level");
        alertCol.setCellValueFactory(new PropertyValueFactory<>("stockAlertCap"));
        
        TableColumn<Variant, BigDecimal> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(new PropertyValueFactory<>("price"));
        priceCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        inventoryTable.getTableView().getColumns().addAll(productCol, variantCol, skuCol, stockCol, alertCol, priceCol);
        
        inventoryTable.addActionColumn("Adjust", this::handleAdjust);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadInventory();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadInventory());
    }

    private void loadInventory() {
        inventoryTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                PagedResult<Variant> result = variantRepository.findVariants(
                    currentSearch.isEmpty() ? null : currentSearch,
                    null,
                    null,
                    null,
                    null,
                    "stock",
                    "ASC",
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize()
                );
                
                inventoryTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                inventoryTable.setLoading(false);
            } catch (Exception e) {
                inventoryTable.setLoading(false);
                NotificationService.error("Failed to load inventory");
            }
        });
    }

    private void handleAdjust(Variant variant) {
        FormDialog.show("Adjust Stock - " + variant.productName() + " (" + variant.name() + ")", dialog -> {
            dialog.addTextField("quantity", "Quantity Change", "0");
            var reasonCombo = dialog.addComboBox("reason", "Reason", InventoryReason.CORRECTION);
            reasonCombo.getItems().addAll(
                InventoryReason.CORRECTION,
                InventoryReason.DAMAGE,
                InventoryReason.SPOILAGE,
                InventoryReason.THEFT
            );
        }, values -> {
            try {
                int quantity = Integer.parseInt((String) values.get("quantity"));
                InventoryReason reason = (InventoryReason) values.get("reason");
                long userId = AuthContext.getCurrentUser().id();
                
                inventoryService.adjustInventory(
                    variant.id(),
                    null,
                    quantity,
                    reason,
                    "manual_adjustment",
                    null,
                    userId
                );
                
                NotificationService.success("Stock adjusted successfully");
                loadInventory();
            } catch (NumberFormatException e) {
                NotificationService.error("Invalid quantity");
            } catch (Exception e) {
                NotificationService.error("Failed to adjust stock: " + e.getMessage());
            }
        });
    }
}
