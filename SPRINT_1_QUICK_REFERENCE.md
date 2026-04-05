# Sprint 1 Utilities - Quick Reference Guide

## TextFormatter

```java
import com.possum.shared.util.TextFormatter;

// Format status
String formatted = TextFormatter.formatStatus("active"); // "Active"

// Title case
String title = TextFormatter.toTitleCase("hello_world"); // "Hello World"

// Initials
String initials = TextFormatter.initials("John Doe"); // "JD"

// Capitalize
String cap = TextFormatter.capitalize("hello"); // "Hello"

// Truncate
String short = TextFormatter.truncate("Hello World", 8); // "Hello..."

// Format numbers
String num = TextFormatter.formatNumber(1000); // "1,000"
```

---

## StatusStyleMapper

```java
import com.possum.ui.common.styles.StatusStyleMapper;

// Get style class
String styleClass = StatusStyleMapper.getStyleClass("active"); // "badge-success"

// Apply to label
Label badge = new Label("Active");
StatusStyleMapper.applyStatusStyle(badge, "active");

// Product status
String productStyle = StatusStyleMapper.getProductStatusClass("discontinued"); // "badge-warning"

// User status
String userStyle = StatusStyleMapper.getUserStatusClass(true); // "badge-success"
```

---

## BadgeFactory

```java
import com.possum.ui.common.components.BadgeFactory;

// Status badge (auto-styled)
Label badge = BadgeFactory.createStatusBadge(product.status());

// Product status badge
Label productBadge = BadgeFactory.createProductStatusBadge("active");

// Specific style
Label successBadge = BadgeFactory.createSuccessBadge("Completed");
Label warningBadge = BadgeFactory.createWarningBadge("Pending");
Label errorBadge = BadgeFactory.createErrorBadge("Failed");

// Count badge
Label countBadge = BadgeFactory.createCountBadge(5);

// User status
Label userBadge = BadgeFactory.createUserStatusBadge(true); // "Active"
```

---

## ButtonFactory

```java
import com.possum.ui.common.components.ButtonFactory;

// Icon button with tooltip
Button editBtn = ButtonFactory.createEditButton(() -> handleEdit(entity));
Button deleteBtn = ButtonFactory.createDeleteButton(() -> handleDelete(entity));
Button viewBtn = ButtonFactory.createViewButton(() -> handleView(entity));

// Add button
Button addBtn = ButtonFactory.createAddButton("Add Product", () -> handleAdd());

// Refresh button
Button refreshBtn = ButtonFactory.createRefreshButton(() -> loadData());

// Import/Export
Button importBtn = ButtonFactory.createImportButton(() -> handleImport());
Button exportBtn = ButtonFactory.createExportButton(() -> handleExport());

// Custom button
Button customBtn = ButtonFactory.createButton("Save", "bx-save", () -> handleSave());

// Primary/Secondary
Button primaryBtn = ButtonFactory.createPrimaryButton("Submit", "bx-check", () -> submit());
Button secondaryBtn = ButtonFactory.createSecondaryButton("Cancel", null, () -> cancel());

// Card action buttons
Button cardEditBtn = ButtonFactory.createCardActionButton("bx-edit", () -> handleEdit(entity));
Button cardDeleteBtn = ButtonFactory.createDestructiveCardActionButton("bx-trash", () -> handleDelete(entity));
```

---

## MenuBuilder

```java
import com.possum.ui.common.components.MenuBuilder;

// Build action menu
List<MenuItem> menu = MenuBuilder.create()
    .addViewAction("View Details", () -> handleView(entity))
    .addEditAction("Edit Product", () -> handleEdit(entity))
    .addSeparator()
    .addDeleteAction("Delete Product", () -> handleDelete(entity))
    .build();

// Custom items
List<MenuItem> customMenu = MenuBuilder.create()
    .addItem("bx-copy", "Duplicate", () -> handleDuplicate(entity))
    .addItem("bx-archive", "Archive", () -> handleArchive(entity))
    .addSeparator()
    .addItem("Custom Action", () -> handleCustom(entity))
    .build();

// In controller
@Override
protected List<MenuItem> buildActionMenu(Product product) {
    return MenuBuilder.create()
        .addViewAction("View Details", () -> handleView(product))
        .addEditAction("Edit Product", () -> handleEdit(product))
        .addSeparator()
        .addDeleteAction("Delete Product", () -> handleDelete(product))
        .build();
}
```

---

## Validation Framework

### Basic Validation

```java
import com.possum.ui.common.validation.*;

// Create field validator
FieldValidator<String> nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
    .required("Name")
    .minLength(3, "Name")
    .maxLength(50, "Name")
    .validateOnFocusLost();

// Validate manually
if (!nameValidator.validate()) {
    return; // Error shown automatically
}
```

### Email Validation

```java
FieldValidator<String> emailValidator = FieldValidator.forField(emailField, emailErrorLabel)
    .email()
    .validateOnFocusLost();
```

### Phone Validation

```java
FieldValidator<String> phoneValidator = FieldValidator.forField(phoneField, phoneErrorLabel)
    .phone()
    .validateOnFocusLost();
```

### Username Validation

```java
FieldValidator<String> usernameValidator = FieldValidator.forField(usernameField, usernameErrorLabel)
    .required("Username")
    .minLength(3, "Username")
    .noSpaces("Username")
    .validateOnFocusLost();
```

### ComboBox Validation

```java
FieldValidator<String> statusValidator = FieldValidator.forField(statusCombo, statusErrorLabel)
    .notNull("Status")
    .validateOnFocusLost();
```

### Custom Validation

```java
FieldValidator<String> customValidator = FieldValidator.forField(field, errorLabel)
    .custom(value -> value != null && value.startsWith("POS"), "Must start with POS")
    .validateOnFocusLost();
```

### Form Validation

```java
// Setup validators
FieldValidator<String> nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
    .required("Name")
    .minLength(3, "Name");

FieldValidator<String> emailValidator = FieldValidator.forField(emailField, emailErrorLabel)
    .email();

FieldValidator<String> phoneValidator = FieldValidator.forField(phoneField, phoneErrorLabel)
    .phone();

// Create form validator
FormValidator formValidator = new FormValidator()
    .addField(nameValidator)
    .addField(emailValidator)
    .addField(phoneValidator);

// Validate entire form
@FXML
private void handleSave() {
    if (!formValidator.validate()) {
        NotificationService.warning("Please fix the highlighted fields");
        return;
    }
    
    // Proceed with save...
}
```

### Using Pre-built Validators

```java
import com.possum.ui.common.validation.Validators;

// String validators
Validator<String> required = Validators.required("Field name");
Validator<String> minLen = Validators.minLength(3, "Field name");
Validator<String> maxLen = Validators.maxLength(50, "Field name");
Validator<String> email = Validators.email();
Validator<String> phone = Validators.phone();
Validator<String> noSpaces = Validators.noSpaces("Field name");

// Number validators
Validator<Integer> positive = Validators.positive("Field name");
Validator<Integer> nonNegative = Validators.nonNegative("Field name");
Validator<Integer> range = Validators.range(1, 100, "Field name");

// BigDecimal validators
Validator<BigDecimal> positiveDecimal = Validators.positiveDecimal("Price");
Validator<BigDecimal> nonNegativeDecimal = Validators.nonNegativeDecimal("Amount");

// Generic validators
Validator<Object> notNull = Validators.notNull("Field name");
Validator<String> custom = Validators.custom(
    value -> value.matches("[A-Z]{3}"), 
    "Must be 3 uppercase letters"
);

// Chain validators
Validator<String> combined = Validators.required("Name")
    .and(Validators.minLength(3, "Name"))
    .and(Validators.maxLength(50, "Name"));
```

---

## Migration Examples

### Before (Old Way):

```java
// Badge creation
Label badge = new Label(formatStatus(status));
badge.getStyleClass().addAll("badge", "badge-status");
applyStatusClass(badge, status);

// Button creation
Button editBtn = new Button();
FontIcon icon = new FontIcon("bx-edit");
icon.setIconSize(16);
editBtn.setGraphic(icon);
editBtn.setTooltip(new Tooltip("Edit"));
editBtn.setOnAction(e -> handleEdit(entity));

// Menu creation
List<MenuItem> items = new ArrayList<>();
MenuItem viewItem = new MenuItem("View");
FontIcon viewIcon = new FontIcon("bx-show");
viewIcon.setIconSize(14);
viewItem.setGraphic(viewIcon);
viewItem.setOnAction(e -> handleView(entity));
items.add(viewItem);
// ... 15 more lines ...

// Validation
if (nameField.getText() == null || nameField.getText().trim().isEmpty()) {
    nameErrorLabel.setText("Name is required");
    nameErrorLabel.setVisible(true);
    nameField.getStyleClass().add("input-error");
    return;
}
// ... 20 more lines ...
```

### After (New Way):

```java
// Badge creation
Label badge = BadgeFactory.createStatusBadge(status);

// Button creation
Button editBtn = ButtonFactory.createEditButton(() -> handleEdit(entity));

// Menu creation
List<MenuItem> items = MenuBuilder.create()
    .addViewAction("View", () -> handleView(entity))
    .addEditAction("Edit", () -> handleEdit(entity))
    .addDeleteAction("Delete", () -> handleDelete(entity))
    .build();

// Validation
FieldValidator<String> nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
    .required("Name")
    .minLength(3, "Name")
    .validateOnFocusLost();

if (!nameValidator.validate()) {
    return;
}
```

---

## Tips

1. **Always use factories** - Don't create badges/buttons manually anymore
2. **Validate on focus lost** - Better UX than validating on every keystroke
3. **Chain validators** - Use fluent API for multiple rules
4. **Use MenuBuilder** - Consistent menu appearance
5. **Leverage TextFormatter** - Don't duplicate formatting logic

---

## Common Patterns

### Status Column in Table:

```java
statusCol.setCellFactory(col -> new TableCell<>() {
    @Override
    protected void updateItem(String status, boolean empty) {
        super.updateItem(status, empty);
        if (empty || status == null) {
            setGraphic(null);
        } else {
            setGraphic(BadgeFactory.createStatusBadge(status));
        }
    }
});
```

### Card Actions:

```java
Button viewBtn = ButtonFactory.createCardActionButton("bx-show", () -> handleView(product));
viewBtn.setTooltip(new Tooltip("View Details"));

Button editBtn = ButtonFactory.createCardActionButton("bx-edit", () -> handleEdit(product));
editBtn.setTooltip(new Tooltip("Edit"));

Button deleteBtn = ButtonFactory.createDestructiveCardActionButton("bx-trash", () -> handleDelete(product));
deleteBtn.setTooltip(new Tooltip("Delete"));
```

### Form with Validation:

```java
@FXML
public void initialize() {
    // Setup validators
    nameValidator = FieldValidator.forField(nameField, nameErrorLabel)
        .required("Name")
        .minLength(3, "Name")
        .validateOnFocusLost();
    
    emailValidator = FieldValidator.forField(emailField, emailErrorLabel)
        .email()
        .validateOnFocusLost();
    
    formValidator = new FormValidator()
        .addField(nameValidator)
        .addField(emailValidator);
}

@FXML
private void handleSave() {
    if (!formValidator.validate()) {
        NotificationService.warning("Please fix the highlighted fields");
        return;
    }
    // Save logic...
}
```

---

That's it! Use these utilities to write cleaner, more maintainable code.
