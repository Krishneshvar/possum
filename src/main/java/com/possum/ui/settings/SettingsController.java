package com.possum.ui.settings;

import com.possum.domain.model.TaxProfile;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.shared.dto.BillSettings;
import com.possum.shared.dto.GeneralSettings;
import com.possum.ui.common.controls.FormDialog;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.util.List;

public class SettingsController {
    
    @FXML private TextField storeNameField;
    @FXML private ComboBox<String> currencyCombo;
    @FXML private CheckBox showLogoCheck;
    @FXML private TextField paperWidthField;
    @FXML private TextArea footerNoteArea;
    @FXML private ComboBox<String> printerCombo;
    @FXML private ListView<TaxProfile> taxProfilesList;
    
    private SettingsStore settingsStore;
    private PrinterService printerService;
    private TaxRepository taxRepository;
    private String selectedPrinter;

    public void initialize(SettingsStore settingsStore, PrinterService printerService, TaxRepository taxRepository) {
        this.settingsStore = settingsStore;
        this.printerService = printerService;
        this.taxRepository = taxRepository;
        
        setupCurrencies();
        loadGeneralSettings();
        loadBillSettings();
        loadPrinters();
        loadTaxProfiles();
    }

    private void setupCurrencies() {
        currencyCombo.setItems(FXCollections.observableArrayList(
            "USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD"
        ));
    }

    private void loadGeneralSettings() {
        GeneralSettings settings = settingsStore.loadGeneralSettings();
        storeNameField.setText(settings.getStoreName());
        currencyCombo.setValue(settings.getCurrencyCode());
    }

    private void loadBillSettings() {
        BillSettings settings = settingsStore.loadBillSettings();
        showLogoCheck.setSelected(settings.isShowLogo());
        paperWidthField.setText(String.valueOf(settings.getPaperWidth()));
        footerNoteArea.setText(settings.getFooterNote());
    }

    private void loadPrinters() {
        List<String> printers = printerService.listPrinters();
        printerCombo.setItems(FXCollections.observableArrayList(printers));
        if (!printers.isEmpty()) {
            printerCombo.setValue(printers.get(0));
            selectedPrinter = printers.get(0);
        }
    }

    private void loadTaxProfiles() {
        List<TaxProfile> profiles = taxRepository.getAllTaxProfiles();
        taxProfilesList.setItems(FXCollections.observableArrayList(profiles));
        taxProfilesList.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(TaxProfile item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.name() + (item.active() ? " (Active)" : ""));
            }
        });
    }

    @FXML
    private void handleSaveGeneral() {
        try {
            GeneralSettings settings = new GeneralSettings();
            settings.setStoreName(storeNameField.getText());
            settings.setCurrencyCode(currencyCombo.getValue());
            
            settingsStore.saveGeneralSettings(settings);
            NotificationService.success("General settings saved");
        } catch (Exception e) {
            NotificationService.error("Failed to save settings: " + e.getMessage());
        }
    }

    @FXML
    private void handleSaveBill() {
        try {
            BillSettings settings = new BillSettings();
            settings.setShowLogo(showLogoCheck.isSelected());
            settings.setPaperWidth(Integer.parseInt(paperWidthField.getText()));
            settings.setFooterNote(footerNoteArea.getText());
            
            settingsStore.saveBillSettings(settings);
            NotificationService.success("Bill settings saved");
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid paper width");
        } catch (Exception e) {
            NotificationService.error("Failed to save settings: " + e.getMessage());
        }
    }

    @FXML
    private void handleTestPrint() {
        String printer = printerCombo.getValue();
        if (printer == null) {
            NotificationService.warning("Select a printer");
            return;
        }
        
        String testHtml = "<html><body><h2>Test Print</h2><p>This is a test receipt from POSSUM POS</p></body></html>";
        
        printerService.printInvoice(testHtml, printer)
            .thenAccept(success -> {
                if (success) {
                    NotificationService.success("Test print sent");
                } else {
                    NotificationService.error("Print failed");
                }
            })
            .exceptionally(ex -> {
                NotificationService.error("Print error: " + ex.getMessage());
                return null;
            });
    }

    @FXML
    private void handleRefreshPrinters() {
        loadPrinters();
        NotificationService.success("Printers refreshed");
    }

    @FXML
    private void handleAddTaxProfile() {
        FormDialog.show("Add Tax Profile", dialog -> {
            dialog.addTextField("name", "Profile Name", "");
            dialog.addCheckBox("active", "Set as Active", false);
        }, values -> {
            try {
                TaxProfile profile = new TaxProfile(
                    null,
                    (String) values.get("name"),
                    "US",
                    null,
                    "inclusive",
                    (Boolean) values.get("active"),
                    null, null
                );
                
                taxRepository.createTaxProfile(profile);
                NotificationService.success("Tax profile created");
                loadTaxProfiles();
            } catch (Exception e) {
                NotificationService.error("Failed to create profile: " + e.getMessage());
            }
        });
    }

    @FXML
    private void handleEditTaxProfile() {
        TaxProfile selected = taxProfilesList.getSelectionModel().getSelectedItem();
        if (selected == null) {
            NotificationService.warning("Select a tax profile");
            return;
        }
        
        FormDialog.show("Edit Tax Profile", dialog -> {
            dialog.addTextField("name", "Profile Name", selected.name());
            dialog.addCheckBox("active", "Set as Active", selected.active());
        }, values -> {
            try {
                TaxProfile profile = new TaxProfile(
                    selected.id(),
                    (String) values.get("name"),
                    selected.countryCode(),
                    selected.regionCode(),
                    selected.pricingMode(),
                    (Boolean) values.get("active"),
                    null, null
                );
                
                taxRepository.updateTaxProfile(selected.id(), profile);
                NotificationService.success("Tax profile updated");
                loadTaxProfiles();
            } catch (Exception e) {
                NotificationService.error("Failed to update profile: " + e.getMessage());
            }
        });
    }

    @FXML
    private void handleDeleteTaxProfile() {
        TaxProfile selected = taxProfilesList.getSelectionModel().getSelectedItem();
        if (selected == null) {
            NotificationService.warning("Select a tax profile");
            return;
        }
        
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Delete Tax Profile");
        confirm.setHeaderText("Delete " + selected.name() + "?");
        confirm.setContentText("This action cannot be undone.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    taxRepository.deleteTaxProfile(selected.id());
                    NotificationService.success("Tax profile deleted");
                    loadTaxProfiles();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete profile: " + e.getMessage());
                }
            }
        });
    }
}
