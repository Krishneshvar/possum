package com.possum.ui.people;

import com.possum.application.people.CustomerService;
import com.possum.domain.model.Customer;
import com.possum.ui.common.controllers.AbstractFormController;
import com.possum.ui.common.validation.FieldValidator;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.fxml.FXML;
import javafx.scene.control.*;

public class CustomerFormController extends AbstractFormController<Customer> {

    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextArea addressField;
    
    @FXML private Label nameErrorLabel;
    @FXML private Label phoneErrorLabel;
    @FXML private Label emailErrorLabel;

    private final CustomerService customerService;
    
    private FieldValidator<String> nameValidator;
    private FieldValidator<String> phoneValidator;
    private FieldValidator<String> emailValidator;

    public CustomerFormController(CustomerService customerService, WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.customerService = customerService;
    }

    @FXML
    public void initialize() {
        setupValidators();
    }

    @Override
    protected String getEntityIdParamName() {
        return "customerId";
    }

    @Override
    protected String getEntityDisplayName() {
        return "Customer";
    }

    @Override
    protected Customer loadEntity(Long id) {
        return customerService.getCustomerById(id)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    @Override
    protected void populateFields(Customer customer) {
        if (nameField != null) {
            nameField.setText(customer.name());
        }
        if (phoneField != null) {
            phoneField.setText(customer.phone() != null ? customer.phone() : "");
        }
        if (emailField != null) {
            emailField.setText(customer.email() != null ? customer.email() : "");
        }
        if (addressField != null) {
            addressField.setText(customer.address() != null ? customer.address() : "");
        }
    }

    @Override
    protected void setupValidators() {
        if (nameField != null && nameErrorLabel != null) {
            nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
                .required("Customer name")
                .validateOnFocusLost();
            formValidator.addField(nameValidator);
        }

        if (phoneField != null && phoneErrorLabel != null) {
            phoneValidator = FieldValidator.forField(phoneField, phoneErrorLabel)
                .phone()
                .validateOnFocusLost();
            formValidator.addField(phoneValidator);
        }

        if (emailField != null && emailErrorLabel != null) {
            emailValidator = FieldValidator.forField(emailField, emailErrorLabel)
                .email()
                .validateOnFocusLost();
            formValidator.addField(emailValidator);
        }
    }

    @Override
    protected void setFormEditable(boolean editable) {
        if (!editable) {
            // View mode - replace fields with labels
            if (nameField != null) replaceWithLabel(nameField);
            if (phoneField != null) replaceWithLabel(phoneField);
            if (emailField != null) replaceWithLabel(emailField);
            if (addressField != null) replaceWithLabel(addressField);
        } else {
            // Edit/Create mode - fields are already editable
            if (nameField != null) nameField.setEditable(true);
            if (phoneField != null) phoneField.setEditable(true);
            if (emailField != null) emailField.setEditable(true);
            if (addressField != null) addressField.setEditable(true);
        }
    }

    @Override
    protected void createEntity() throws Exception {
        customerService.createCustomer(
            nameField.getText().trim(),
            phoneField.getText().trim(),
            emailField.getText().trim(),
            addressField.getText().trim()
        );
    }

    @Override
    protected void updateEntity() throws Exception {
        customerService.updateCustomer(
            getEntityId(),
            nameField.getText().trim(),
            phoneField.getText().trim(),
            emailField.getText().trim(),
            addressField.getText().trim()
        );
    }
}
