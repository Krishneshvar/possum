package com.possum.ui.settings.tax;

import com.possum.application.taxes.TaxManagementService;
import com.possum.domain.model.TaxCategory;
import com.possum.domain.model.TaxProfile;
import com.possum.domain.model.TaxRule;
import com.possum.ui.common.controls.NotificationService;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.possum.ui.common.dialogs.DialogStyler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class TaxRulesController {

    @FXML private ComboBox<TaxProfile> profileCombo;
    @FXML private TableView<TaxRule> rulesTable;
    @FXML private TableColumn<TaxRule, String> categoryColumn;
    @FXML private TableColumn<TaxRule, BigDecimal> rateColumn;
    @FXML private TableColumn<TaxRule, String> typeColumn;
    @FXML private TableColumn<TaxRule, Integer> priorityColumn;
    
    @FXML private ComboBox<TaxCategory> categoryCombo;
    @FXML private ComboBox<String> scopeCombo;
    @FXML private TextField rateField;
    @FXML private TextField priorityField;
    @FXML private CheckBox compoundCheckBox;
    @FXML private TextField minPriceField;
    @FXML private TextField maxPriceField;
    @FXML private TextField minInvoiceField;
    @FXML private TextField maxInvoiceField;
    @FXML private TextField customerTypeField;
    @FXML private DatePicker validFromPicker;
    @FXML private DatePicker validToPicker;

    private TaxManagementService taxService;
    private TaxRule selectedRule;

    public void setTaxService(TaxManagementService taxService) {
        this.taxService = taxService;
        loadProfiles();
        loadCategories();
    }

    @FXML
    public void initialize() {
        setupTable();
        setupForm();
    }

    private void setupTable() {
        categoryColumn.setCellValueFactory(data -> 
            new SimpleStringProperty(data.getValue().categoryName() != null ? data.getValue().categoryName() : "All Categories"));
        rateColumn.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().ratePercent()));
        typeColumn.setCellValueFactory(data -> 
            new SimpleStringProperty(Boolean.TRUE.equals(data.getValue().compound()) ? "Compound" : "Simple"));
        priorityColumn.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().priority()));

        rulesTable.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            selectedRule = newVal;
            if (newVal != null) {
                populateForm(newVal);
            }
        });
    }

    private void setupForm() {
        scopeCombo.setItems(FXCollections.observableArrayList("ITEM", "INVOICE"));
        scopeCombo.setValue("ITEM");
        priorityField.setText("0");
        
        profileCombo.setOnAction(e -> loadRulesForSelectedProfile());
    }

    private void loadProfiles() {
        if (taxService != null) {
            List<TaxProfile> profiles = taxService.getAllTaxProfiles();
            profileCombo.setItems(FXCollections.observableArrayList(profiles));
            profileCombo.setCellFactory(lv -> new ListCell<>() {
                @Override
                protected void updateItem(TaxProfile item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? null : item.name() + (Boolean.TRUE.equals(item.active()) ? " (Active)" : ""));
                }
            });
            profileCombo.setButtonCell(new ListCell<>() {
                @Override
                protected void updateItem(TaxProfile item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? null : item.name());
                }
            });
            
            if (!profiles.isEmpty()) {
                profileCombo.setValue(profiles.get(0));
                loadRulesForSelectedProfile();
            }
        }
    }

    private void loadCategories() {
        if (taxService != null) {
            List<TaxCategory> categories = taxService.getAllTaxCategories();
            categoryCombo.setItems(FXCollections.observableArrayList(categories));
            categoryCombo.setCellFactory(lv -> new ListCell<>() {
                @Override
                protected void updateItem(TaxCategory item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? "All Categories" : item.name());
                }
            });
            categoryCombo.setButtonCell(new ListCell<>() {
                @Override
                protected void updateItem(TaxCategory item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? "All Categories" : item.name());
                }
            });
        }
    }

    private void loadRulesForSelectedProfile() {
        TaxProfile profile = profileCombo.getValue();
        if (profile != null && taxService != null) {
            rulesTable.setItems(FXCollections.observableArrayList(
                taxService.getTaxRulesByProfileId(profile.id())
            ));
        }
    }

    private void populateForm(TaxRule rule) {
        categoryCombo.setValue(null);
        scopeCombo.setValue(rule.ruleScope());
        rateField.setText(rule.ratePercent().toString());
        priorityField.setText(rule.priority().toString());
        compoundCheckBox.setSelected(Boolean.TRUE.equals(rule.compound()));
        minPriceField.setText(rule.minPrice() != null ? rule.minPrice().toString() : "");
        maxPriceField.setText(rule.maxPrice() != null ? rule.maxPrice().toString() : "");
        minInvoiceField.setText(rule.minInvoiceTotal() != null ? rule.minInvoiceTotal().toString() : "");
        maxInvoiceField.setText(rule.maxInvoiceTotal() != null ? rule.maxInvoiceTotal().toString() : "");
        customerTypeField.setText(rule.customerType() != null ? rule.customerType() : "");
        validFromPicker.setValue(rule.validFrom());
        validToPicker.setValue(rule.validTo());
    }

    private void clearForm() {
        categoryCombo.setValue(null);
        scopeCombo.setValue("ITEM");
        rateField.clear();
        priorityField.setText("0");
        compoundCheckBox.setSelected(false);
        minPriceField.clear();
        maxPriceField.clear();
        minInvoiceField.clear();
        maxInvoiceField.clear();
        customerTypeField.clear();
        validFromPicker.setValue(null);
        validToPicker.setValue(null);
        selectedRule = null;
        rulesTable.getSelectionModel().clearSelection();
    }

    @FXML
    private void handleAdd() {
        TaxProfile profile = profileCombo.getValue();
        if (profile == null) {
            NotificationService.warning("Select a tax profile");
            return;
        }

        if (rateField.getText().trim().isEmpty()) {
            NotificationService.warning("Tax rate is required");
            return;
        }

        try {
            TaxCategory category = categoryCombo.getValue();
            TaxRule rule = new TaxRule(
                null,
                profile.id(),
                category != null ? category.id() : null,
                scopeCombo.getValue(),
                parseDecimal(minPriceField.getText()),
                parseDecimal(maxPriceField.getText()),
                parseDecimal(minInvoiceField.getText()),
                parseDecimal(maxInvoiceField.getText()),
                customerTypeField.getText().trim().isEmpty() ? null : customerTypeField.getText().trim(),
                new BigDecimal(rateField.getText().trim()),
                compoundCheckBox.isSelected(),
                Integer.parseInt(priorityField.getText().trim()),
                validFromPicker.getValue(),
                validToPicker.getValue(),
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
            );

            taxService.createTaxRule(rule);
            NotificationService.success("Tax rule created");
            loadRulesForSelectedProfile();
            clearForm();
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid number format");
        } catch (Exception e) {
            NotificationService.error("Failed to create rule: " + e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        if (selectedRule == null) {
            NotificationService.warning("Select a rule to update");
            return;
        }

        if (rateField.getText().trim().isEmpty()) {
            NotificationService.warning("Tax rate is required");
            return;
        }

        try {
            TaxCategory category = categoryCombo.getValue();
            TaxRule rule = new TaxRule(
                selectedRule.id(),
                selectedRule.taxProfileId(),
                category != null ? category.id() : null,
                scopeCombo.getValue(),
                parseDecimal(minPriceField.getText()),
                parseDecimal(maxPriceField.getText()),
                parseDecimal(minInvoiceField.getText()),
                parseDecimal(maxInvoiceField.getText()),
                customerTypeField.getText().trim().isEmpty() ? null : customerTypeField.getText().trim(),
                new BigDecimal(rateField.getText().trim()),
                compoundCheckBox.isSelected(),
                Integer.parseInt(priorityField.getText().trim()),
                validFromPicker.getValue(),
                validToPicker.getValue(),
                null,
                null,
                null
            );

            taxService.updateTaxRule(selectedRule.id(), rule);
            NotificationService.success("Tax rule updated");
            loadRulesForSelectedProfile();
            clearForm();
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid number format");
        } catch (Exception e) {
            NotificationService.error("Failed to update rule: " + e.getMessage());
        }
    }

    @FXML
    private void handleDelete() {
        if (selectedRule == null) {
            NotificationService.warning("Select a rule to delete");
            return;
        }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);

        DialogStyler.apply(confirm);
        confirm.setTitle("Delete Tax Rule");
        confirm.setHeaderText("Delete this tax rule?");
        confirm.setContentText("This action cannot be undone.");

        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    taxService.deleteTaxRule(selectedRule.id());
                    NotificationService.success("Tax rule deleted");
                    loadRulesForSelectedProfile();
                    clearForm();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete rule: " + e.getMessage());
                }
            }
        });
    }

    @FXML
    private void handleClear() {
        clearForm();
    }

    private BigDecimal parseDecimal(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        return new BigDecimal(text.trim());
    }
}
