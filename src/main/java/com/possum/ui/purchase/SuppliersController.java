package com.possum.ui.purchase;

import com.possum.domain.model.Supplier;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SupplierFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.common.controls.NotificationService;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableColumn;

public class SuppliersController {
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Supplier> suppliersTable;
    @FXML private PaginationBar paginationBar;
    
    private SupplierRepository supplierRepository;
    private String currentSearch = "";

    public SuppliersController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        loadSuppliers();
    }

    private void setupTable() {
        TableColumn<Supplier, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Supplier, String> contactCol = new TableColumn<>("Contact Person");
        contactCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().contactPerson()));
        
        TableColumn<Supplier, String> phoneCol = new TableColumn<>("Phone");
        phoneCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().phone()));
        
        TableColumn<Supplier, String> emailCol = new TableColumn<>("Email");
        emailCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().email()));
        
        suppliersTable.getTableView().getColumns().addAll(nameCol, contactCol, phoneCol, emailCol);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadSuppliers();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadSuppliers());
    }

    private void loadSuppliers() {
        suppliersTable.setLoading(true);
        Platform.runLater(() -> {
            try {
                SupplierFilter filter = new SupplierFilter(
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    currentSearch.isEmpty() ? null : currentSearch,
                    null,
                    "name",
                    "ASC"
                );
                
                PagedResult<Supplier> result = supplierRepository.getAllSuppliers(filter);
                
                suppliersTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                suppliersTable.setLoading(false);
            } catch (Exception e) {
                suppliersTable.setLoading(false);
                NotificationService.error("Failed to load suppliers");
            }
        });
    }
}
