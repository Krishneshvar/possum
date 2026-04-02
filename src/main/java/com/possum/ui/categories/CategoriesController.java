package com.possum.ui.categories;

import com.possum.application.categories.CategoryService;
import com.possum.application.categories.CategoryService.CategoryTreeNode;
import com.possum.domain.model.Category;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import org.kordamp.ikonli.javafx.FontIcon;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class CategoriesController {

    @FXML private TreeView<String> categoryTreeView;
    @FXML private TableView<Category> categoryTableView;
    @FXML private javafx.scene.control.TextField searchField;
    @FXML private javafx.scene.control.Button addButton;
    @FXML private javafx.scene.control.Button refreshButton;
    @FXML private TableColumn<Category, String> idCol;
    @FXML private TableColumn<Category, String> nameCol;
    @FXML private TableColumn<Category, String> parentCol;
    @FXML private TableColumn<Category, Category> actionsCol;

    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;

    public CategoriesController(CategoryService categoryService, WorkspaceManager workspaceManager) {
        this.categoryService = categoryService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (addButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(addButton, com.possum.application.auth.Permissions.CATEGORIES_MANAGE);
            FontIcon addIcon = new FontIcon("bx-plus");
            addIcon.setIconSize(16);
            addIcon.setIconColor(javafx.scene.paint.Color.WHITE);
            addButton.setGraphic(addIcon);
        }
        
        if (refreshButton != null) {
            FontIcon refreshIcon = new FontIcon("bx-refresh");
            refreshIcon.setIconSize(16);
            refreshButton.setGraphic(refreshIcon);
        }
        
        idCol.setCellValueFactory(cellData -> new SimpleStringProperty(String.valueOf(cellData.getValue().id())));
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        setupActionsColumn();
        
        Platform.runLater(this::loadData);
    }

    private void setupActionsColumn() {
        actionsCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue()));
        actionsCol.setCellFactory(col -> new TableCell<>() {
            private final Button editBtn = new Button("Edit");
            {
                FontIcon editIcon = new FontIcon("bx-pencil");
                editIcon.setIconSize(14);
                editIcon.getStyleClass().add("table-action-icon");
                editBtn.setGraphic(editIcon);
                editBtn.getStyleClass().add("action-button");
                editBtn.getStyleClass().add("btn-edit-action");
                editBtn.setCursor(javafx.scene.Cursor.HAND);
                editBtn.setOnAction(e -> {
                    Category category = getItem();
                    if (category != null) {
                        handleEdit(category);
                    }
                });
            }

            @Override
            protected void updateItem(Category item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    setGraphic(editBtn);
                }
            }
        });
    }

    public void loadData() {
        List<Category> allCategories = categoryService.getAllCategories();

        Map<Long, String> categoryNameMap = new HashMap<>();
        for (Category c : allCategories) {
            categoryNameMap.put(c.id(), c.name());
        }

        parentCol.setCellValueFactory(cellData -> {
            Long parentId = cellData.getValue().parentId();
            if (parentId == null) {
                return new SimpleStringProperty("-");
            }
            String parentName = categoryNameMap.get(parentId);
            return new SimpleStringProperty(parentName != null ? parentName : String.valueOf(parentId));
        });

        ObservableList<Category> masterData = FXCollections.observableArrayList(allCategories);
        FilteredList<Category> filteredData = new FilteredList<>(masterData, p -> true);

        searchField.textProperty().addListener((observable, oldValue, newValue) -> {
            filteredData.setPredicate(category -> {
                if (newValue == null || newValue.isEmpty()) {
                    return true;
                }
                String lowerCaseFilter = newValue.toLowerCase();
                if (category.name().toLowerCase().contains(lowerCaseFilter)) {
                    return true;
                } else if (String.valueOf(category.id()).contains(lowerCaseFilter)) {
                    return true;
                }
                return false;
            });
        });

        categoryTableView.setItems(filteredData);

        List<CategoryTreeNode> treeNodes = categoryService.getCategoriesAsTree();
        TreeItem<String> rootItem = new TreeItem<>("All Categories");
        FontIcon rootIcon = new FontIcon("bx-package");
        rootIcon.setIconSize(16);
        rootIcon.setIconColor(javafx.scene.paint.Color.web("#64748b"));
        rootItem.setGraphic(rootIcon);
        
        rootItem.setExpanded(true);
        for (CategoryTreeNode node : treeNodes) {
            rootItem.getChildren().add(buildTreeItem(node));
        }
        categoryTreeView.setRoot(rootItem);
        categoryTreeView.setShowRoot(false);
    }

    private TreeItem<String> buildTreeItem(CategoryTreeNode node) {
        TreeItem<String> item = new TreeItem<>(node.category().name());
        
        FontIcon folderIcon = new FontIcon(node.subcategories().isEmpty() ? "bx-layer" : "bx-folder");
        folderIcon.setIconSize(14);
        folderIcon.setIconColor(javafx.scene.paint.Color.web("#10b981"));
        item.setGraphic(folderIcon);

        item.setExpanded(true);
        for (CategoryTreeNode childNode : node.subcategories()) {
            item.getChildren().add(buildTreeItem(childNode));
        }
        return item;
    }

    @FXML
    private void handleAddCategory() {
        workspaceManager.showDialog("Add Category", "/fxml/categories/add-category-dialog.fxml", null);
        loadData();
    }

    @FXML
    private void handleRefresh() {
        loadData();
    }

    private void handleEdit(Category category) {
        Map<String, Object> params = new HashMap<>();
        params.put("category", category);
        workspaceManager.showDialog("Edit Category", "/fxml/categories/add-category-dialog.fxml", params);
        loadData();
    }

    @FXML
    private void handleEditCategory() {
        Category selected = categoryTableView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            handleEdit(selected);
        }
    }
}
