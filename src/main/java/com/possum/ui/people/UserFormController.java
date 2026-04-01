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
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class UserFormController implements Parameterizable {

    private final UserService userService;
    private final WorkspaceManager workspaceManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private ComboBox<String> statusCombo;
    @FXML private Button saveButton;
    @FXML private Label passwordHelper;
    @FXML private Label nameErrorLabel;
    @FXML private Label usernameErrorLabel;
    @FXML private Label statusErrorLabel;
    @FXML private Label passwordErrorLabel;

    private Long userId = null;
    private final Set<Control> invalidFields = new HashSet<>();

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
                if (passwordHelper != null && passwordHelper.getParent() instanceof VBox box) {
                    box.getChildren().remove(passwordHelper);
                }

                saveButton.setVisible(false);
                saveButton.setManaged(false);
            } else if (userId != null) { // Editing existing user
                if (passwordHelper != null) {
                    passwordHelper.setText("Leave blank to keep current password.");
                }
            } else { // New user
                if (passwordHelper != null) {
                    passwordHelper.setText("Required for new employees.");
                }
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
        setupValidation();
    }

    @FXML
    private void handleSave() {
        try {
            if (!validateInputs()) {
                NotificationService.warning("Please fix the highlighted fields");
                return;
            }

            saveButton.setDisable(true);
            saveButton.setText("Saving...");

            boolean isActive = "Active".equals(statusCombo.getValue());

            if (userId == null) {
                // New user needs a password
                if (passwordField.getText() == null || passwordField.getText().trim().isEmpty()) {
                    throw new IllegalArgumentException("Password is required for new users");
                }
                userService.createUser(
                        nameField.getText().trim(),
                        usernameField.getText().trim(),
                        passwordField.getText(),
                        isActive,
                        Collections.emptyList() // Roles are managed separately
                );
                NotificationService.success("User created successfully");
            } else {
                userService.updateUser(
                        userId,
                        nameField.getText().trim(),
                        usernameField.getText().trim(),
                        passwordField.getText(), // Allows blank if not updating
                        isActive,
                        null // Prevent roles from being overwritten
                );
                NotificationService.success("User updated successfully");
            }

            workspaceManager.close(titleLabel);
        } catch (Exception e) {
            NotificationService.error(e.getMessage());
            saveButton.setDisable(false);
            saveButton.setText("Save Employee");
        }
    }

    private void setupValidation() {
        nameField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateName();
            }
        });
        usernameField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateUsername();
            }
        });
        statusCombo.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateStatus();
            }
        });
        passwordField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validatePasswordIfRequired();
            }
        });
    }

    private boolean validateInputs() {
        boolean valid = true;
        valid &= validateName();
        valid &= validateUsername();
        valid &= validateStatus();
        valid &= validatePasswordIfRequired();
        return valid;
    }

    private boolean validateName() {
        String value = nameField.getText() == null ? "" : nameField.getText().trim();
        if (value.isEmpty()) {
            showFieldError(nameField, nameErrorLabel, "Full name is required");
            return false;
        }
        clearFieldError(nameField, nameErrorLabel);
        return true;
    }

    private boolean validateUsername() {
        String value = usernameField.getText() == null ? "" : usernameField.getText().trim();
        if (value.isEmpty()) {
            showFieldError(usernameField, usernameErrorLabel, "Username is required");
            return false;
        }
        if (value.contains(" ")) {
            showFieldError(usernameField, usernameErrorLabel, "Username cannot contain spaces");
            return false;
        }
        clearFieldError(usernameField, usernameErrorLabel);
        return true;
    }

    private boolean validateStatus() {
        if (statusCombo.getValue() == null || statusCombo.getValue().trim().isEmpty()) {
            showFieldError(statusCombo, statusErrorLabel, "Status is required");
            return false;
        }
        clearFieldError(statusCombo, statusErrorLabel);
        return true;
    }

    private boolean validatePasswordIfRequired() {
        if (userId == null) {
            String value = passwordField.getText() == null ? "" : passwordField.getText().trim();
            if (value.isEmpty()) {
                showFieldError(passwordField, passwordErrorLabel, "Password is required for new employees");
                return false;
            }
            if (value.length() < 6) {
                showFieldError(passwordField, passwordErrorLabel, "Use at least 6 characters");
                return false;
            }
        }
        clearFieldError(passwordField, passwordErrorLabel);
        return true;
    }

    @FXML
    private void handleCancel() {
        workspaceManager.close(titleLabel);
    }

    private void replaceFieldWithLabel(Control field, String text) {
        if (field == null || field.getParent() == null) return;
        Label label = new Label(text != null ? text : "");
        label.getStyleClass().add("readonly-value");
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

    private void showFieldError(Control control, Label errorLabel, String message) {
        if (control != null && !control.getStyleClass().contains("input-error")) {
            control.getStyleClass().add("input-error");
        }
        invalidFields.add(control);
        if (errorLabel != null) {
            errorLabel.setText(message);
            errorLabel.setVisible(true);
            errorLabel.setManaged(true);
        }
    }

    private void clearFieldError(Control control, Label errorLabel) {
        if (control != null) {
            control.getStyleClass().remove("input-error");
            invalidFields.remove(control);
        }
        if (errorLabel != null) {
            errorLabel.setText("");
            errorLabel.setVisible(false);
            errorLabel.setManaged(false);
        }
    }
}
