package com.possum.ui.people;

import com.possum.application.people.UserService;
import com.possum.domain.model.User;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.navigation.Parameterizable;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.util.Collections;
import java.util.Map;

public class UserFormController implements Parameterizable {

    private final UserService userService;
    private final WorkspaceManager workspaceManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private ComboBox<String> statusCombo;
    @FXML private Button saveButton;

    private Long userId = null;

    public UserFormController(UserService userService, WorkspaceManager workspaceManager) {
        this.userService = userService;
        this.workspaceManager = workspaceManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("userId")) {
            this.userId = (Long) params.get("userId");
            String mode = (String) params.get("mode");
            boolean isView = "view".equals(mode);

            titleLabel.setText(isView ? "View Employee" : "Edit Employee");
            loadUserDetails(isView);
        } else {
            this.userId = null;
            titleLabel.setText("Add Employee");
        }
    }

    private void loadUserDetails(boolean isView) {
        try {
            User user = userService.getUserById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            nameField.setText(user.name());
            usernameField.setText(user.username());
            // Intentionally not setting password field for existing user

            statusCombo.setValue(Boolean.TRUE.equals(user.active()) ? "Active" : "Inactive");

            if (isView) {
                replaceFieldWithLabel(nameField, user.name());
                replaceFieldWithLabel(usernameField, user.username());
                replaceFieldWithLabel(statusCombo, statusCombo.getValue());
                
                // Hide or remove password field on view
                if (passwordField.getParent() instanceof VBox box) {
                    box.getChildren().remove(passwordField);
                }

                saveButton.setVisible(false);
                saveButton.setManaged(false);
            }

        } catch (Exception e) {
            e.printStackTrace();
            NotificationService.error("Failed to load user details: " + e.getMessage());
        }
    }

    @FXML
    public void initialize() {
        statusCombo.setItems(FXCollections.observableArrayList("Active", "Inactive"));
        statusCombo.setValue("Active");
    }

    @FXML
    private void handleSave() {
        try {
            validateInputs();

            boolean isActive = "Active".equals(statusCombo.getValue());

            if (userId == null) {
                // New user needs a password
                if (passwordField.getText() == null || passwordField.getText().trim().isEmpty()) {
                    throw new IllegalArgumentException("Password is required for new users");
                }
                userService.createUser(
                        nameField.getText(),
                        usernameField.getText(),
                        passwordField.getText(),
                        isActive,
                        Collections.emptyList() // Roles are managed separately
                );
                NotificationService.success("User created successfully");
            } else {
                userService.updateUser(
                        userId,
                        nameField.getText(),
                        usernameField.getText(),
                        passwordField.getText(), // Allows blank if not updating
                        isActive,
                        null // Prevent roles from being overwritten
                );
                NotificationService.success("User updated successfully");
            }

            workspaceManager.close(titleLabel);
        } catch (Exception e) {
            NotificationService.error("Failed to save user: " + e.getMessage());
        }
    }

    private void validateInputs() {
        if (nameField.getText() == null || nameField.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (usernameField.getText() == null || usernameField.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
    }

    @FXML
    private void handleCancel() {
        workspaceManager.close(titleLabel);
    }

    private void replaceFieldWithLabel(Control field, String text) {
        if (field == null || field.getParent() == null) return;
        Label label = new Label(text != null ? text : "");
        label.setStyle("-fx-font-size: 14px; -fx-text-fill: #1e293b; -fx-padding: 8 12;");
        label.setWrapText(true);
        
        javafx.scene.Parent parent = field.getParent();
        if (parent instanceof VBox box) {
            int index = box.getChildren().indexOf(field);
            if (index != -1) {
                box.getChildren().set(index, label);
            }
        } else if (parent instanceof HBox box) {
            int index = box.getChildren().indexOf(field);
            if (index != -1) {
                box.getChildren().set(index, label);
            }
        }
    }
}
