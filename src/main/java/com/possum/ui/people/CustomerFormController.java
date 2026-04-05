package com.possum.ui.people;

import com.possum.application.people.CustomerService;
import com.possum.domain.model.Customer;
import com.possum.ui.common.controllers.AbstractFormController;
import com.possum.ui.common.validation.FieldValidator;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.util.List;

public class CustomerFormController extends AbstractFormController<Customer> {

    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextArea addressField;
    @FXML private ComboBox<String> customerTypeCombo;
    @FXML private CheckBox isTaxExemptCheckbox;

    @FXML private Label nameErrorLabel;
    @FXML private Label phoneErrorLabel;
    @FXML private Label emailErrorLabel;

    private static final List<String> CUSTOMER_TYPES =
            List.of("Retailer", "Wholesaler", "Government", "NGO", "Other");

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
        if (customerTypeCombo != null) {
            customerTypeCombo.getItems().setAll(CUSTOMER_TYPES);
            customerTypeCombo.setPromptText("Select type (optional)");
        }
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
        if (nameField != null) nameField.setText(customer.name());
        if (phoneField != null) phoneField.setText(customer.phone() != null ? customer.phone() : "");
        if (emailField != null) emailField.setText(customer.email() != null ? customer.email() : "");
        if (addressField != null) addressField.setText(customer.address() != null ? customer.address() : "");
        if (customerTypeCombo != null) customerTypeCombo.setValue(customer.customerType());
        if (isTaxExemptCheckbox != null) isTaxExemptCheckbox.setSelected(Boolean.TRUE.equals(customer.isTaxExempt()));
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
            if (nameField != null) replaceWithLabel(nameField);
            if (phoneField != null) replaceWithLabel(phoneField);
            if (emailField != null) replaceWithLabel(emailField);
            if (addressField != null) replaceWithLabel(addressField);
            if (customerTypeCombo != null) replaceWithLabel(customerTypeCombo);
            if (isTaxExemptCheckbox != null) isTaxExemptCheckbox.setDisable(true);
        } else {
            if (nameField != null) nameField.setEditable(true);
            if (phoneField != null) phoneField.setEditable(true);
            if (emailField != null) emailField.setEditable(true);
            if (addressField != null) addressField.setEditable(true);
            if (customerTypeCombo != null) customerTypeCombo.setDisable(false);
            if (isTaxExemptCheckbox != null) isTaxExemptCheckbox.setDisable(false);
        }
    }

    @Override
    protected void createEntity() throws Exception {
        customerService.createCustomer(
                nameField.getText().trim(),
                phoneField.getText().trim(),
                emailField.getText().trim(),
                addressField.getText().trim(),
                customerTypeCombo != null ? customerTypeCombo.getValue() : null,
                isTaxExemptCheckbox != null && isTaxExemptCheckbox.isSelected()
        );
    }

    @Override
    protected void updateEntity() throws Exception {
        customerService.updateCustomer(
                getEntityId(),
                nameField.getText().trim(),
                phoneField.getText().trim(),
                emailField.getText().trim(),
                addressField.getText().trim(),
                customerTypeCombo != null ? customerTypeCombo.getValue() : null,
                isTaxExemptCheckbox != null && isTaxExemptCheckbox.isSelected()
        );
    }
}
