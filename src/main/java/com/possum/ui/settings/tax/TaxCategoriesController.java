package com.possum.ui.settings.tax;

import com.possum.application.taxes.TaxManagementService;
import com.possum.domain.model.TaxCategory;
import com.possum.ui.common.controls.NotificationService;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.possum.ui.common.dialogs.DialogStyler;

public class TaxCategoriesController {

    @FXML private TableView<TaxCategory> categoriesTable;
    @FXML private TableColumn<TaxCategory, String> nameColumn;
    @FXML private TableColumn<TaxCategory, String> descriptionColumn;
    @FXML private TableColumn<TaxCategory, Integer> productCountColumn;
    
    @FXML private TextField nameField;
    @FXML private TextArea descriptionArea;

    private TaxManagementService taxService;
    private TaxCategory selectedCategory;

    public void setTaxService(TaxManagementService taxService) {
        this.taxService = taxService;
        loadCategories();
    }

    @FXML
    public void initialize() {
        setupTable();
    }

    private void setupTable() {
        nameColumn.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().name()));
        descriptionColumn.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().description()));
        productCountColumn.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().productCount()));

        categoriesTable.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            selectedCategory = newVal;
            if (newVal != null) {
                populateForm(newVal);
            }
        });
    }

    private void loadCategories() {
        if (taxService != null) {
            categoriesTable.setItems(FXCollections.observableArrayList(taxService.getAllTaxCategories()));
        }
    }

    private void populateForm(TaxCategory category) {
        nameField.setText(category.name());
        descriptionArea.setText(category.description());
    }

    private void clearForm() {
        nameField.clear();
        descriptionArea.clear();
        selectedCategory = null;
        categoriesTable.getSelectionModel().clearSelection();
    }

    @FXML
    private void handleAdd() {
        if (nameField.getText().trim().isEmpty()) {
            NotificationService.warning("Category name is required");
            return;
        }

        try {
            taxService.createTaxCategory(
                nameField.getText().trim(),
                descriptionArea.getText().trim()
            );
            NotificationService.success("Tax category created");
            loadCategories();
            clearForm();
        } catch (Exception e) {
            NotificationService.error("Failed to create category: " + e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        if (selectedCategory == null) {
            NotificationService.warning("Select a category to update");
            return;
        }

        if (nameField.getText().trim().isEmpty()) {
            NotificationService.warning("Category name is required");
            return;
        }

        try {
            taxService.updateTaxCategory(
                selectedCategory.id(),
                nameField.getText().trim(),
                descriptionArea.getText().trim()
            );
            NotificationService.success("Tax category updated");
            loadCategories();
            clearForm();
        } catch (Exception e) {
            NotificationService.error("Failed to update category: " + e.getMessage());
        }
    }

    @FXML
    private void handleDelete() {
        if (selectedCategory == null) {
            NotificationService.warning("Select a category to delete");
            return;
        }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);

        DialogStyler.apply(confirm);
        confirm.setTitle("Delete Tax Category");
        confirm.setHeaderText("Delete " + selectedCategory.name() + "?");
        confirm.setContentText("This category cannot be deleted if it's used by products.");

        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    taxService.deleteTaxCategory(selectedCategory.id());
                    NotificationService.success("Tax category deleted");
                    loadCategories();
                    clearForm();
                } catch (IllegalStateException e) {
                    NotificationService.error("Cannot delete: " + e.getMessage());
                } catch (Exception e) {
                    NotificationService.error("Failed to delete category: " + e.getMessage());
                }
            }
        });
    }

    @FXML
    private void handleClear() {
        clearForm();
    }
}
