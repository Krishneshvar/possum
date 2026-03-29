package com.possum.ui.common.controls;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.CheckBox;
import javafx.scene.control.CustomMenuItem;
import javafx.scene.control.MenuButton;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import javafx.scene.control.TextField;
import javafx.scene.control.MenuItem;

public class MultiSelectFilter<T> extends MenuButton {

    private final ObservableList<T> selectedItems = FXCollections.observableArrayList();
    private final Function<T, String> labelExtractor;
    private final List<FilterableItem<T>> allItems = new ArrayList<>();
    private final TextField searchField = new TextField();
    private final boolean searchable;

    public MultiSelectFilter(String title, Function<T, String> labelExtractor) {
        this(title, labelExtractor, true);
    }

    public MultiSelectFilter(String title, Function<T, String> labelExtractor, boolean searchable) {
        super(title);
        this.labelExtractor = labelExtractor;
        this.searchable = searchable;

        if (searchable) {
            searchField.setPromptText("Search...");
            searchField.textProperty().addListener((obs, oldVal, newVal) -> filterItems(newVal));

            CustomMenuItem searchItem = new CustomMenuItem(searchField);
            searchItem.setHideOnClick(false);
            getItems().add(searchItem);
            
            // Ensure search field gets focus when menu opens
            showingProperty().addListener((obs, oldVal, newVal) -> {
                if (newVal) {
                    javafx.application.Platform.runLater(searchField::requestFocus);
                }
            });
        }
    }

    public void setItems(List<T> items) {
        if (searchable) {
            MenuItem searchItem = getItems().get(0);
            getItems().setAll(searchItem);
            searchField.clear();
        } else {
            getItems().clear();
        }
        
        selectedItems.clear();
        allItems.clear();

        javafx.scene.layout.VBox vBox = new javafx.scene.layout.VBox(5);
        vBox.setPadding(new javafx.geometry.Insets(5));

        for (T item : items) {
            CheckBox checkBox = new CheckBox(labelExtractor.apply(item));

            checkBox.selectedProperty().addListener((obs, oldVal, newVal) -> {
                if (newVal) {
                    if (!selectedItems.contains(item)) selectedItems.add(item);
                } else {
                    selectedItems.remove(item);
                }
            });
            
            allItems.add(new FilterableItem<>(item, checkBox, labelExtractor.apply(item)));
            vBox.getChildren().add(checkBox);
        }

        javafx.scene.control.ScrollPane scrollPane = new javafx.scene.control.ScrollPane(vBox);
        scrollPane.setFitToWidth(true);
        // Estimate height based on items (approx 24px per checkbox + 5px spacing) + padding
        double estimatedHeight = items.size() * 29.0 + 10.0;
        scrollPane.setPrefViewportHeight(Math.min(estimatedHeight, 300));
        scrollPane.setMaxHeight(300);
        scrollPane.setStyle("-fx-background-color: transparent; -fx-background: white;");

        CustomMenuItem scrollItem = new CustomMenuItem(scrollPane);
        scrollItem.setHideOnClick(false);
        getItems().add(scrollItem);
    }

    private void filterItems(String query) {
        int contentIndex = searchable ? 1 : 0;
        if (getItems().size() > contentIndex) {
            CustomMenuItem scrollItem = (CustomMenuItem) getItems().get(contentIndex);
            javafx.scene.control.ScrollPane scrollPane = (javafx.scene.control.ScrollPane) scrollItem.getContent();
            javafx.scene.layout.VBox vBox = (javafx.scene.layout.VBox) scrollPane.getContent();

            vBox.getChildren().clear();

            if (query == null || query.isEmpty()) {
                for (FilterableItem<T> item : allItems) {
                    vBox.getChildren().add(item.checkBox());
                }
            } else {
                String lowerQuery = query.toLowerCase();
                for (FilterableItem<T> item : allItems) {
                    if (item.label().toLowerCase().contains(lowerQuery)) {
                        vBox.getChildren().add(item.checkBox());
                    }
                }
            }
        }
    }

    public ObservableList<T> getSelectedItems() {
        return selectedItems;
    }

    public void clearSelection() {
        for (FilterableItem<T> item : allItems) {
            item.checkBox().setSelected(false);
        }
        selectedItems.clear();
    }

    private record FilterableItem<T>(T item, CheckBox checkBox, String label) {}
}
