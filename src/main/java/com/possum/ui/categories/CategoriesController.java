package com.possum.ui.categories;

import com.possum.application.categories.CategoryService;
import com.possum.application.categories.CategoryService.CategoryTreeNode;
import com.possum.domain.model.Category;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TreeItem;
import javafx.scene.control.TreeView;

import java.util.List;

public class CategoriesController {

    @FXML private TreeView<String> categoryTreeView;
    @FXML private TableView<Category> categoryTableView;
    @FXML private TableColumn<Category, String> idCol;
    @FXML private TableColumn<Category, String> nameCol;
    @FXML private TableColumn<Category, String> parentCol;

    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;

    public CategoriesController(CategoryService categoryService, WorkspaceManager workspaceManager) {
        this.categoryService = categoryService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        idCol.setCellValueFactory(cellData -> new SimpleStringProperty(String.valueOf(cellData.getValue().id())));
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));

        Platform.runLater(this::loadData);
    }

    public void loadData() {
        List<Category> allCategories = categoryService.getAllCategories();

        java.util.Map<Long, String> categoryNameMap = new java.util.HashMap<>();
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

        categoryTableView.setItems(FXCollections.observableArrayList(allCategories));

        List<CategoryTreeNode> treeNodes = categoryService.getCategoriesAsTree();
        TreeItem<String> rootItem = new TreeItem<>("All Categories");
        rootItem.setExpanded(true);
        for (CategoryTreeNode node : treeNodes) {
            rootItem.getChildren().add(buildTreeItem(node));
        }
        categoryTreeView.setRoot(rootItem);
        categoryTreeView.setShowRoot(false);
    }

    private TreeItem<String> buildTreeItem(CategoryTreeNode node) {
        TreeItem<String> item = new TreeItem<>(node.category().name());
        item.setExpanded(true);
        for (CategoryTreeNode childNode : node.subcategories()) {
            item.getChildren().add(buildTreeItem(childNode));
        }
        return item;
    }

    @FXML
    private void handleAddCategory() {
        workspaceManager.openWindow("Add Category", "/fxml/categories/add-category-dialog.fxml");
    }
}
