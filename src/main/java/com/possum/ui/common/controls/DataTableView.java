package com.possum.ui.common.controls;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.collections.ObservableList;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.layout.Region;
import javafx.util.Callback;
import javafx.beans.property.ReadOnlyObjectWrapper;
import javafx.scene.Cursor;

import java.util.function.Consumer;
import java.util.function.Function;
import java.util.List;

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
        tableView.getStyleClass().add("data-table");
        
        getChildren().addAll(tableView, emptyState, loadingOverlay);
        
        emptyState.setVisible(false);
        loadingOverlay.setVisible(false);
        
        loading.addListener((obs, old, isLoading) -> {
            loadingOverlay.setVisible(isLoading);
            loadingOverlay.setManaged(isLoading);
        });
        
        tableView.itemsProperty().addListener((obs, old, items) -> refreshEmptyState());
        tableView.getItems().addListener((javafx.collections.ListChangeListener<T>) change -> refreshEmptyState());
    }

    private VBox createEmptyState() {
        Label icon = new Label("\uD83D\uDCCB");
        icon.getStyleClass().add("empty-state-icon");

        Label label = new Label("No data available");
        label.getStyleClass().add("empty-state-title");

        Label subtitle = new Label("New records will appear here once available.");
        subtitle.getStyleClass().add("empty-state-subtitle");
        subtitle.setWrapText(true);

        Region spacer = new Region();
        spacer.setMinHeight(4);

        VBox box = new VBox(4, icon, label, spacer, subtitle);
        box.getStyleClass().add("empty-state-view");
        box.setAlignment(Pos.CENTER);
        return box;
    }

    private StackPane createLoadingOverlay() {
        ProgressIndicator spinner = new ProgressIndicator();
        spinner.setMaxSize(50, 50);
        StackPane overlay = new StackPane(spinner);
        overlay.getStyleClass().add("table-loading-overlay");
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
                button.getStyleClass().add("action-btn");
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

    public void addMenuActionColumn(String title, Function<T, List<MenuItem>> menuBuilder) {
        TableColumn<T, T> column = new TableColumn<>(title);
        column.setSortable(false);
        column.setCellValueFactory(features -> new ReadOnlyObjectWrapper<>(features.getValue()));
        column.setCellFactory(col -> new TableCell<T, T>() {
            private final MenuButton menuButton = new MenuButton(title);
            {
                menuButton.setCursor(Cursor.HAND);
                menuButton.getStyleClass().add("action-btn");
                menuButton.setOnShowing(e -> {
                    T item = getItem();
                    if (item != null) {
                        menuButton.getItems().setAll(menuBuilder.apply(item));
                    }
                });
            }
            @Override
            protected void updateItem(T item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    setGraphic(menuButton);
                }
            }
        });
        tableView.getColumns().add(column);
    }

    public void setItems(ObservableList<T> items) {
        tableView.setItems(items);
        refreshEmptyState();
    }

    public ObservableList<T> getItems() {
        return tableView.getItems();
    }

    public void setLoading(boolean loading) {
        this.loading.set(loading);
        refreshEmptyState();
    }

    public TableView<T> getTableView() {
        return tableView;
    }

    public void setEmptyMessage(String message) {
        ((Label) emptyState.getChildren().get(1)).setText(message);
    }

    public String getEmptyMessage() {
        return ((Label) emptyState.getChildren().get(1)).getText();
    }

    public void setEmptySubtitle(String subtitle) {
        ((Label) emptyState.getChildren().get(3)).setText(subtitle);
    }

    private void refreshEmptyState() {
        boolean isEmpty = tableView.getItems() == null || tableView.getItems().isEmpty();
        boolean shouldShow = isEmpty && !loading.get();
        emptyState.setVisible(shouldShow);
        emptyState.setManaged(shouldShow);
    }
}
