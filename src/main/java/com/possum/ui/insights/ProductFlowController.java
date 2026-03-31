package com.possum.ui.insights;

import com.possum.application.inventory.ProductFlowService;
import com.possum.application.products.ProductService;
import com.possum.application.variants.VariantService;
import com.possum.domain.model.Product;
import com.possum.domain.model.ProductFlow;
import com.possum.domain.model.Variant;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.util.StringConverter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.possum.shared.util.TimeUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ProductFlowController {

    @FXML private ComboBox<String> selectionTypeCombo;
    @FXML private ComboBox<Object> itemSelector;
    @FXML private ComboBox<String> dateRangeCombo;
    @FXML private DatePicker startDatePicker;
    @FXML private DatePicker endDatePicker;
    @FXML private HBox customDateRange;

    @FXML private Label totalSoldLabel;
    @FXML private Label totalPurchasedLabel;
    @FXML private Label totalReturnedLabel;
    @FXML private Label netMovementLabel;

    @FXML private TableView<ProductFlow> flowTable;
    @FXML private TableColumn<ProductFlow, LocalDateTime> dateCol;
    @FXML private TableColumn<ProductFlow, String> typeCol;
    @FXML private TableColumn<ProductFlow, Integer> quantityCol;
    @FXML private TableColumn<ProductFlow, Long> refIdCol;
    @FXML private TableColumn<ProductFlow, String> refTypeCol;
    @FXML private TableColumn<ProductFlow, String> variantNameCol;

    private final ProductFlowService productFlowService;
    private final ProductService productService;
    private final VariantService variantService;

    private final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm");

    public ProductFlowController(ProductFlowService productFlowService,
                                 ProductService productService,
                                 VariantService variantService) {
        this.productFlowService = productFlowService;
        this.productService = productService;
        this.variantService = variantService;
    }

    @FXML
    public void initialize() {
        flowTable.setPlaceholder(new javafx.scene.control.Label("No data found for the current selection and date range."));
        setupSelectionType();
        setupItemSelector();
        setupDateFilters();
        setupTable();
        
        selectionTypeCombo.getSelectionModel().select("Variant");
        dateRangeCombo.getSelectionModel().select("This Month");
    }

    private void setupSelectionType() {
        selectionTypeCombo.setItems(FXCollections.observableArrayList("Product", "Variant"));
        selectionTypeCombo.setOnAction(e -> {
            updateItemSelector();
            clearData();
        });
    }

    private void setupItemSelector() {
        itemSelector.setConverter(new StringConverter<Object>() {
            @Override
            public String toString(Object object) {
                if (object == null) return "";
                if (object instanceof Product p) return p.name();
                if (object instanceof Variant v) return v.name();
                return object.toString();
            }

            @Override
            public Object fromString(String string) {
                return null;
            }
        });
        itemSelector.setOnAction(e -> loadData());
    }

    private void updateItemSelector() {
        String type = selectionTypeCombo.getValue();
        if ("Product".equals(type)) {
            List<Product> products = productService.getProducts(new ProductFilter(null, null, null, null, 1, 1000, "name", "asc")).items();
            itemSelector.setItems(FXCollections.observableArrayList(products));
        } else {
            List<Variant> variants = variantService.getVariants(new com.possum.application.variants.VariantService.VariantFilterCriteria(
                "", null, null, null, null, null, null, null, "v.name", "ASC", 1, 1000
            )).items();
            itemSelector.setItems(FXCollections.observableArrayList(variants));
        }
    }

    private void setupDateFilters() {
        dateRangeCombo.setItems(FXCollections.observableArrayList(
                "Today", "Yesterday", "This Week", "This Month", "Last 30 Days", "This Year", "All Time", "Custom"
        ));
        dateRangeCombo.setOnAction(e -> {
            String range = dateRangeCombo.getValue();
            boolean isCustom = "Custom".equals(range);
            customDateRange.setVisible(isCustom);
            customDateRange.setManaged(isCustom);
            if (!isCustom) {
                updateDatesFromRange(range);
                loadData();
            }
        });

        startDatePicker.setOnAction(e -> loadData());
        endDatePicker.setOnAction(e -> loadData());
    }

    private void updateDatesFromRange(String range) {
        LocalDate today = LocalDate.now();
        switch (range) {
            case "Today" -> { startDatePicker.setValue(today); endDatePicker.setValue(today); }
            case "Yesterday" -> { startDatePicker.setValue(today.minusDays(1)); endDatePicker.setValue(today.minusDays(1)); }
            case "This Week" -> { startDatePicker.setValue(today.minusDays(today.getDayOfWeek().getValue() - 1)); endDatePicker.setValue(today); }
            case "This Month" -> { startDatePicker.setValue(today.withDayOfMonth(1)); endDatePicker.setValue(today); }
            case "Last 30 Days" -> { startDatePicker.setValue(today.minusDays(30)); endDatePicker.setValue(today); }
            case "This Year" -> { startDatePicker.setValue(today.withDayOfYear(1)); endDatePicker.setValue(today); }
            case "All Time" -> { startDatePicker.setValue(today.minusYears(10)); endDatePicker.setValue(today); }
        }
    }

    private void setupTable() {
        dateCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().eventDate()));
        dateCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? "" : dateTimeFormatter.format(item));
            }
        });

        typeCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(cellData.getValue().eventType()));
        typeCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText("");
                    setGraphic(null);
                } else {
                    setText(item.toUpperCase());
                    getStyleClass().removeAll("badge-sale", "badge-purchase", "badge-return", "badge-adjustment");
                    switch (item.toLowerCase()) {
                        case "sale" -> getStyleClass().add("badge-sale");
                        case "purchase" -> getStyleClass().add("badge-purchase");
                        case "return" -> getStyleClass().add("badge-return");
                        case "adjustment" -> getStyleClass().add("badge-adjustment");
                    }
                }
            }
        });

        quantityCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().quantity()));
        quantityCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(Integer item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText("");
                    setStyle("");
                } else {
                    setText(item > 0 ? "+" + item : String.valueOf(item));
                    setStyle("-fx-text-fill: " + (item > 0 ? "#10b981" : "#ef4444") + "; -fx-font-weight: bold;");
                }
            }
        });

        variantNameCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(cellData.getValue().variantName()));
        refIdCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().referenceId()));
        refTypeCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(cellData.getValue().referenceType()));
    }

    private void loadData() {
        Object selectedItem = itemSelector.getValue();
        if (selectedItem == null) return;

        String type = selectionTypeCombo.getValue();
        LocalDate start = startDatePicker.getValue();
        LocalDate end = endDatePicker.getValue();
        
        String startStr = start != null ? start.atStartOfDay().toString() : null;
        String endStr = end != null ? end.atTime(23, 59, 59).toString() : null;

        try {
            List<ProductFlow> flow;
            Map<String, Object> summary;

            if ("Product".equals(type)) {
                Product p = (Product) selectedItem;
                flow = productFlowService.getProductTimeline(p.id(), 1000, 0, startStr, endStr, null);
                summary = productFlowService.getProductFlowSummary(p.id());
            } else {
                Variant v = (Variant) selectedItem;
                flow = productFlowService.getVariantTimeline(v.id(), 1000, 0, startStr, endStr, null);
                summary = productFlowService.getVariantFlowSummary(v.id());
            }

            flowTable.setItems(FXCollections.observableArrayList(flow));
            updateSummary(summary);
        } catch (Exception e) {
            e.printStackTrace();
            NotificationService.error("Failed to load flow data: " + e.getMessage());
        }
    }

    private void updateSummary(Map<String, Object> summary) {
        if (summary == null || summary.isEmpty()) {
            clearSummary();
            return;
        }
        totalSoldLabel.setText(String.valueOf(summary.getOrDefault("totalSold", 0)));
        totalPurchasedLabel.setText(String.valueOf(summary.getOrDefault("totalPurchased", 0)));
        totalReturnedLabel.setText(String.valueOf(summary.getOrDefault("totalReturned", 0)));
        netMovementLabel.setText(String.valueOf(summary.getOrDefault("netMovement", 0)));
        
        int net = (int) summary.getOrDefault("netMovement", 0);
        netMovementLabel.setStyle("-fx-text-fill: " + (net >= 0 ? "#2563eb" : "#ef4444") + ";");
    }

    private void clearData() {
        flowTable.setItems(FXCollections.observableArrayList());
        clearSummary();
    }

    private void clearSummary() {
        totalSoldLabel.setText("0");
        totalPurchasedLabel.setText("0");
        totalReturnedLabel.setText("0");
        netMovementLabel.setText("0");
        netMovementLabel.setStyle("");
    }
}
