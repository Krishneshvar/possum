package com.possum.ui.settings.tax;

import com.possum.application.taxes.TaxManagementService;
import com.possum.domain.model.TaxProfile;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.dialogs.DialogStyler;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.time.LocalDateTime;

public class TaxProfilesController {

    @FXML private TableView<TaxProfile> profilesTable;
    @FXML private TableColumn<TaxProfile, String> nameColumn;
    @FXML private TableColumn<TaxProfile, String> regionColumn;
    @FXML private TableColumn<TaxProfile, String> modeColumn;
    @FXML private TableColumn<TaxProfile, String> statusColumn;

    @FXML private TextField nameField;
    @FXML private TextField countryCodeField;
    @FXML private TextField regionCodeField;
    @FXML private ComboBox<String> pricingModeCombo;
    @FXML private CheckBox activeCheckBox;
    @FXML private Label nameErrorLabel;
    @FXML private Label countryCodeErrorLabel;
    @FXML private Label pricingModeErrorLabel;

    private TaxManagementService taxService;
    private TaxProfile selectedProfile;

    public void setTaxService(TaxManagementService taxService) {
        this.taxService = taxService;
        loadProfiles();
    }

    @FXML
    public void initialize() {
        setupTable();
        setupForm();
    }

    private void setupTable() {
        nameColumn.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().name()));
        regionColumn.setCellValueFactory(data ->
            new SimpleStringProperty(data.getValue().regionCode() != null ? data.getValue().regionCode() : "All"));
        modeColumn.setCellValueFactory(data ->
            new SimpleStringProperty(data.getValue().pricingMode().toUpperCase()));
        statusColumn.setCellValueFactory(data ->
            new SimpleStringProperty(Boolean.TRUE.equals(data.getValue().active()) ? "Active" : "Inactive"));

        profilesTable.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            selectedProfile = newVal;
            if (newVal != null) {
                populateForm(newVal);
            }
        });
    }

    private void setupForm() {
        pricingModeCombo.setItems(FXCollections.observableArrayList("INCLUSIVE", "EXCLUSIVE"));
        pricingModeCombo.setValue("EXCLUSIVE");
        countryCodeField.setText("IN");

        nameField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateName();
            }
        });
        countryCodeField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateCountryCode();
            }
        });
        pricingModeCombo.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validatePricingMode();
            }
        });
    }

    private void loadProfiles() {
        if (taxService != null) {
            profilesTable.setItems(FXCollections.observableArrayList(taxService.getAllTaxProfiles()));
        }
    }

    private void populateForm(TaxProfile profile) {
        nameField.setText(profile.name());
        countryCodeField.setText(profile.countryCode());
        regionCodeField.setText(profile.regionCode());
        pricingModeCombo.setValue(profile.pricingMode().toUpperCase());
        activeCheckBox.setSelected(Boolean.TRUE.equals(profile.active()));

        clearFieldError(nameField, nameErrorLabel);
        clearFieldError(countryCodeField, countryCodeErrorLabel);
        clearFieldError(pricingModeCombo, pricingModeErrorLabel);
    }

    private void clearForm() {
        nameField.clear();
        countryCodeField.setText("IN");
        regionCodeField.clear();
        pricingModeCombo.setValue("EXCLUSIVE");
        activeCheckBox.setSelected(false);

        clearFieldError(nameField, nameErrorLabel);
        clearFieldError(countryCodeField, countryCodeErrorLabel);
        clearFieldError(pricingModeCombo, pricingModeErrorLabel);

        selectedProfile = null;
        profilesTable.getSelectionModel().clearSelection();
    }

    @FXML
    private void handleAdd() {
        if (!validateForm()) {
            NotificationService.warning("Please fix the highlighted fields");
            return;
        }

        try {
            TaxProfile profile = new TaxProfile(
                null,
                nameField.getText().trim(),
                countryCodeField.getText().trim().toUpperCase(),
                regionCodeField.getText().trim().isEmpty() ? null : regionCodeField.getText().trim().toUpperCase(),
                pricingModeCombo.getValue().trim(),
                activeCheckBox.isSelected(),
                LocalDateTime.now(),
                LocalDateTime.now()
            );

            taxService.createTaxProfile(profile);
            NotificationService.success("Tax profile created");
            loadProfiles();
            clearForm();
        } catch (Exception e) {
            NotificationService.error("Failed to create profile: " + e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        if (selectedProfile == null) {
            NotificationService.warning("Select a profile to update");
            return;
        }

        if (!validateForm()) {
            NotificationService.warning("Please fix the highlighted fields");
            return;
        }

        try {
            TaxProfile profile = new TaxProfile(
                selectedProfile.id(),
                nameField.getText().trim(),
                countryCodeField.getText().trim().toUpperCase(),
                regionCodeField.getText().trim().isEmpty() ? null : regionCodeField.getText().trim().toUpperCase(),
                pricingModeCombo.getValue().trim(),
                activeCheckBox.isSelected(),
                null,
                null
            );

            taxService.updateTaxProfile(selectedProfile.id(), profile);
            NotificationService.success("Tax profile updated");
            loadProfiles();
            clearForm();
        } catch (Exception e) {
            NotificationService.error("Failed to update profile: " + e.getMessage());
        }
    }

    @FXML
    private void handleDelete() {
        if (selectedProfile == null) {
            NotificationService.warning("Select a profile to delete");
            return;
        }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);

        DialogStyler.apply(confirm);
        confirm.setTitle("Delete Tax Profile");
        confirm.setHeaderText("Delete " + selectedProfile.name() + "?");
        confirm.setContentText("This will also delete all associated tax rules.");

        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    taxService.deleteTaxProfile(selectedProfile.id());
                    NotificationService.success("Tax profile deleted");
                    loadProfiles();
                    clearForm();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete profile: " + e.getMessage());
                }
            }
        });
    }

    @FXML
    private void handleClear() {
        clearForm();
    }

    private boolean validateForm() {
        boolean valid = true;
        valid &= validateName();
        valid &= validateCountryCode();
        valid &= validatePricingMode();
        return valid;
    }

    private boolean validateName() {
        String value = nameField.getText() == null ? "" : nameField.getText().trim();
        if (value.isEmpty()) {
            showFieldError(nameField, nameErrorLabel, "Profile name is required");
            return false;
        }
        clearFieldError(nameField, nameErrorLabel);
        return true;
    }

    private boolean validateCountryCode() {
        String value = countryCodeField.getText() == null ? "" : countryCodeField.getText().trim();
        if (value.isEmpty()) {
            showFieldError(countryCodeField, countryCodeErrorLabel, "Country code is required");
            return false;
        }
        if (!value.matches("[A-Za-z]{2,3}")) {
            showFieldError(countryCodeField, countryCodeErrorLabel, "Use 2-3 letters");
            return false;
        }
        clearFieldError(countryCodeField, countryCodeErrorLabel);
        return true;
    }

    private boolean validatePricingMode() {
        if (pricingModeCombo.getValue() == null || pricingModeCombo.getValue().trim().isEmpty()) {
            showFieldError(pricingModeCombo, pricingModeErrorLabel, "Pricing mode is required");
            return false;
        }
        clearFieldError(pricingModeCombo, pricingModeErrorLabel);
        return true;
    }

    private void showFieldError(Control field, Label errorLabel, String message) {
        if (!field.getStyleClass().contains("input-error")) {
            field.getStyleClass().add("input-error");
        }
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }

    private void clearFieldError(Control field, Label errorLabel) {
        field.getStyleClass().remove("input-error");
        errorLabel.setText("");
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);
    }
}
