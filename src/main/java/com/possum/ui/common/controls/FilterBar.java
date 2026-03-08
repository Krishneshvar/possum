package com.possum.ui.common.controls;

import javafx.geometry.Insets;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

public class FilterBar extends HBox {
    private final TextField searchField;
    private final Map<String, ComboBox<?>> filters = new HashMap<>();
    private Consumer<Map<String, Object>> onFilterChange;

    public FilterBar() {
        setSpacing(10);
        setPadding(new Insets(10));
        setStyle("-fx-background-color: #f5f5f5;");

        searchField = new TextField();
        searchField.setPromptText("Search...");
        searchField.setPrefWidth(250);
        searchField.textProperty().addListener((obs, old, val) -> notifyFilterChange());

        Button resetButton = new Button("Reset");
        resetButton.setOnAction(e -> reset());

        getChildren().addAll(searchField, resetButton);
        HBox.setHgrow(searchField, Priority.NEVER);
    }

    public <T> ComboBox<T> addFilter(String key, String prompt) {
        ComboBox<T> combo = new ComboBox<>();
        combo.setPromptText(prompt);
        combo.setPrefWidth(150);
        combo.valueProperty().addListener((obs, old, val) -> notifyFilterChange());
        
        filters.put(key, combo);
        getChildren().add(getChildren().size() - 1, combo);
        
        return combo;
    }

    public void setOnFilterChange(Consumer<Map<String, Object>> handler) {
        this.onFilterChange = handler;
    }

    private void notifyFilterChange() {
        if (onFilterChange != null) {
            Map<String, Object> values = new HashMap<>();
            values.put("search", searchField.getText());
            filters.forEach((key, combo) -> values.put(key, combo.getValue()));
            onFilterChange.accept(values);
        }
    }

    public void reset() {
        searchField.clear();
        filters.values().forEach(combo -> combo.setValue(null));
    }

    public String getSearchText() {
        return searchField.getText();
    }

    public Object getFilterValue(String key) {
        ComboBox<?> combo = filters.get(key);
        return combo != null ? combo.getValue() : null;
    }
}
