package com.possum.ui.categories;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.application.categories.CategoryService;
import com.possum.application.categories.CategoryService.CategoryTreeNode;
import com.possum.domain.model.Category;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.dialogs.ImportProgressDialog;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.concurrent.Task;
import org.kordamp.ikonli.javafx.FontIcon;
import javafx.stage.FileChooser;
import com.possum.ui.common.controls.NotificationService;
import com.possum.shared.util.CsvImportUtil;

import java.io.File;
import java.util.ArrayList;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Locale;

public class CategoriesController {

    @FXML private TreeView<String> categoryTreeView;
    @FXML private DataTableView<Category> categoryTableView;
    @FXML private javafx.scene.control.TextField searchField;
    @FXML private javafx.scene.control.Button addButton;
    @FXML private javafx.scene.control.Button refreshButton;
    @FXML private javafx.scene.control.Button importButton;
    private TableColumn<Category, String> idCol;
    private TableColumn<Category, String> nameCol;
    private TableColumn<Category, String> parentCol;
    private TableColumn<Category, Category> actionsCol;
    
    private final ObservableList<Category> masterData = FXCollections.observableArrayList();
    private FilteredList<Category> filteredData;
    private SortedList<Category> sortedData;
    private final Map<Long, String> categoryNameMap = new HashMap<>();

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
            FontIcon refreshIcon = new FontIcon("bx-sync");
            refreshIcon.setIconSize(16);
            refreshButton.setGraphic(refreshIcon);
        }

        if (importButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(importButton, com.possum.application.auth.Permissions.CATEGORIES_MANAGE);
        }

        idCol = new TableColumn<>("ID");
        nameCol = new TableColumn<>("Name");
        parentCol = new TableColumn<>("Parent Category");
        actionsCol = new TableColumn<>("Actions");

        categoryTableView.getTableView().getColumns().setAll(idCol, nameCol, parentCol, actionsCol);
        categoryTableView.setEmptyMessage("No categories found");
        categoryTableView.setEmptySubtitle("Add your first category to get started.");
        
        idCol.setCellValueFactory(cellData -> new SimpleStringProperty(String.valueOf(cellData.getValue().id())));
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        parentCol.setCellValueFactory(cellData -> {
            Long parentId = cellData.getValue().parentId();
            if (parentId == null) {
                return new SimpleStringProperty("-");
            }
            String parentName = categoryNameMap.get(parentId);
            return new SimpleStringProperty(parentName != null ? parentName : String.valueOf(parentId));
        });

        actionsCol.setSortable(false);
        setupActionsColumn();

        filteredData = new FilteredList<>(masterData, p -> true);
        sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(categoryTableView.getTableView().comparatorProperty());
        categoryTableView.getTableView().setItems(sortedData);

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

        loadData();
    }

    private void setupActionsColumn() {
        actionsCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue()));
        actionsCol.setCellFactory(col -> new TableCell<>() {
            private final Button editBtn = new Button("Edit");
            {
                FontIcon editIcon = new FontIcon("bx-edit");
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

        categoryNameMap.clear();
        for (Category c : allCategories) {
            categoryNameMap.put(c.id(), c.name());
        }

        masterData.setAll(allCategories);

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

    @FXML
    private void handleImport() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Import Categories from CSV");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("CSV Files", "*.csv"));

        File file = fileChooser.showOpenDialog(addButton != null ? addButton.getScene().getWindow() : null);
        if (file == null) return;

        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            NotificationService.error("No active user session found. Please sign in again and retry import.");
            return;
        }

        javafx.stage.Window owner = addButton != null && addButton.getScene() != null
                ? addButton.getScene().getWindow()
                : null;
        ImportProgressDialog progressDialog = new ImportProgressDialog(owner, "Import Categories");
        progressDialog.show();

        Task<ImportResult> importTask = new Task<>() {
            @Override
            protected ImportResult call() throws Exception {
                AuthContext.setCurrentUser(currentUser);
                try {
                    List<List<String>> rows = CsvImportUtil.readCsv(file.toPath());
                    int headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Division Name");
                    if (headerIndex < 0) {
                        headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Name");
                    }
                    if (headerIndex < 0) {
                        throw new IllegalArgumentException("Could not find a valid category header row in CSV.");
                    }

                    Map<String, Integer> headers = CsvImportUtil.buildHeaderIndex(rows.get(headerIndex));
                    List<String> categoryNames = new ArrayList<>();
                    for (int i = headerIndex + 1; i < rows.size(); i++) {
                        List<String> row = rows.get(i);
                        if (CsvImportUtil.isRowEmpty(row)) {
                            continue;
                        }

                        String name = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                                row,
                                headers,
                                "Division Name",
                                "Category Name",
                                "Name"
                        ));
                        if (name != null) {
                            categoryNames.add(name);
                        }
                    }

                    int totalRecords = categoryNames.size();
                    progressDialog.setTotalRecords(totalRecords);

                    List<Category> allCategories = categoryService.getAllCategories();
                    Map<String, Long> categoryMap = new HashMap<>();
                    for (Category c : allCategories) {
                        categoryMap.put(c.name().trim().toLowerCase(Locale.ROOT), c.id());
                    }

                    int processed = 0;
                    int imported = 0;
                    int skipped = 0;

                    for (String name : categoryNames) {
                        processed++;
                        String categoryKey = name.toLowerCase(Locale.ROOT);
                        if (categoryMap.containsKey(categoryKey)) {
                            skipped++;
                            progressDialog.updateProgress(processed, imported);
                            continue;
                        }

                        try {
                            Category created = categoryService.createCategory(name, null);
                            categoryMap.put(categoryKey, created.id());
                            imported++;
                        } catch (Exception ex) {
                            skipped++;
                        }
                        progressDialog.updateProgress(processed, imported);
                    }

                    return new ImportResult(totalRecords, imported, skipped);
                } finally {
                    AuthContext.clear();
                }
            }
        };

        importTask.setOnSucceeded(event -> {
            ImportResult result = importTask.getValue();
            progressDialog.complete(result.totalRecords(), result.imported(), result.skipped());
            loadData();

            if (result.skipped() == 0) {
                NotificationService.success("Imported " + result.imported() + " category(ies) successfully.");
            } else {
                NotificationService.warning("Imported " + result.imported() + " category(ies). " + result.skipped() + " row(s) skipped.");
            }
        });

        importTask.setOnFailed(event -> {
            Throwable error = importTask.getException();
            String message = error != null && error.getMessage() != null ? error.getMessage() : "Unknown error";
            progressDialog.fail(message);
            NotificationService.error("Failed to import categories: " + message);
        });

        Thread worker = new Thread(importTask, "categories-import-task");
        worker.setDaemon(true);
        worker.start();
    }

    private record ImportResult(int totalRecords, int imported, int skipped) {}

    private void handleEdit(Category category) {
        Map<String, Object> params = new HashMap<>();
        params.put("category", category);
        workspaceManager.showDialog("Edit Category", "/fxml/categories/add-category-dialog.fxml", params);
        loadData();
    }

    @FXML
    private void handleEditCategory() {
        Category selected = categoryTableView.getTableView().getSelectionModel().getSelectedItem();
        if (selected != null) {
            handleEdit(selected);
        }
    }
}
