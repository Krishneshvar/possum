package com.possum.ui.common.controls;

import javafx.geometry.Insets;
import javafx.scene.control.Button;
import javafx.scene.control.DatePicker;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.layout.Priority;
import java.util.function.Function;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

public class FilterBar extends VBox {
    private final TextField searchField;
    private final Map<String, ComboBox<?>> filters = new HashMap<>();
    private final Map<String, MultiSelectFilter<?>> multiSelectFilters = new HashMap<>();
    private final Map<String, DatePicker> dateFilters = new HashMap<>();
    private Consumer<Map<String, Object>> onFilterChange;

    private final HBox topRow;
    private final HBox bottomRow;
    private boolean isResetting = false;

    public FilterBar() {
        setSpacing(10);
        setPadding(new Insets(10));
        setStyle("-fx-background-color: #f5f5f5;");

        topRow = new HBox(10);
        bottomRow = new HBox(10);

        searchField = new TextField();
        searchField.setPromptText("Search...");
        searchField.setPrefWidth(250);
        searchField.textProperty().addListener((obs, old, val) -> notifyFilterChange());

        Button resetButton = new Button("Reset");
        resetButton.setOnAction(e -> reset());

        topRow.getChildren().addAll(searchField, resetButton);
        HBox.setHgrow(searchField, Priority.NEVER);

        getChildren().addAll(topRow, bottomRow);
    }

    public <T> ComboBox<T> addFilter(String key, String prompt) {
        ComboBox<T> combo = new ComboBox<>();
        combo.setPromptText(prompt);
        combo.setPrefWidth(150);
        combo.valueProperty().addListener((obs, old, val) -> notifyFilterChange());
        
        filters.put(key, combo);
        bottomRow.getChildren().add(combo);
        
        return combo;
    }

    public <T> MultiSelectFilter<T> addMultiSelectFilter(String key, String prompt, java.util.List<T> items, Function<T, String> labelExtractor) {
        return addMultiSelectFilter(key, prompt, items, labelExtractor, true);
    }

    public <T> MultiSelectFilter<T> addMultiSelectFilter(String key, String prompt, java.util.List<T> items, Function<T, String> labelExtractor, boolean searchable) {
        MultiSelectFilter<T> multiSelect = new MultiSelectFilter<>(prompt, labelExtractor, searchable);
        multiSelect.setPrefWidth(150);
        multiSelect.setItems(items);
        multiSelect.getSelectedItems().addListener((javafx.collections.ListChangeListener.Change<? extends T> c) -> notifyFilterChange());

        multiSelectFilters.put(key, multiSelect);
        bottomRow.getChildren().add(multiSelect);

        return multiSelect;
    }

    public DatePicker addDateFilter(String key, String prompt) {
        DatePicker picker = new DatePicker();
        picker.setPromptText(prompt);
        picker.setPrefWidth(150);
        picker.valueProperty().addListener((obs, old, val) -> notifyFilterChange());
        
        dateFilters.put(key, picker);
        bottomRow.getChildren().add(picker);
        return picker;
    }

    public void setOnFilterChange(Consumer<Map<String, Object>> handler) {
        this.onFilterChange = handler;
    }

    private void notifyFilterChange() {
        if (onFilterChange != null && !isResetting) {
            Map<String, Object> values = new HashMap<>();
            values.put("search", searchField.getText());
            filters.forEach((key, combo) -> values.put(key, combo.getValue()));
            multiSelectFilters.forEach((key, multiSelect) -> values.put(key, multiSelect.getSelectedItems()));
            dateFilters.forEach((key, picker) -> values.put(key, picker.getValue()));
            onFilterChange.accept(values);
        }
    }

    public void reset() {
        isResetting = true;
        try {
            searchField.clear();
            filters.values().forEach(combo -> combo.setValue(null));
            multiSelectFilters.values().forEach(MultiSelectFilter::clearSelection);
            dateFilters.values().forEach(picker -> picker.setValue(null));
        } finally {
            isResetting = false;
            notifyFilterChange();
        }
    }

    public String getSearchText() {
        return searchField.getText();
    }

    public Object getFilterValue(String key) {
        ComboBox<?> combo = filters.get(key);
        return combo != null ? combo.getValue() : null;
    }
}
