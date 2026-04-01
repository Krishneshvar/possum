package com.possum.ui.purchase;

import com.possum.domain.model.PaymentPolicy;
import com.possum.domain.model.Supplier;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.navigation.Parameterizable;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SupplierFormController implements Parameterizable {

    private final SupplierRepository supplierRepository;
    private final WorkspaceManager workspaceManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextField contactPersonField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextArea addressField;
    @FXML private TextField gstinField;
    @FXML private ComboBox<PaymentPolicy> paymentPolicyCombo;
    @FXML private Button saveButton;
    @FXML private Label nameErrorLabel;
    @FXML private Label phoneErrorLabel;
    @FXML private Label emailErrorLabel;

    private Long supplierId = null;
    private Runnable onSaveCallback;
    private final Set<Control> invalidFields = new HashSet<>();

    public SupplierFormController(SupplierRepository supplierRepository, WorkspaceManager workspaceManager) {
        this.supplierRepository = supplierRepository;
        this.workspaceManager = workspaceManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("supplierId")) {
            this.supplierId = (Long) params.get("supplierId");
            String mode = (String) params.get("mode");
            boolean isView = "view".equals(mode);

            Platform.runLater(() -> titleLabel.setText(isView ? "View Supplier" : "Edit Supplier"));
            loadSupplierDetails(isView);
        } else {
            this.supplierId = null;
            Platform.runLater(() -> titleLabel.setText("Add Supplier"));
        }
        
        if (params != null && params.containsKey("onSave")) {
            this.onSaveCallback = (Runnable) params.get("onSave");
        }
        
        loadPaymentPolicies();
    }

    private void loadPaymentPolicies() {
        Platform.runLater(() -> {
            try {
                List<PaymentPolicy> policies = supplierRepository.getPaymentPolicies();
                makePolicyComboSearchable(policies);
            } catch (Exception e) {
                NotificationService.error("Failed to load payment policies");
            }
        });
    }

    private void makePolicyComboSearchable(List<PaymentPolicy> allPolicies) {
        paymentPolicyCombo.setItems(FXCollections.observableArrayList(allPolicies));
        paymentPolicyCombo.setConverter(new javafx.util.StringConverter<PaymentPolicy>() {
            @Override
            public String toString(PaymentPolicy p) {
                return p == null ? "" : p.name();
            }
            @Override
            public PaymentPolicy fromString(String string) {
                return allPolicies.stream().filter(p -> p.name().equals(string)).findFirst().orElse(null);
            }
        });
        
        paymentPolicyCombo.setEditable(true);
        paymentPolicyCombo.getEditor().textProperty().addListener((obs, oldV, newV) -> {
            if (newV == null || newV.isEmpty()) {
                paymentPolicyCombo.setItems(FXCollections.observableArrayList(allPolicies));
            } else {
                PaymentPolicy selected = paymentPolicyCombo.getSelectionModel().getSelectedItem();
                if (selected != null && selected.name().equals(newV)) return;
                
                List<PaymentPolicy> filtered = allPolicies.stream()
                        .filter(p -> p.name().toLowerCase().contains(newV.toLowerCase()))
                        .toList();
                paymentPolicyCombo.setItems(FXCollections.observableArrayList(filtered));
                if (!filtered.isEmpty()) paymentPolicyCombo.show();
            }
        });
    }

    private void loadSupplierDetails(boolean isView) {
        Platform.runLater(() -> {
            try {
                Supplier supplier = supplierRepository.findSupplierById(supplierId)
                        .orElseThrow(() -> new RuntimeException("Supplier not found"));

                nameField.setText(supplier.name());
                contactPersonField.setText(supplier.contactPerson() != null ? supplier.contactPerson() : "");
                phoneField.setText(supplier.phone() != null ? supplier.phone() : "");
                emailField.setText(supplier.email() != null ? supplier.email() : "");
                addressField.setText(supplier.address() != null ? supplier.address() : "");
                gstinField.setText(supplier.gstin() != null ? supplier.gstin() : "");

                if (supplier.paymentPolicyId() != null) {
                    supplierRepository.getPaymentPolicies().stream()
                        .filter(p -> p.id().equals(supplier.paymentPolicyId()))
                        .findFirst()
                        .ifPresent(p -> paymentPolicyCombo.setValue(p));
                }

                if (isView) {
                    replaceFieldWithLabel(nameField, supplier.name());
                    replaceFieldWithLabel(contactPersonField, supplier.contactPerson());
                    replaceFieldWithLabel(phoneField, supplier.phone());
                    replaceFieldWithLabel(emailField, supplier.email());
                    replaceFieldWithLabel(addressField, supplier.address());
                    replaceFieldWithLabel(gstinField, supplier.gstin());
                    replaceFieldWithLabel(paymentPolicyCombo, supplier.paymentPolicyName());
                    
                    saveButton.setVisible(false);
                    saveButton.setManaged(false);
                }

            } catch (Exception e) {
                NotificationService.error("Failed to load supplier details: " + e.getMessage());
            }
        });
    }

    @FXML
    public void initialize() {
        setupValidation();
    }

    @FXML
    private void handleSave() {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SUPPLIERS_MANAGE);
        try {
            if (!validateInputs()) {
                NotificationService.warning("Please fix the highlighted fields");
                return;
            }

            PaymentPolicy selectedPolicy = paymentPolicyCombo.getValue();
            Long policyId = selectedPolicy != null ? selectedPolicy.id() : null;
            String policyName = selectedPolicy != null ? selectedPolicy.name() : null;

            Supplier supplierToSave = new Supplier(
                    supplierId,
                    nameField.getText().trim(),
                    contactPersonField.getText().trim().isEmpty() ? null : contactPersonField.getText().trim(),
                    phoneField.getText().trim().isEmpty() ? null : phoneField.getText().trim(),
                    emailField.getText().trim().isEmpty() ? null : emailField.getText().trim(),
                    addressField.getText().trim().isEmpty() ? null : addressField.getText().trim(),
                    gstinField.getText().trim().isEmpty() ? null : gstinField.getText().trim(),
                    policyId,
                    policyName,
                    null, null, null
            );

            if (supplierId == null) {
                supplierRepository.createSupplier(supplierToSave);
                NotificationService.success("Supplier created successfully");
            } else {
                supplierRepository.updateSupplier(supplierId, supplierToSave);
                NotificationService.success("Supplier updated successfully");
            }

            if (onSaveCallback != null) {
                onSaveCallback.run();
            }
            workspaceManager.closeActiveWindow();
        } catch (IllegalArgumentException e) {
            NotificationService.error(e.getMessage());
        } catch (Exception e) {
            NotificationService.error("Failed to save supplier: " + e.getMessage());
        }
    }

    private void setupValidation() {
        nameField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateName();
            }
        });
        phoneField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validatePhone();
            }
        });
        emailField.focusedProperty().addListener((obs, old, focused) -> {
            if (!focused) {
                validateEmail();
            }
        });
    }

    private boolean validateInputs() {
        boolean valid = true;
        valid &= validateName();
        valid &= validatePhone();
        valid &= validateEmail();
        return valid;
    }

    private boolean validateName() {
        String value = nameField.getText() == null ? "" : nameField.getText().trim();
        if (value.isEmpty()) {
            showFieldError(nameField, nameErrorLabel, "Supplier name is required");
            return false;
        }
        clearFieldError(nameField, nameErrorLabel);
        return true;
    }

    private boolean validatePhone() {
        String value = phoneField.getText() == null ? "" : phoneField.getText().trim();
        if (!value.isEmpty() && !value.matches("[+0-9()\\-\\s]{7,20}")) {
            showFieldError(phoneField, phoneErrorLabel, "Enter a valid phone number");
            return false;
        }
        clearFieldError(phoneField, phoneErrorLabel);
        return true;
    }

    private boolean validateEmail() {
        String value = emailField.getText() == null ? "" : emailField.getText().trim();
        if (!value.isEmpty() && !value.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            showFieldError(emailField, emailErrorLabel, "Enter a valid email address");
            return false;
        }
        clearFieldError(emailField, emailErrorLabel);
        return true;
    }

    @FXML
    private void handleCancel() {
        workspaceManager.closeActiveWindow();
    }

    private void replaceFieldWithLabel(Control field, String text) {
        if (field == null || field.getParent() == null) return;
        Label label = new Label(text != null && !text.isEmpty() ? text : "-");
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
