package com.possum.ui.common.controls;

import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
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

    public MultiSelectFilter(String title, Function<T, String> labelExtractor) {
        super(title);
        this.labelExtractor = labelExtractor;

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

    public void setItems(List<T> items) {
        // Keep only the search item
        MenuItem searchItem = getItems().get(0);
        getItems().setAll(searchItem);
        
        selectedItems.clear();
        allItems.clear();
        searchField.clear();

        for (T item : items) {
            CheckBox checkBox = new CheckBox(labelExtractor.apply(item));

            checkBox.selectedProperty().addListener((obs, oldVal, newVal) -> {
                if (newVal) {
                    if (!selectedItems.contains(item)) selectedItems.add(item);
                } else {
                    selectedItems.remove(item);
                }
            });

            CustomMenuItem customMenuItem = new CustomMenuItem(checkBox);
            customMenuItem.setHideOnClick(false);
            
            allItems.add(new FilterableItem<>(item, customMenuItem, labelExtractor.apply(item)));
            getItems().add(customMenuItem);
        }
    }

    private void filterItems(String query) {
        MenuItem searchItem = getItems().get(0);
        List<MenuItem> filteredItems = new ArrayList<>();
        filteredItems.add(searchItem);

        if (query == null || query.isEmpty()) {
            for (FilterableItem<T> item : allItems) {
                filteredItems.add(item.menuItem());
            }
        } else {
            String lowerQuery = query.toLowerCase();
            for (FilterableItem<T> item : allItems) {
                if (item.label().toLowerCase().contains(lowerQuery)) {
                    filteredItems.add(item.menuItem());
                }
            }
        }
        getItems().setAll(filteredItems);
    }

    public ObservableList<T> getSelectedItems() {
        return selectedItems;
    }

    public void clearSelection() {
        for (FilterableItem<T> item : allItems) {
            if (item.menuItem().getContent() instanceof CheckBox cb) {
                cb.setSelected(false);
            }
        }
        selectedItems.clear();
    }

    private record FilterableItem<T>(T item, CustomMenuItem menuItem, String label) {}
}
