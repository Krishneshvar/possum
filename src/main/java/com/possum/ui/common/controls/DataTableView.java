package com.possum.ui.common.controls;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.collections.ObservableList;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.geometry.Side;
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
        tableView.setAccessibleText("Data table");
        
        // Use TableView's built-in placeholder support
        tableView.setPlaceholder(emptyState);
        
        getChildren().addAll(tableView, loadingOverlay);
        
        loadingOverlay.setVisible(false);
        
        loading.addListener((obs, old, isLoading) -> {
            loadingOverlay.setVisible(isLoading);
            loadingOverlay.setManaged(isLoading);
            // Hide placeholder while loading to avoid flickering
            if (isLoading) {
                tableView.setPlaceholder(new Region());
            } else {
                tableView.setPlaceholder(emptyState);
            }
        });
    }

    private VBox createEmptyState() {
        Label icon = new Label("📦");
        icon.getStyleClass().add("empty-state-icon");
        icon.setStyle("-fx-font-size: 48px; -fx-opacity: 0.4;");

        Label label = new Label("No data available");
        label.getStyleClass().add("empty-state-title");
        label.setStyle("-fx-font-size: 18px; -fx-font-weight: 700;");

        Label subtitle = new Label("New records will appear here once available.");
        subtitle.getStyleClass().add("empty-state-subtitle");
        subtitle.setStyle("-fx-font-size: 14px; -fx-wrap-text: true; -fx-text-alignment: center; -fx-max-width: 400;");
        subtitle.setWrapText(true);

        Region spacer = new Region();
        spacer.setMinHeight(8);

        VBox box = new VBox(12, icon, label, spacer, subtitle);
        box.getStyleClass().add("empty-state-view");
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-padding: 48 24;");
        box.setAccessibleText("Empty state view");
        return box;
    }

    private StackPane createLoadingOverlay() {
        ProgressIndicator spinner = new ProgressIndicator();
        spinner.setMaxSize(50, 50);
        StackPane overlay = new StackPane(spinner);
        overlay.getStyleClass().add("table-loading-overlay");
        overlay.setAccessibleText("Loading data");
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
        column.setMinWidth(132);
        column.setPrefWidth(152);
        column.setMaxWidth(220);
        column.setCellValueFactory(features -> new ReadOnlyObjectWrapper<>(features.getValue()));
        column.setCellFactory(col -> new TableCell<T, T>() {
            private final Button button = new Button(title);
            {
                button.setCursor(Cursor.HAND);
                button.getStyleClass().add("action-btn");
                button.getStyleClass().add("table-action-btn");
                button.setAccessibleText(title + " action");
                button.setMnemonicParsing(false);
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
                    setAlignment(Pos.CENTER);
                    setGraphic(button);
                }
            }
        });
        tableView.getColumns().add(column);
    }

    public void addMenuActionColumn(String title, Function<T, List<MenuItem>> menuBuilder) {
        TableColumn<T, T> column = new TableColumn<>(title);
        column.setSortable(false);
        column.setMinWidth(132);
        column.setPrefWidth(152);
        column.setMaxWidth(220);
        column.setCellValueFactory(features -> new ReadOnlyObjectWrapper<>(features.getValue()));
        column.setCellFactory(col -> new TableCell<T, T>() {
            private final Button menuButton = new Button(title + " \u25BE");
            private final ContextMenu actionsMenu = new ContextMenu();
            {
                menuButton.setCursor(Cursor.HAND);
                menuButton.getStyleClass().add("action-btn");
                menuButton.getStyleClass().add("table-action-btn");
                menuButton.getStyleClass().add("table-action-menu-trigger");
                menuButton.setAccessibleText(title + " actions menu");
                menuButton.setMnemonicParsing(false);
                menuButton.setOnAction(e -> {
                    T item = getItem();
                    if (item != null) {
                        actionsMenu.getItems().setAll(menuBuilder.apply(item));
                        if (!actionsMenu.getItems().isEmpty()) {
                            actionsMenu.show(menuButton, Side.BOTTOM, 0, 4);
                        }
                    }
                });
            }
            @Override
            protected void updateItem(T item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    actionsMenu.hide();
                    setGraphic(null);
                } else {
                    setAlignment(Pos.CENTER);
                    setGraphic(menuButton);
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
        ((Label) emptyState.getChildren().get(1)).setText(message);
    }

    public String getEmptyMessage() {
        return ((Label) emptyState.getChildren().get(1)).getText();
    }

    public void setEmptySubtitle(String subtitle) {
        ((Label) emptyState.getChildren().get(3)).setText(subtitle);
    }

    public void setEmptyIcon(String icon) {
        ((Label) emptyState.getChildren().get(0)).setText(icon);
    }

    public void setEmptyIconStyle(String style) {
        emptyState.getChildren().get(0).setStyle(style);
    }

}
