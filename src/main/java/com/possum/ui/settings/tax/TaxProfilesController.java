package com.possum.ui.settings.tax;

import com.possum.application.taxes.TaxManagementService;
import com.possum.domain.model.TaxProfile;
import com.possum.ui.common.controls.NotificationService;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.possum.ui.common.dialogs.DialogStyler;

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
    }

    private void clearForm() {
        nameField.clear();
        countryCodeField.setText("IN");
        regionCodeField.clear();
        pricingModeCombo.setValue("EXCLUSIVE");
        activeCheckBox.setSelected(false);
        selectedProfile = null;
        profilesTable.getSelectionModel().clearSelection();
    }

    @FXML
    private void handleAdd() {
        if (nameField.getText().trim().isEmpty()) {
            NotificationService.warning("Profile name is required");
            return;
        }

        try {
            TaxProfile profile = new TaxProfile(
                null,
                nameField.getText().trim(),
                countryCodeField.getText().trim(),
                regionCodeField.getText().trim().isEmpty() ? null : regionCodeField.getText().trim(),
                pricingModeCombo.getValue(),
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

        if (nameField.getText().trim().isEmpty()) {
            NotificationService.warning("Profile name is required");
            return;
        }

        try {
            TaxProfile profile = new TaxProfile(
                selectedProfile.id(),
                nameField.getText().trim(),
                countryCodeField.getText().trim(),
                regionCodeField.getText().trim().isEmpty() ? null : regionCodeField.getText().trim(),
                pricingModeCombo.getValue(),
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
}
