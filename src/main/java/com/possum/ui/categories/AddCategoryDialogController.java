package com.possum.ui.categories;

import com.possum.application.categories.CategoryService;
import com.possum.domain.model.Category;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.util.StringConverter;

import java.util.List;

public class AddCategoryDialogController {

    @FXML private TextField nameField;
    @FXML private ComboBox<Category> parentCategoryComboBox;

    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;

    public AddCategoryDialogController(CategoryService categoryService, WorkspaceManager workspaceManager) {
        this.categoryService = categoryService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        parentCategoryComboBox.setConverter(new StringConverter<Category>() {
            @Override
            public String toString(Category category) {
                return category == null ? "None" : category.name();
            }

            @Override
            public Category fromString(String string) {
                return null;
            }
        });

        Platform.runLater(this::loadCategories);
    }

    private void loadCategories() {
        List<Category> allCategories = categoryService.getAllCategories();
        parentCategoryComboBox.setItems(FXCollections.observableArrayList(allCategories));
    }

    @FXML
    private void handleSave() {
        String name = nameField.getText();
        if (name == null || name.trim().isEmpty()) {
            showAlert("Error", "Category name is required.");
            return;
        }

        Category selectedParent = parentCategoryComboBox.getValue();
        Long parentId = selectedParent != null ? selectedParent.id() : null;

        try {
            categoryService.createCategory(name.trim(), parentId);
            workspaceManager.closeActiveWindow();
        } catch (Exception e) {
            showAlert("Error", "Failed to create category: " + e.getMessage());
        }
    }

    @FXML
    private void handleCancel() {
        workspaceManager.closeActiveWindow();
    }

    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR, message, ButtonType.OK);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.showAndWait();
    }
}
