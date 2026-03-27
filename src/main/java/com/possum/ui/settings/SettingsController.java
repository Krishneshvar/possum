package com.possum.ui.settings;

import com.possum.application.taxes.TaxManagementService;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.shared.dto.BillSettings;
import com.possum.shared.dto.GeneralSettings;
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
    @FXML private Button manageTaxButton;
    
    private SettingsStore settingsStore;
    private PrinterService printerService;
    private TaxRepository taxRepository;
    private TaxManagementService taxService;
    private JsonService jsonService;
    private String selectedPrinter;

    public SettingsController(SettingsStore settingsStore, PrinterService printerService, 
                            TaxRepository taxRepository, JsonService jsonService) {
        this.settingsStore = settingsStore;
        this.printerService = printerService;
        this.taxRepository = taxRepository;
        this.jsonService = jsonService;
        this.taxService = new TaxManagementService(taxRepository);
    }

    @FXML
    public void initialize() {
        setupCurrencies();
        loadGeneralSettings();
        loadBillSettings();
        loadPrinters();
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
    private void handleManageTax() {
        try {
            com.possum.ui.settings.tax.TaxManagementWindow.show(taxRepository, jsonService);
        } catch (Exception e) {
            NotificationService.error("Failed to open tax management: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
