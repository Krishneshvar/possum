package com.possum.ui.settings;

import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.shared.dto.BillSection;
import com.possum.shared.dto.BillSettings;
import com.possum.shared.dto.GeneralSettings;
import com.possum.ui.common.controls.NotificationService;
import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BillSettingsController {

    @FXML private TabPane tabPane;
    @FXML private VBox sectionsContainer;
    @FXML private ComboBox<String> paperWidthCombo;
    @FXML private ComboBox<String> dateFormatCombo;
    @FXML private ComboBox<String> timeFormatCombo;
    @FXML private TextField currencyField;
    @FXML private WebView previewWebView;
    @FXML private Button saveButton;

    private SettingsStore settingsStore;
    private BillSettings billSettings;
    private GeneralSettings generalSettings;

    public BillSettingsController(SettingsStore settingsStore) {
        this.settingsStore = settingsStore;
    }

    @FXML
    public void initialize() {
        setupFormatOptions();
        loadSettings();
        buildSectionsUI();
        updatePreview();
    }

    private void setupFormatOptions() {
        paperWidthCombo.getItems().addAll("58mm", "80mm");
        dateFormatCombo.getItems().addAll("standard", "ISO", "short", "long");
        timeFormatCombo.getItems().addAll("12h", "24h");
    }

    private void loadSettings() {
        billSettings = settingsStore.loadBillSettings();
        generalSettings = settingsStore.loadGeneralSettings();

        paperWidthCombo.setValue(billSettings.getPaperWidth());
        dateFormatCombo.setValue(billSettings.getDateFormat());
        timeFormatCombo.setValue(billSettings.getTimeFormat());
        currencyField.setText(billSettings.getCurrency());

        paperWidthCombo.setOnAction(e -> {
            billSettings.setPaperWidth(paperWidthCombo.getValue());
            updatePreview();
        });
        dateFormatCombo.setOnAction(e -> {
            billSettings.setDateFormat(dateFormatCombo.getValue());
            updatePreview();
        });
        timeFormatCombo.setOnAction(e -> {
            billSettings.setTimeFormat(timeFormatCombo.getValue());
            updatePreview();
        });
        currencyField.textProperty().addListener((obs, old, val) -> {
            billSettings.setCurrency(val);
            updatePreview();
        });
    }

    private void buildSectionsUI() {
        sectionsContainer.getChildren().clear();
        List<BillSection> sections = billSettings.getSections();

        for (int i = 0; i < sections.size(); i++) {
            BillSection section = sections.get(i);
            int index = i;
            VBox sectionBox = createSectionEditor(section, index, i == 0, i == sections.size() - 1);
            sectionsContainer.getChildren().add(sectionBox);
        }
    }

    private VBox createSectionEditor(BillSection section, int index, boolean isFirst, boolean isLast) {
        VBox container = new VBox(10);
        container.setStyle("-fx-border-color: #ccc; -fx-border-radius: 5; -fx-background-color: white; -fx-padding: 15;");

        HBox header = new HBox(10);
        header.setStyle("-fx-alignment: center-left;");

        CheckBox visibleCheck = new CheckBox(formatSectionName(section.getId()));
        visibleCheck.setSelected(section.isVisible());
        visibleCheck.setOnAction(e -> {
            section.setVisible(visibleCheck.isSelected());
            updatePreview();
        });

        HBox.setHgrow(visibleCheck, Priority.ALWAYS);

        Button upButton = new Button("↑");
        upButton.setDisable(isFirst);
        upButton.setOnAction(e -> moveSection(index, -1));

        Button downButton = new Button("↓");
        downButton.setDisable(isLast);
        downButton.setOnAction(e -> moveSection(index, 1));

        header.getChildren().addAll(visibleCheck, upButton, downButton);
        container.getChildren().add(header);

        if (section.isVisible()) {
            VBox options = createSectionOptions(section);
            container.getChildren().add(options);
        }

        return container;
    }

    private VBox createSectionOptions(BillSection section) {
        VBox options = new VBox(10);
        options.setPadding(new Insets(10, 0, 0, 20));

        if (section.getOptions().containsKey("alignment")) {
            HBox alignBox = new HBox(10);
            alignBox.setStyle("-fx-alignment: center-left;");
            Label alignLabel = new Label("Alignment:");
            alignLabel.setPrefWidth(100);
            ComboBox<String> alignCombo = new ComboBox<>();
            alignCombo.getItems().addAll("left", "center", "right");
            alignCombo.setValue(section.getOptionAsString("alignment", "left"));
            alignCombo.setOnAction(e -> {
                section.setOption("alignment", alignCombo.getValue());
                updatePreview();
            });
            alignBox.getChildren().addAll(alignLabel, alignCombo);
            options.getChildren().add(alignBox);
        }

        if (section.getOptions().containsKey("fontSize")) {
            HBox sizeBox = new HBox(10);
            sizeBox.setStyle("-fx-alignment: center-left;");
            Label sizeLabel = new Label("Font Size:");
            sizeLabel.setPrefWidth(100);
            ComboBox<String> sizeCombo = new ComboBox<>();
            sizeCombo.getItems().addAll("small", "medium", "large");
            sizeCombo.setValue(section.getOptionAsString("fontSize", "medium"));
            sizeCombo.setOnAction(e -> {
                section.setOption("fontSize", sizeCombo.getValue());
                updatePreview();
            });
            sizeBox.getChildren().addAll(sizeLabel, sizeCombo);
            options.getChildren().add(sizeBox);
        }

        if (section.getId().equals("storeHeader")) {
            options.getChildren().addAll(
                createTextField("Store Name:", "storeName", section),
                createTextArea("Store Details:", "storeDetails", section),
                createTextField("Phone:", "phone", section),
                createTextField("GSTIN:", "gst", section)
            );

            CheckBox logoCheck = new CheckBox("Show Logo");
            logoCheck.setSelected(section.getOptionAsBoolean("showLogo", false));
            logoCheck.setOnAction(e -> {
                section.setOption("showLogo", logoCheck.isSelected());
                updatePreview();
            });
            options.getChildren().add(logoCheck);

            if (section.getOptionAsBoolean("showLogo", false)) {
                options.getChildren().add(createTextField("Logo URL:", "logoUrl", section));
            }
        }

        if (section.getId().equals("footer")) {
            options.getChildren().add(createTextArea("Footer Text:", "text", section));
        }

        return options;
    }

    private HBox createTextField(String label, String key, BillSection section) {
        HBox box = new HBox(10);
        box.setStyle("-fx-alignment: center-left;");
        Label lbl = new Label(label);
        lbl.setPrefWidth(100);
        TextField field = new TextField(section.getOptionAsString(key, ""));
        field.setPrefWidth(300);
        field.textProperty().addListener((obs, old, val) -> {
            section.setOption(key, val);
            updatePreview();
        });
        box.getChildren().addAll(lbl, field);
        return box;
    }

    private VBox createTextArea(String label, String key, BillSection section) {
        VBox box = new VBox(5);
        Label lbl = new Label(label);
        TextArea area = new TextArea(section.getOptionAsString(key, ""));
        area.setPrefRowCount(3);
        area.setPrefWidth(300);
        area.textProperty().addListener((obs, old, val) -> {
            section.setOption(key, val);
            updatePreview();
        });
        box.getChildren().addAll(lbl, area);
        return box;
    }

    private void moveSection(int index, int direction) {
        List<BillSection> sections = billSettings.getSections();
        BillSection temp = sections.get(index);
        sections.set(index, sections.get(index + direction));
        sections.set(index + direction, temp);
        buildSectionsUI();
        updatePreview();
    }

    private String formatSectionName(String id) {
        return id.replaceAll("([A-Z])", " $1").trim();
    }

    private void updatePreview() {
        Platform.runLater(() -> {
            SaleResponse mockSale = createMockSale();
            String html = BillRenderer.renderBill(mockSale, generalSettings, billSettings);
            WebEngine engine = previewWebView.getEngine();
            engine.loadContent(html);
        });
    }

    private SaleResponse createMockSale() {
        Sale sale = new Sale(
            1L,
            "CH2603260001",
            LocalDateTime.now(),
            BigDecimal.valueOf(315.50),
            BigDecimal.valueOf(315.50),
            BigDecimal.valueOf(10.0),
            BigDecimal.valueOf(15.50),
            "COMPLETED",
            "DELIVERED",
            1L,
            1L,
            "John Doe",
            "555-0199",
            "john@example.com",
            "Jane Smith",
            1L,
            "Cash"
        );

        List<SaleItem> items = new ArrayList<>();
        items.add(new SaleItem(1L, 1L, 1L, "Default", "SKU001", "Product A", 2, BigDecimal.valueOf(50), BigDecimal.valueOf(30), BigDecimal.valueOf(5), BigDecimal.valueOf(5), BigDecimal.valueOf(5), BigDecimal.valueOf(5), "[]", BigDecimal.ZERO, 0));
        items.add(new SaleItem(2L, 1L, 2L, "Default", "SKU002", "Product B", 1, BigDecimal.valueOf(150), BigDecimal.valueOf(100), BigDecimal.valueOf(10), BigDecimal.valueOf(15), BigDecimal.valueOf(10), BigDecimal.valueOf(15), "[]", BigDecimal.ZERO, 0));
        items.add(new SaleItem(3L, 1L, 3L, "Default", "SKU003", "Product C - Large", 3, BigDecimal.valueOf(20), BigDecimal.valueOf(10), BigDecimal.valueOf(0), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "[]", BigDecimal.ZERO, 0));

        return new SaleResponse(sale, items, new ArrayList<>());
    }

    @FXML
    private void handleSave() {
        try {
            settingsStore.saveBillSettings(billSettings);
            NotificationService.success("Bill settings saved successfully");
        } catch (Exception e) {
            NotificationService.error("Failed to save settings: " + e.getMessage());
        }
    }
}
