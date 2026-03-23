package com.possum.ui.people;

import com.possum.application.people.CustomerService;
import com.possum.domain.model.Customer;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.navigation.Parameterizable;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.util.Map;

public class CustomerFormController implements Parameterizable {

    private final CustomerService customerService;
    private final WorkspaceManager workspaceManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextArea addressField;
    @FXML private Button saveButton;

    private Long customerId = null;

    public CustomerFormController(CustomerService customerService, WorkspaceManager workspaceManager) {
        this.customerService = customerService;
        this.workspaceManager = workspaceManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("customerId")) {
            this.customerId = (Long) params.get("customerId");
            String mode = (String) params.get("mode");
            boolean isView = "view".equals(mode);

            titleLabel.setText(isView ? "View Customer" : "Edit Customer");
            loadCustomerDetails(isView);
        } else {
            this.customerId = null;
            titleLabel.setText("Add Customer");
        }
    }

    private void loadCustomerDetails(boolean isView) {
        try {
            Customer customer = customerService.getCustomerById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            nameField.setText(customer.name());
            phoneField.setText(customer.phone() != null ? customer.phone() : "");
            emailField.setText(customer.email() != null ? customer.email() : "");
            addressField.setText(customer.address() != null ? customer.address() : "");

            if (isView) {
                replaceFieldWithLabel(nameField, customer.name());
                replaceFieldWithLabel(phoneField, customer.phone());
                replaceFieldWithLabel(emailField, customer.email());
                replaceFieldWithLabel(addressField, customer.address());
                
                saveButton.setVisible(false);
                saveButton.setManaged(false);
            }

        } catch (Exception e) {
            e.printStackTrace();
            NotificationService.error("Failed to load customer details: " + e.getMessage());
        }
    }

    @FXML
    public void initialize() {
    }

    @FXML
    private void handleSave() {
        try {
            validateInputs();

            if (customerId == null) {
                customerService.createCustomer(
                        nameField.getText(),
                        phoneField.getText(),
                        emailField.getText(),
                        addressField.getText()
                );
                NotificationService.success("Customer created successfully");
            } else {
                customerService.updateCustomer(
                        customerId,
                        nameField.getText(),
                        phoneField.getText(),
                        emailField.getText(),
                        addressField.getText()
                );
                NotificationService.success("Customer updated successfully");
            }

            workspaceManager.close(titleLabel);
        } catch (Exception e) {
            NotificationService.error("Failed to save customer: " + e.getMessage());
        }
    }

    private void validateInputs() {
        if (nameField.getText() == null || nameField.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
    }

    @FXML
    private void handleCancel() {
        workspaceManager.close(titleLabel);
    }

    private void replaceFieldWithLabel(Control field, String text) {
        if (field == null || field.getParent() == null) return;
        Label label = new Label(text != null && !text.isEmpty() ? text : "-");
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
