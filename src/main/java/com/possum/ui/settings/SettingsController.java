package com.possum.ui.settings;

import com.possum.ui.settings.tax.TaxManagementController;
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
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.List;

public class SettingsController {
    
    @FXML private TextField storeNameField;
    @FXML private ComboBox<String> currencyCombo;
    @FXML private ComboBox<String> dateFormatCombo;
    @FXML private ComboBox<String> timeFormatCombo;
    @FXML private ComboBox<String> printerCombo;
    @FXML private AnchorPane taxSettingsTabContent;
    @FXML private AnchorPane billSettingsTabContent;
    @FXML private Button testPrintBtn;
    
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
        setupDateAndTimeFormats();
        loadGeneralSettings();
        loadPrinters();
        setupBillSettings();
        setupTaxSettings();
    }

    private void setupCurrencies() {
        currencyCombo.setItems(FXCollections.observableArrayList(
            "USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD"
        ));
    }

    private void setupDateAndTimeFormats() {
        dateFormatCombo.setItems(FXCollections.observableArrayList(
            "DD/MM/YYYY",
            "MM/DD/YYYY",
            "YYYY/MM/DD",
            "Month Date, Year",
            "Date Month, Year"
        ));

        timeFormatCombo.setItems(FXCollections.observableArrayList(
            "12 hour format",
            "24 hour format"
        ));
    }

    private void loadGeneralSettings() {
        GeneralSettings settings = settingsStore.loadGeneralSettings();
        storeNameField.setText(settings.getStoreName());
        currencyCombo.setValue(settings.getCurrencyCode());

        String dateFormat = settings.getDateFormat();
        if (dateFormatCombo.getItems().contains(dateFormat)) {
            dateFormatCombo.setValue(dateFormat);
        } else {
            dateFormatCombo.setValue("DD/MM/YYYY");
        }

        String timeFormat = settings.getTimeFormat();
        if (timeFormatCombo.getItems().contains(timeFormat)) {
            timeFormatCombo.setValue(timeFormat);
        } else {
            timeFormatCombo.setValue("12 hour format");
        }
    }

    private void loadPrinters() {
        List<String> printers = printerService.listPrinters();
        printerCombo.setItems(FXCollections.observableArrayList(printers));
        if (!printers.isEmpty()) {
            printerCombo.setValue(printers.get(0));
            selectedPrinter = printers.get(0);
            testPrintBtn.setDisable(false);
        } else {
            testPrintBtn.setDisable(true);
            printerCombo.setPromptText("No printers found");
        }
    }

    @FXML
    private void handleSaveGeneral() {
        try {
            GeneralSettings settings = new GeneralSettings();
            settings.setStoreName(storeNameField.getText());
            settings.setCurrencyCode(currencyCombo.getValue());
            settings.setDateFormat(dateFormatCombo.getValue());
            settings.setTimeFormat(timeFormatCombo.getValue());
            
            settingsStore.saveGeneralSettings(settings);
            NotificationService.success("General settings saved");
        } catch (Exception e) {
            NotificationService.error("Failed to save settings: " + e.getMessage());
        }
    }

    @FXML
    private void handleTestPrint() {
        String printer = printerCombo.getValue();
        if (printer == null) {
            NotificationService.warning("Select a printer before testing.");
            return;
        }
        
        String testHtml = "<html><body><h2>Test Print</h2><p>This is a test receipt from POSSUM POS</p></body></html>";
        testPrintBtn.setDisable(true);
        testPrintBtn.setText("Printing...");

        printerService.printInvoice(testHtml, printer)
            .thenAccept(success -> {
                javafx.application.Platform.runLater(() -> {
                    testPrintBtn.setDisable(false);
                    testPrintBtn.setText("Test Print");
                    if (success) {
                        NotificationService.success("Test print sent successfully to " + printer);
                    } else {
                        NotificationService.error("Print failed to reach the printer.");
                    }
                });
            })
            .exceptionally(ex -> {
                javafx.application.Platform.runLater(() -> {
                    testPrintBtn.setDisable(false);
                    testPrintBtn.setText("Test Print");
                    NotificationService.error("Print error: " + ex.getMessage());
                });
                return null;
            });
    }

    @FXML
    private void handleRefreshPrinters() {
        loadPrinters();
        NotificationService.success("Printers refreshed");
    }

    private void setupTaxSettings() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/settings/tax/tax-management.fxml"));
            Parent taxSettingsView = loader.load();
            
            TaxManagementController controller = loader.getController();
            controller.setServices(taxService, taxRepository, jsonService);
            
            taxSettingsTabContent.getChildren().setAll(taxSettingsView);
            AnchorPane.setTopAnchor(taxSettingsView, 0.0);
            AnchorPane.setBottomAnchor(taxSettingsView, 0.0);
            AnchorPane.setLeftAnchor(taxSettingsView, 0.0);
            AnchorPane.setRightAnchor(taxSettingsView, 0.0);
        } catch (Exception e) {
            NotificationService.error("Failed to load embedded tax settings: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void setupBillSettings() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/settings/bill-settings-view.fxml"));
            BillSettingsController controller = new BillSettingsController(settingsStore);
            loader.setController(controller);
            Parent billSettingsView = loader.load();
            
            billSettingsTabContent.getChildren().setAll(billSettingsView);
            AnchorPane.setTopAnchor(billSettingsView, 0.0);
            AnchorPane.setBottomAnchor(billSettingsView, 0.0);
            AnchorPane.setLeftAnchor(billSettingsView, 0.0);
            AnchorPane.setRightAnchor(billSettingsView, 0.0);
        } catch (Exception e) {
            NotificationService.error("Failed to load embedded bill settings: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
