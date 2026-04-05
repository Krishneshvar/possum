# Developer Guide: POSSUM Architecture Patterns

**Version**: 1.0  
**Last Updated**: Sprint 5  
**Audience**: Developers working on POSSUM codebase

---

## Table of Contents

1. [Overview](#overview)
2. [Controller Patterns](#controller-patterns)
3. [Validation Framework](#validation-framework)
4. [UI Components](#ui-components)
5. [Repository Patterns](#repository-patterns)
6. [Import Handlers](#import-handlers)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)

---

## Overview

POSSUM follows a clean architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (JavaFX)                     │
│  Controllers, Views, Components, Validation              │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  Services, Business Logic, Authorization                 │
├─────────────────────────────────────────────────────────┤
│                   Domain Layer                           │
│  Models, Entities, Value Objects                         │
├─────────────────────────────────────────────────────────┤
│                 Persistence Layer                        │
│  Repositories, Database Access, Mappers                  │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure                          │
│  Database, File System, External Services                │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **DRY (Don't Repeat Yourself)**: Use base classes and utilities
2. **Composition over Inheritance**: Favor composition where appropriate
3. **Declarative over Imperative**: Use declarative APIs (validation, builders)
4. **Consistent Patterns**: Follow established patterns across the codebase
5. **Type Safety**: Leverage Java's type system with generics

---

## Controller Patterns

### List Controllers (CRUD)

**Use**: AbstractCrudController<T, F> for list/table views with CRUD operations.

**Example**:
```java
public class CustomersController extends AbstractCrudController<Customer, CustomerFilter> {
    
    @Override
    protected void setupPermissions() {
        // Setup button permissions and icons
    }
    
    @Override
    protected void setupTable() {
        // Configure table columns
    }
    
    @Override
    protected void setupFilters() {
        // Setup filter controls
    }
    
    @Override
    protected CustomerFilter buildFilter() {
        // Build filter from UI controls
        return new CustomerFilter(searchTerm, page, limit);
    }
    
    @Override
    protected PagedResult<Customer> fetchData(CustomerFilter filter) {
        // Fetch data from service/repository
        return customerRepository.findCustomers(filter);
    }
    
    @Override
    protected String getEntityName() {
        return "customers";
    }
    
    @Override
    protected List<MenuItem> buildActionMenu(Customer entity) {
        // Build context menu for entity
        return MenuBuilder.create()
            .addViewAction(() -> handleView(entity))
            .addEditAction(() -> handleEdit(entity))
            .addDeleteAction(() -> handleDelete(entity))
            .build();
    }
    
    @Override
    protected void deleteEntity(Customer entity) throws Exception {
        customerRepository.softDeleteCustomer(entity.id());
    }
    
    @Override
    protected String getEntityIdentifier(Customer entity) {
        return entity.name();
    }
}
```

**Benefits**:
- Automatic pagination handling
- Consistent refresh/delete logic
- Built-in error handling
- Reduced boilerplate

---

### Form Controllers (Create/Edit/View)

**Use**: AbstractFormController<T> for form views with CREATE/EDIT/VIEW modes.

**Example**:
```java
public class CustomerFormController extends AbstractFormController<Customer> {
    
    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    
    public CustomerFormController(CustomerRepository repository, WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.repository = repository;
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
    protected Customer loadEntity(Long id) throws Exception {
        return repository.findCustomerById(id)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
    }
    
    @Override
    protected void populateFields(Customer customer) {
        nameField.setText(customer.name());
        phoneField.setText(customer.phone());
        emailField.setText(customer.email());
    }
    
    @Override
    protected void setupValidators() {
        FieldValidator.of(nameField)
            .addValidator(Validators.required("Name is required"))
            .validateOnFocusLost();
        
        FieldValidator.of(phoneField)
            .addValidator(Validators.phone())
            .validateOnFocusLost();
        
        FieldValidator.of(emailField)
            .addValidator(Validators.email())
            .validateOnFocusLost();
    }
    
    @Override
    protected Customer createEntity() throws Exception {
        return repository.insertCustomer(
            nameField.getText(),
            phoneField.getText(),
            emailField.getText(),
            addressField.getText()
        ).orElseThrow();
    }
    
    @Override
    protected Customer updateEntity(Long id, Customer existing) throws Exception {
        return repository.updateCustomerById(
            id,
            nameField.getText(),
            phoneField.getText(),
            emailField.getText(),
            addressField.getText()
        ).orElseThrow();
    }
    
    @Override
    protected void setFormEditable(boolean editable) {
        nameField.setEditable(editable);
        phoneField.setEditable(editable);
        emailField.setEditable(editable);
    }
}
```

**Benefits**:
- Automatic mode detection (CREATE/EDIT/VIEW)
- Automatic validation integration
- Automatic read-only conversion for VIEW mode
- Consistent save/cancel handling
- Built-in error handling

---

## Validation Framework

### Field Validation

**Use**: FieldValidator for declarative field validation with automatic error display.

**Example**:
```java
@Override
protected void setupValidators() {
    // Required field
    FieldValidator.of(nameField)
        .addValidator(Validators.required("Name is required"))
        .validateOnFocusLost();
    
    // Multiple validators
    FieldValidator.of(usernameField)
        .addValidator(Validators.required("Username is required"))
        .addValidator(Validators.minLength(3, "Username must be at least 3 characters"))
        .addValidator(Validators.noSpaces("Username cannot contain spaces"))
        .validateOnFocusLost();
    
    // Pattern validation
    FieldValidator.of(phoneField)
        .addValidator(Validators.pattern("[+0-9()\\-\\s]{7,20}", "Invalid phone format"))
        .validateOnFocusLost();
    
    // Email validation
    FieldValidator.of(emailField)
        .addValidator(Validators.email())
        .validateOnFocusLost();
    
    // Numeric validation
    FieldValidator.of(priceField)
        .addValidator(Validators.positiveDecimal("Price must be positive"))
        .validateOnFocusLost();
    
    // ComboBox validation
    FieldValidator.of(statusCombo)
        .addValidator(Validators.notNull("Status is required"))
        .validateOnFocusLost();
    
    // Custom validation
    FieldValidator.of(passwordField)
        .addValidator(Validators.custom(
            value -> value.length() >= 8,
            "Password must be at least 8 characters"
        ))
        .validateOnFocusLost();
}
```

**Available Validators**:
- `required(message)` - Field must not be empty
- `minLength(length, message)` - Minimum string length
- `maxLength(length, message)` - Maximum string length
- `pattern(regex, message)` - Regex pattern match
- `email()` - Valid email format
- `phone()` - Valid phone format
- `noSpaces(message)` - No whitespace allowed
- `range(min, max, message)` - Numeric range
- `positive(message)` - Positive integer
- `nonNegative(message)` - Non-negative integer
- `positiveDecimal(message)` - Positive decimal
- `nonNegativeDecimal(message)` - Non-negative decimal
- `notNull(message)` - Not null (for ComboBox)
- `custom(predicate, message)` - Custom validation logic

**Benefits**:
- Automatic error display on validation failure
- Automatic error clearing when valid
- Focus-lost validation for better UX
- Reusable validators
- Consistent error styling

---

## UI Components

### ButtonFactory

**Use**: Create consistent styled buttons across the application.

**Example**:
```java
// Primary action button
Button saveBtn = ButtonFactory.createPrimaryButton("Save", "bx-save", this::handleSave);

// Secondary button
Button cancelBtn = ButtonFactory.createSecondaryButton("Cancel", "bx-x", this::handleCancel);

// Icon-only button with tooltip
Button editBtn = ButtonFactory.createIconButton("bx-edit", "Edit", this::handleEdit);

// Destructive action
Button deleteBtn = ButtonFactory.createDestructiveButton("Delete", "bx-trash", this::handleDelete);

// Card action button
Button cardEditBtn = ButtonFactory.createCardActionButton("bx-edit", this::handleEdit);

// Table action button
Button tableEditBtn = ButtonFactory.createEditButton("Edit", this::handleEdit);

// Apply styling to existing button
ButtonFactory.applyAddButtonStyle(addButton);
ButtonFactory.applyRefreshButtonStyle(refreshButton);
```

**Benefits**:
- Consistent button styling
- Automatic icon setup
- Consistent cursor handling
- Reduced boilerplate

---

### BadgeFactory

**Use**: Create consistent status badges across the application.

**Example**:
```java
// Status badge (auto-styled based on status)
Label badge = BadgeFactory.createStatusBadge("active");

// Product status badge
Label productBadge = BadgeFactory.createProductStatusBadge("in_stock");

// User status badge
Label userBadge = BadgeFactory.createUserStatusBadge(true); // active

// Custom styled badges
Label successBadge = BadgeFactory.createSuccessBadge("Completed");
Label warningBadge = BadgeFactory.createWarningBadge("Pending");
Label errorBadge = BadgeFactory.createErrorBadge("Failed");

// Count badge
Label countBadge = BadgeFactory.createCountBadge(42);
```

**Benefits**:
- Consistent badge styling
- Automatic color coding
- Reduced CSS duplication

---

### MenuBuilder

**Use**: Build context menus with fluent API.

**Example**:
```java
ContextMenu menu = MenuBuilder.create()
    .addViewAction(() -> handleView(entity))
    .addEditAction(() -> handleEdit(entity))
    .addSeparator()
    .addDeleteAction(() -> handleDelete(entity))
    .addItem("Custom Action", "bx-star", () -> handleCustom(entity))
    .build();

// Apply to control
control.setContextMenu(menu);
```

**Benefits**:
- Consistent menu structure
- Automatic icon setup
- Fluent API for readability

---

### TextFormatter

**Use**: Format text consistently across the application.

**Example**:
```java
// Title case
String title = TextFormatter.toTitleCase("hello world"); // "Hello World"

// Format status
String status = TextFormatter.formatStatus("active"); // "Active"

// Initials
String initials = TextFormatter.initials("John Doe"); // "JD"

// Capitalize
String cap = TextFormatter.capitalize("hello"); // "Hello"

// Truncate
String truncated = TextFormatter.truncate("Long text here", 10); // "Long te..."

// Camel case to words
String words = TextFormatter.camelCaseToWords("firstName"); // "First Name"

// Format numbers
String number = TextFormatter.formatNumber(1234567); // "1,234,567"
String decimal = TextFormatter.formatDecimal(1234.56); // "1,234.56"
```

**Benefits**:
- Consistent text formatting
- Reduced duplicate formatting logic
- Locale-aware formatting

---

## Repository Patterns

### UpdateBuilder

**Use**: Build dynamic UPDATE statements with only non-null fields.

**Example**:
```java
@Override
public int updateCustomer(long id, Customer customer) {
    UpdateBuilder builder = new UpdateBuilder("customers")
            .set("name", customer.name())
            .set("phone", customer.phone())
            .set("email", customer.email())
            .set("address", customer.address())
            .where("id = ? AND deleted_at IS NULL", id);
    
    return executeUpdate(builder.getSql(), builder.getParams());
}
```

**Benefits**:
- Only updates non-null fields
- Automatic updated_at handling
- Automatic parameter collection
- Type-safe fluent API

---

### WhereBuilder

**Use**: Build dynamic WHERE clauses with search and filters.

**Example**:
```java
@Override
public PagedResult<Customer> findCustomers(CustomerFilter filter) {
    WhereBuilder whereBuilder = new WhereBuilder()
            .addNotDeleted()
            .addSearch(filter.searchTerm(), "name", "email", "phone")
            .addIn("status", filter.statuses())
            .addCondition("created_at >= ?", filter.startDate());
    
    String where = whereBuilder.build();
    List<Object> params = new ArrayList<>(whereBuilder.getParams());
    
    int total = count("customers", where, params.toArray());
    
    // ... rest of query
}
```

**Benefits**:
- Consistent WHERE clause building
- Automatic parameter collection
- Support for search, IN clauses, custom conditions
- Automatic deleted_at filtering

---

### Helper Methods

**Use**: Common repository operations.

**Example**:
```java
// Soft delete
@Override
public boolean deleteCustomer(long id) {
    return softDelete("customers", id) > 0;
}

// Count records
int total = count("customers", "WHERE deleted_at IS NULL");

// Parse datetime
LocalDateTime created = parseDateTime(rs.getString("created_at"));

// Boolean to int
int active = boolToInt(user.active(), true);
```

**Benefits**:
- Consistent soft delete pattern
- Consistent datetime parsing
- Consistent boolean handling
- Reduced boilerplate

---

## Import Handlers

### AbstractImportController

**Use**: Handle CSV imports with progress tracking.

**Example**:
```java
private class ImportHandler extends AbstractImportController<Customer, CustomerImportRow> {
    
    @Override
    protected String[] getRequiredHeaders() {
        return new String[]{"Name", "Phone", "Email"};
    }
    
    @Override
    protected CustomerImportRow parseRow(List<String> row, Map<String, Integer> headers) {
        String name = CsvImportUtil.getValue(row, headers, "Name");
        String phone = CsvImportUtil.getValue(row, headers, "Phone");
        String email = CsvImportUtil.getValue(row, headers, "Email");
        return new CustomerImportRow(name, phone, email);
    }
    
    @Override
    protected Customer createEntity(CustomerImportRow data) throws Exception {
        return customerRepository.insertCustomer(
            data.name(),
            data.phone(),
            data.email(),
            null
        ).orElseThrow();
    }
    
    @Override
    protected String getImportTitle() {
        return "Import Customers from CSV";
    }
    
    @Override
    protected String getEntityName() {
        return "customer(s)";
    }
    
    @Override
    protected void onImportComplete() {
        loadData(); // Refresh list
    }
}

private record CustomerImportRow(String name, String phone, String email) {}
```

**Benefits**:
- Automatic progress tracking
- Automatic error handling
- Consistent import UI
- Batch processing support

---

## Best Practices

### 1. Controller Design

✅ **DO**:
- Extend AbstractCrudController for list views
- Extend AbstractFormController for form views
- Use dependency injection via constructor
- Keep controllers thin - delegate to services
- Use template methods for customization

❌ **DON'T**:
- Put business logic in controllers
- Access repositories directly (use services)
- Duplicate code across controllers
- Mix UI and business logic

### 2. Validation

✅ **DO**:
- Use FieldValidator for all form validation
- Validate on focus lost for better UX
- Use pre-built validators from Validators class
- Provide clear, user-friendly error messages

❌ **DON'T**:
- Validate in save handlers
- Show validation errors on page load
- Use generic error messages
- Duplicate validation logic

### 3. UI Components

✅ **DO**:
- Use ButtonFactory for all buttons
- Use BadgeFactory for all status badges
- Use MenuBuilder for all context menus
- Use TextFormatter for all text formatting

❌ **DON'T**:
- Create buttons manually with icons
- Duplicate badge styling
- Build menus manually
- Duplicate formatting logic

### 4. Repository Design

✅ **DO**:
- Use UpdateBuilder for dynamic updates
- Use WhereBuilder for dynamic WHERE clauses
- Use helper methods (softDelete, count, parseDateTime)
- Return Optional for single results
- Use PagedResult for paginated queries

❌ **DON'T**:
- Build SQL strings manually
- Duplicate WHERE clause logic
- Duplicate UPDATE logic
- Return null for missing results

### 5. Error Handling

✅ **DO**:
- Use NotificationService for user feedback
- Catch specific exceptions
- Provide meaningful error messages
- Log errors for debugging

❌ **DON'T**:
- Swallow exceptions silently
- Show stack traces to users
- Use generic error messages
- Ignore validation errors

---

## Common Pitfalls

### 1. Forgetting to Call Super Methods

```java
// ❌ WRONG
@Override
public void initialize() {
    setupTable();
    loadData();
}

// ✅ CORRECT
@Override
public void initialize() {
    super.initialize(); // Calls base class initialization
    // Additional initialization
}
```

### 2. Not Using Validators

```java
// ❌ WRONG
@FXML
private void handleSave() {
    if (nameField.getText().isEmpty()) {
        showError("Name is required");
        return;
    }
    // ...
}

// ✅ CORRECT
@Override
protected void setupValidators() {
    FieldValidator.of(nameField)
        .addValidator(Validators.required("Name is required"))
        .validateOnFocusLost();
}
```

### 3. Manual SQL Building

```java
// ❌ WRONG
StringBuilder sql = new StringBuilder("UPDATE customers SET updated_at = CURRENT_TIMESTAMP");
List<Object> params = new ArrayList<>();
if (name != null) {
    sql.append(", name = ?");
    params.add(name);
}
// ...

// ✅ CORRECT
UpdateBuilder builder = new UpdateBuilder("customers")
        .set("name", name)
        .set("phone", phone)
        .where("id = ?", id);
executeUpdate(builder.getSql(), builder.getParams());
```

### 4. Duplicate Button Creation

```java
// ❌ WRONG
Button editBtn = new Button("Edit");
FontIcon icon = new FontIcon("bx-edit");
icon.setIconSize(14);
editBtn.setGraphic(icon);
editBtn.getStyleClass().add("btn-edit-action");

// ✅ CORRECT
Button editBtn = ButtonFactory.createEditButton("Edit", this::handleEdit);
```

### 5. Not Using WhereBuilder

```java
// ❌ WRONG
StringBuilder where = new StringBuilder("WHERE deleted_at IS NULL");
List<Object> params = new ArrayList<>();
if (searchTerm != null) {
    where.append(" AND (name LIKE ? OR email LIKE ?)");
    params.add("%" + searchTerm + "%");
    params.add("%" + searchTerm + "%");
}

// ✅ CORRECT
WhereBuilder whereBuilder = new WhereBuilder()
        .addNotDeleted()
        .addSearch(searchTerm, "name", "email");
String where = whereBuilder.build();
List<Object> params = whereBuilder.getParams();
```

---

## Quick Reference

### Controller Hierarchy
```
AbstractCrudController<T, F>
├── CustomersController
├── UsersController
├── ProductsController
├── SuppliersController
├── TransactionsController
└── CategoriesController

AbstractFormController<T>
├── CustomerFormController
├── UserFormController
└── SupplierFormController

AbstractImportController<T, R>
└── (Inner classes in list controllers)
```

### Utility Classes
```
com.possum.ui.common.validation
├── Validators (pre-built validators)
├── FieldValidator (field validation)
└── FormValidator (form validation)

com.possum.ui.common.components
├── ButtonFactory (button creation)
├── BadgeFactory (badge creation)
└── MenuBuilder (menu building)

com.possum.shared.util
├── TextFormatter (text formatting)
└── StatusStyleMapper (status styling)

com.possum.persistence.repositories.sqlite
└── BaseSqliteRepository
    ├── UpdateBuilder
    ├── WhereBuilder
    └── Helper methods
```

---

## Getting Help

1. **Check this guide** for patterns and examples
2. **Review existing code** in refactored controllers
3. **Check Sprint summaries** for implementation details
4. **Ask the team** for clarification

---

**Last Updated**: Sprint 5  
**Maintained By**: Development Team
