package com.possum.ui.people;

import com.possum.application.people.UserService;
import com.possum.domain.model.User;
import com.possum.ui.common.controllers.AbstractFormController;
import com.possum.ui.common.validation.FieldValidator;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.util.Collections;

public class UserFormController extends AbstractFormController<User> {

    @FXML private TextField nameField;
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private ComboBox<String> statusCombo;
    @FXML private Label passwordHelper;
    
    @FXML private Label nameErrorLabel;
    @FXML private Label usernameErrorLabel;
    @FXML private Label statusErrorLabel;
    @FXML private Label passwordErrorLabel;

    private final UserService userService;
    
    private FieldValidator<String> nameValidator;
    private FieldValidator<String> usernameValidator;
    private FieldValidator<String> statusValidator;
    private FieldValidator<String> passwordValidator;

    public UserFormController(UserService userService, WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.userService = userService;
    }

    @FXML
    public void initialize() {
        if (statusCombo != null) {
            statusCombo.setItems(FXCollections.observableArrayList("Active", "Inactive"));
            statusCombo.setValue("Active");
        }
        setupValidators();
    }

    @Override
    protected String getEntityIdParamName() {
        return "userId";
    }

    @Override
    protected String getEntityDisplayName() {
        return "Employee";
    }

    @Override
    protected User loadEntity(Long id) {
        return userService.getUserById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    protected void populateFields(User user) {
        if (nameField != null) {
            nameField.setText(user.name());
        }
        if (usernameField != null) {
            usernameField.setText(user.username());
        }
        if (statusCombo != null) {
            statusCombo.setValue(Boolean.TRUE.equals(user.active()) ? "Active" : "Inactive");
        }
        
        // Update password helper text based on mode
        if (passwordHelper != null) {
            if (isEditMode()) {
                passwordHelper.setText("Leave blank to keep current password.");
            } else if (isCreateMode()) {
                passwordHelper.setText("Required for new employees.");
            }
        }
    }

    @Override
    protected void setupValidators() {
        if (nameField != null && nameErrorLabel != null) {
            nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
                .required("Full name")
                .validateOnFocusLost();
            formValidator.addField(nameValidator);
        }

        if (usernameField != null && usernameErrorLabel != null) {
            usernameValidator = FieldValidator.forField(usernameField, usernameErrorLabel)
                .required("Username")
                .noSpaces("Username")
                .validateOnFocusLost();
            formValidator.addField(usernameValidator);
        }

        if (statusCombo != null && statusErrorLabel != null) {
            statusValidator = FieldValidator.forField(statusCombo, statusErrorLabel)
                .notNull("Status")
                .validateOnFocusLost();
            formValidator.addField(statusValidator);
        }

        // Password validation only for create mode
        if (isCreateMode() && passwordField != null && passwordErrorLabel != null) {
            passwordValidator = FieldValidator.forField(passwordField, passwordErrorLabel)
                .required("Password")
                .minLength(6, "Password")
                .validateOnFocusLost();
            formValidator.addField(passwordValidator);
        }
    }

    @Override
    protected boolean validateForm() {
        // For create mode, password is required
        if (isCreateMode()) {
            if (passwordField != null && passwordErrorLabel != null) {
                String password = passwordField.getText();
                if (password == null || password.trim().isEmpty()) {
                    passwordErrorLabel.setText("Password is required for new employees");
                    passwordErrorLabel.setVisible(true);
                    passwordField.getStyleClass().add("input-error");
                    return false;
                }
                if (password.length() < 6) {
                    passwordErrorLabel.setText("Use at least 6 characters");
                    passwordErrorLabel.setVisible(true);
                    passwordField.getStyleClass().add("input-error");
                    return false;
                }
            }
        }
        
        return super.validateForm();
    }

    @Override
    protected void setFormEditable(boolean editable) {
        if (!editable) {
            // View mode - replace fields with labels
            if (nameField != null) replaceWithLabel(nameField);
            if (usernameField != null) replaceWithLabel(usernameField);
            if (statusCombo != null) replaceWithLabel(statusCombo);
            
            // Hide password field in view mode
            if (passwordField != null && passwordField.getParent() instanceof javafx.scene.layout.VBox box) {
                box.getChildren().remove(passwordField);
            }
            if (passwordHelper != null && passwordHelper.getParent() instanceof javafx.scene.layout.VBox box) {
                box.getChildren().remove(passwordHelper);
            }
        } else {
            // Edit/Create mode - fields are already editable
            if (nameField != null) nameField.setEditable(true);
            if (usernameField != null) usernameField.setEditable(true);
            if (statusCombo != null) statusCombo.setDisable(false);
            if (passwordField != null) passwordField.setEditable(true);
        }
    }

    @Override
    protected void createEntity() throws Exception {
        boolean isActive = "Active".equals(statusCombo.getValue());
        
        userService.createUser(
            nameField.getText().trim(),
            usernameField.getText().trim(),
            passwordField.getText(),
            isActive,
            Collections.emptyList() // Roles are managed separately
        );
    }

    @Override
    protected void updateEntity() throws Exception {
        boolean isActive = "Active".equals(statusCombo.getValue());
        
        userService.updateUser(
            getEntityId(),
            nameField.getText().trim(),
            usernameField.getText().trim(),
            passwordField.getText(), // Allows blank if not updating
            isActive,
            null // Prevent roles from being overwritten
        );
    }
}
