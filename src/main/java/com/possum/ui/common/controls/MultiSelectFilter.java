package com.possum.ui.common.controls;

import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.scene.control.CheckBox;
import javafx.scene.control.CustomMenuItem;
import javafx.scene.control.MenuButton;

import java.util.List;
import java.util.function.Function;

public class MultiSelectFilter<T> extends MenuButton {

    private final ObservableList<T> selectedItems = FXCollections.observableArrayList();
    private final Function<T, String> labelExtractor;

    public MultiSelectFilter(String title, Function<T, String> labelExtractor) {
        super(title);
        this.labelExtractor = labelExtractor;
    }

    public void setItems(List<T> items) {
        getItems().clear();
        selectedItems.clear();

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
            getItems().add(customMenuItem);
        }
    }

    public ObservableList<T> getSelectedItems() {
        return selectedItems;
    }

    public void clearSelection() {
        for (var menuItem : getItems()) {
            if (menuItem instanceof CustomMenuItem cmi && cmi.getContent() instanceof CheckBox cb) {
                cb.setSelected(false);
            }
        }
        selectedItems.clear();
    }
}
