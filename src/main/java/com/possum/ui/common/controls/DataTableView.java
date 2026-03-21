package com.possum.ui.common.controls;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.collections.ObservableList;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.util.Callback;
import javafx.beans.property.ReadOnlyObjectWrapper;
import javafx.scene.Cursor;

import java.util.function.Consumer;

public class DataTableView<T> extends StackPane {
    private final TableView<T> tableView;
    private final VBox emptyState;
    private final StackPane loadingOverlay;
    private final BooleanProperty loading = new SimpleBooleanProperty(false);

    public DataTableView() {
        this.tableView = new TableView<>();
        this.emptyState = createEmptyState();
        this.loadingOverlay = createLoadingOverlay();

        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        
        getChildren().addAll(tableView, emptyState, loadingOverlay);
        
        emptyState.setVisible(false);
        loadingOverlay.setVisible(false);
        
        loading.addListener((obs, old, isLoading) -> {
            loadingOverlay.setVisible(isLoading);
            loadingOverlay.setManaged(isLoading);
        });
        
        tableView.itemsProperty().addListener((obs, old, items) -> {
            boolean isEmpty = items == null || items.isEmpty();
            emptyState.setVisible(isEmpty && !loading.get());
            emptyState.setManaged(isEmpty && !loading.get());
        });
    }

    private VBox createEmptyState() {
        Label label = new Label("No data available");
        label.setStyle("-fx-text-fill: gray; -fx-font-size: 14px;");
        VBox box = new VBox(label);
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-background-color: white;");
        return box;
    }

    private StackPane createLoadingOverlay() {
        ProgressIndicator spinner = new ProgressIndicator();
        spinner.setMaxSize(50, 50);
        StackPane overlay = new StackPane(spinner);
        overlay.setStyle("-fx-background-color: rgba(255, 255, 255, 0.8);");
        return overlay;
    }

    @SuppressWarnings("unchecked")
    public TableColumn<T, ?> addColumn(String title, Callback<TableColumn.CellDataFeatures<T, ?>, ?> valueFactory) {
        TableColumn<T, ?> column = new TableColumn<>(title);
        column.setCellValueFactory((Callback) valueFactory);
        column.setSortable(true);
        tableView.getColumns().add(column);
        return column;
    }

    public void addActionColumn(String title, Consumer<T> onAction) {
        TableColumn<T, T> column = new TableColumn<>(title);
        column.setSortable(false);
        column.setCellValueFactory(features -> new ReadOnlyObjectWrapper<>(features.getValue()));
        column.setCellFactory(col -> new TableCell<T, T>() {
            private final Button button = new Button(title);
            {
                button.setCursor(Cursor.HAND);
                button.setStyle("-fx-background-color: #f1f5f9; -fx-text-fill: #1e293b; -fx-border-color: #cbd5e1; -fx-border-radius: 4; -fx-background-radius: 4; -fx-padding: 4 12; -fx-font-size: 13px;");
                button.setOnAction(e -> {
                    T item = getItem();
                    if (item != null) {
                        onAction.accept(item);
                    }
                });
            }
            @Override
            protected void updateItem(T item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    setGraphic(button);
                }
            }
        });
        tableView.getColumns().add(column);
    }

    public void setItems(ObservableList<T> items) {
        tableView.setItems(items);
    }

    public ObservableList<T> getItems() {
        return tableView.getItems();
    }

    public void setLoading(boolean loading) {
        this.loading.set(loading);
    }

    public TableView<T> getTableView() {
        return tableView;
    }

    public void setEmptyMessage(String message) {
        ((Label) emptyState.getChildren().get(0)).setText(message);
    }
}

