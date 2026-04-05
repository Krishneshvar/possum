# POSSUM Code Refactoring Plan

**Goal:** Eliminate Duplication, Maximize Reusability, Reduce Coupling

## PHASE 1: Extract Common Controller Patterns (Foundation)
**Priority:** CRITICAL | **Estimated Impact:** HIGH

**Problem Identified:**
ProductsController, CustomersController, SuppliersController, UsersController, CategoriesController, and TransactionsController share 70-80% identical code.

Repeated patterns: table setup, filter setup, pagination, loading data, CRUD operations, import functionality.

**Solution: Create Abstract Base Controllers**

### 1.1 Create AbstractCrudController<T, F>
**Location:** `com.possum.ui.common.controllers.AbstractCrudController`

**Responsibilities:**
- Generic table setup with column configuration
- Pagination handling
- Filter bar integration
- Loading state management
- Standard CRUD operations (view, edit, delete)
- Permission checking

**Benefits:**
- Eliminates ~400 lines of duplicate code per controller
- Consistent behavior across all list views
- Single point of maintenance for common patterns

### 1.2 Create AbstractImportController<T, R>
**Location:** `com.possum.ui.common.controllers.AbstractImportController`

**Responsibilities:**
- CSV file selection dialog
- Import progress dialog management
- Background task execution with AuthContext propagation
- Header detection and mapping
- Record parsing and validation
- Success/failure notification

**Benefits:**
- Eliminates ~200 lines of duplicate import code per controller
- Consistent import UX across all entities
- Centralized error handling

### 1.3 Refactor Existing Controllers
Convert these controllers to extend base classes:
- ProductsController → extends `AbstractCrudController<Product, ProductFilter>` + `AbstractImportController`
- CustomersController → extends `AbstractCrudController<Customer, CustomerFilter>` + `AbstractImportController`
- SuppliersController → extends `AbstractCrudController<Supplier, SupplierFilter>`
- UsersController → extends `AbstractCrudController<User, UserFilter>`
- CategoriesController → extends `AbstractCrudController<Category, CategoryFilter>` + `AbstractImportController`
- TransactionsController → extends `AbstractCrudController<Transaction, TransactionFilter>`

**Expected Reduction:** 60-70% code reduction in each controller

## PHASE 2: Extract Common Form Patterns
**Priority:** HIGH | **Estimated Impact:** HIGH

**Problem Identified:**
UserFormController, CustomerFormController, ProductFormController share identical patterns:
- Parameter handling (view/edit/create modes)
- Field validation logic
- Save/cancel operations
- Read-only mode conversion (replaceFieldWithLabel)
- Error display mechanisms

**Solution: Create Abstract Form Controller**

### 2.1 Create AbstractFormController<T>
**Location:** `com.possum.ui.common.controllers.AbstractFormController`

**Responsibilities:**
- Mode detection (view/edit/create)
- Generic parameter handling via Parameterizable
- Field validation framework
- Error display/clearing utilities
- Save/cancel workflow
- Read-only mode conversion
- Loading entity details

**Key Methods:**
```java
protected abstract void loadEntityDetails(Long id, boolean isViewMode);
protected abstract void validateInputs() throws ValidationException;
protected abstract void saveEntity() throws Exception;
protected abstract void populateFields(T entity);
protected void replaceFieldWithLabel(Control field, String text);
protected void showFieldError(Control control, Label errorLabel, String message);
protected void clearFieldError(Control control, Label errorLabel);
```

### 2.2 Create ValidationFramework
**Location:** `com.possum.ui.common.validation.ValidationFramework`

**Components:**
- Validator interface
- ValidationRule class
- ValidationResult class
- Pre-built validators: RequiredValidator, EmailValidator, PhoneValidator, RangeValidator, PatternValidator

**Benefits:**
- Declarative validation instead of imperative
- Reusable validation rules
- Consistent error messages

### 2.3 Refactor Form Controllers
- UserFormController → extends `AbstractFormController<User>`
- CustomerFormController → extends `AbstractFormController<Customer>`
- ProductFormController → extends `AbstractFormController<Product>` (with variant handling as override)

**Expected Reduction:** 50-60% code reduction in form controllers

## PHASE 3: Consolidate Repeated UI Utilities
**Priority:** HIGH | **Estimated Impact:** MEDIUM

**Problem Identified:**
- Status badge rendering duplicated in multiple controllers
- Icon button creation repeated
- Menu building patterns duplicated
- Card rendering logic duplicated (ProductsController has unique card view)

**Solution: Create Reusable UI Components**

### 3.1 Create BadgeFactory
**Location:** `com.possum.ui.common.components.BadgeFactory`
```java
public static Label createStatusBadge(String status);
public static Label createBadge(String text, BadgeStyle style);
```

### 3.2 Create ButtonFactory
**Location:** `com.possum.ui.common.components.ButtonFactory`
```java
public static Button createIconButton(String iconCode, Runnable action);
public static Button createActionButton(String text, String iconCode, Runnable action);
public static Button createMenuButton(String text, Function<T, List<MenuItem>> menuBuilder);
```

### 3.3 Create MenuBuilder
**Location:** `com.possum.ui.common.components.MenuBuilder`
```java
public MenuBuilder addViewAction(String label, Runnable action);
public MenuBuilder addEditAction(String label, Runnable action);
public MenuBuilder addDeleteAction(String label, Runnable action);
public MenuBuilder addSeparator();
public List<MenuItem> build();
```

### 3.4 Create CardViewFactory<T>
**Location:** `com.possum.ui.common.components.CardViewFactory`

- Generic card rendering for grid views (currently only in ProductsController but should be reusable)

**Benefits:**
- Eliminates ~100 lines of duplicate UI code per controller
- Consistent visual appearance
- Easy theme changes

## PHASE 4: Unify CSV Import Logic
**Priority:** MEDIUM | **Estimated Impact:** HIGH

**Problem Identified:**
- Import logic in ProductsController, CustomersController, CategoriesController is 90% identical
- Only differs in: header detection, field mapping, entity creation
- All use same CsvImportUtil, ImportProgressDialog, AuthContext handling

**Solution: Create Generic Import Service**

### 4.1 Create CsvImportService<T, R>
**Location:** `com.possum.application.common.CsvImportService`

**Responsibilities:**
- Generic CSV import workflow
- Progress tracking
- Error collection
- Transaction management

**Key Interface:**
```java
public interface ImportMapper<T, R> {
    String[] getRequiredHeaders();
    R parseRow(List<String> row, Map<String, Integer> headers);
    T createEntity(R record) throws Exception;
}
```

### 4.2 Create Specific Mappers
- ProductImportMapper implements `ImportMapper<Product, ProductImportRow>`
- CustomerImportMapper implements `ImportMapper<Customer, CustomerImportRow>`
- CategoryImportMapper implements `ImportMapper<Category, CategoryImportRow>`

**Benefits:**
- Single import workflow implementation
- Consistent error handling
- Easy to add new importable entities
- Testable in isolation

## PHASE 5: Extract Repository Patterns
**Priority:** MEDIUM | **Estimated Impact:** MEDIUM

**Problem Identified:**
- All SQLite repositories extend BaseSqliteRepository ✓ (Good!)
- But filtering, pagination, sorting logic is duplicated across repositories
- Common query patterns repeated

**Solution: Enhance Base Repository**

### 5.1 Create GenericQueryBuilder
**Location:** `com.possum.persistence.repositories.sqlite.GenericQueryBuilder`

**Responsibilities:**
- Build dynamic WHERE clauses from filters
- Handle pagination (LIMIT/OFFSET)
- Handle sorting (ORDER BY)
- Parameter binding

### 5.2 Create PagedQueryExecutor
**Location:** `com.possum.persistence.repositories.sqlite.PagedQueryExecutor`

**Responsibilities:**
- Execute paged queries
- Count total records
- Return `PagedResult<T>`

### 5.3 Enhance BaseSqliteRepository
Add methods:
```java
protected <T> PagedResult<T> executePagedQuery(
    String baseQuery,
    FilterSpec filter,
    RowMapper<T> mapper
);
```

**Benefits:**
- Eliminates duplicate query building logic
- Consistent pagination behavior
- Easier to optimize (e.g., query caching)

## PHASE 6: Consolidate Validation Logic
**Priority:** MEDIUM | **Estimated Impact:** MEDIUM

**Problem Identified:**
- Validation scattered across form controllers
- Similar validation rules duplicated (required fields, email, phone)
- No consistent validation feedback

**Solution: Centralized Validation System**

### 6.1 Create FieldValidator
**Location:** `com.possum.ui.common.validation.FieldValidator`

**Features:**
- Fluent API for validation rules
- Automatic error label management
- Real-time validation on focus loss

**Usage Example:**
```java
FieldValidator.forField(nameField, nameErrorLabel)
    .required("Name is required")
    .minLength(3, "Name must be at least 3 characters")
    .validate();
```

### 6.2 Create FormValidator
**Location:** `com.possum.ui.common.validation.FormValidator`

**Features:**
- Validate entire form
- Collect all errors
- Focus first invalid field

**Benefits:**
- Declarative validation
- Consistent error messages
- Reduced boilerplate

## PHASE 7: Extract Common Dialog Patterns
**Priority:** LOW | **Estimated Impact:** LOW

**Problem Identified:**
- Confirmation dialogs repeated across controllers
- Similar dialog styling applied everywhere

**Solution: Dialog Utilities**

### 7.1 Create DialogFactory
**Location:** `com.possum.ui.common.dialogs.DialogFactory`
```java
public static Optional<ButtonType> confirmDelete(String entityName);
public static Optional<ButtonType> confirmAction(String title, String message);
public static void showError(String title, String message);
public static void showInfo(String title, String message);
```

**Benefits:**
- Consistent dialog appearance
- Reduced boilerplate
- Easy to add analytics/logging

## PHASE 8: Reduce Coupling in Workspace Management
**Priority:** LOW | **Estimated Impact:** MEDIUM

**Problem Identified:**
- Controllers tightly coupled to WorkspaceManager
- Direct FXML path references scattered everywhere
- Hard to refactor view locations

**Solution: Route Registry Enhancement**

### 8.1 Enhance RouteRegistry
**Location:** `com.possum.ui.navigation.RouteRegistry`

Add route definitions:
```java
public static final Route PRODUCT_FORM = Route.of("product-form", "/fxml/products/product-form-view.fxml");
public static final Route CUSTOMER_FORM = Route.of("customer-form", "/fxml/people/customer-form-view.fxml");
```

### 8.2 Create NavigationService
**Location:** `com.possum.ui.navigation.NavigationService`

**Responsibilities:**
- Route-based navigation
- Parameter passing
- Window lifecycle management

**Usage:**
```java
navigationService.navigate(RouteRegistry.PRODUCT_FORM)
    .withParam("productId", id)
    .withParam("mode", "edit")
    .open();
```

**Benefits:**
- Decoupled from FXML paths
- Type-safe navigation
- Easy to refactor views

## PHASE 9: Consolidate Status/Type Formatting
**Priority:** LOW | **Estimated Impact:** LOW

**Problem Identified:**
- formatStatus(), toTitleCase() methods duplicated
- Status-to-badge-style mapping repeated

**Solution: Formatting Utilities**

### 9.1 Create TextFormatter
**Location:** `com.possum.shared.util.TextFormatter`
```java
public static String toTitleCase(String input);
public static String formatStatus(String status);
public static String initials(String name);
```

### 9.2 Create StatusStyleMapper
**Location:** `com.possum.ui.common.styles.StatusStyleMapper`
```java
public static String getStyleClass(String status);
```

**Benefits:**
- Single source of truth
- Consistent formatting
- Easy to change conventions

## PHASE 10: Extract Common Table Column Factories
**Priority:** LOW | **Estimated Impact:** LOW

**Problem Identified:**
- Status column rendering duplicated
- Date column formatting duplicated
- Action column creation duplicated

**Solution: Column Factory**

### 10.1 Create TableColumnFactory
**Location:** `com.possum.ui.common.components.TableColumnFactory`
```java
public static <T> TableColumn<T, String> createStatusColumn(Function<T, String> statusExtractor);
public static <T> TableColumn<T, LocalDateTime> createDateColumn(String title, Function<T, LocalDateTime> dateExtractor);
public static <T> TableColumn<T, BigDecimal> createCurrencyColumn(String title, Function<T, BigDecimal> amountExtractor);
```

**Benefits:**
- Consistent column appearance
- Reduced boilerplate
- Easy to add features (sorting, filtering)

## IMPLEMENTATION ORDER & DEPENDENCIES

```text
Phase 1 (AbstractCrudController) ← Foundation for everything
    ↓
Phase 2 (AbstractFormController) ← Depends on Phase 6 (Validation)
    ↓
Phase 3 (UI Components) ← Used by Phase 1 & 2
    ↓
Phase 4 (CSV Import Service) ← Depends on Phase 1
    ↓
Phase 5 (Repository Patterns) ← Independent, can run parallel
    ↓
Phase 6 (Validation) ← Used by Phase 2
    ↓
Phase 7 (Dialog Utilities) ← Used by Phase 1 & 2
    ↓
Phase 8 (Navigation) ← Refactoring existing code
    ↓
Phase 9 (Formatting) ← Used by Phase 3
    ↓
Phase 10 (Column Factories) ← Used by Phase 1
```

## RECOMMENDED EXECUTION SEQUENCE

**Sprint 1: Core Abstractions (Weeks 1-2)**
- Phase 6: Validation Framework (needed by Phase 2)
- Phase 9: Formatting Utilities (needed by Phase 3)
- Phase 3: UI Components (needed by Phase 1)

**Sprint 2: Controller Refactoring (Weeks 3-4)**
- Phase 1: AbstractCrudController + refactor 2 controllers (Products, Customers)
- Phase 2: AbstractFormController + refactor 2 forms (User, Customer)

**Sprint 3: Complete Controller Migration (Week 5)**
- Phase 1: Refactor remaining controllers (Suppliers, Users, Categories, Transactions)
- Phase 2: Refactor remaining form (Product)

**Sprint 4: Import & Repository (Week 6)**
- Phase 4: CSV Import Service
- Phase 5: Repository Patterns

**Sprint 5: Polish & Navigation (Week 7)**
- Phase 7: Dialog Utilities
- Phase 8: Navigation Service
- Phase 10: Column Factories

## EXPECTED OUTCOMES

**Code Reduction:**
- Controllers: 60-70% reduction (~2,000 lines eliminated)
- Forms: 50-60% reduction (~800 lines eliminated)
- UI Utilities: 40-50% reduction (~500 lines eliminated)
- Total: ~3,300 lines of duplicate code eliminated

**Maintainability:**
- Single point of change for common patterns
- Consistent behavior across all views
- Easier onboarding for new developers

**Testability:**
- Abstract classes can be unit tested
- Mock dependencies easily
- Test common behavior once

**Extensibility:**
- New CRUD views in <50 lines
- New forms in <100 lines
- New import entities in <30 lines

## RISK MITIGATION
- **Test Coverage:** Write tests for abstract classes before refactoring
- **Incremental Migration:** Refactor one controller at a time
- **Feature Flags:** Keep old code until new code is verified
- **Code Reviews:** Review each phase before proceeding
- **Rollback Plan:** Use Git branches for each phase

> This plan will transform POSSUM from a code-repetitive application to a highly maintainable, loosely coupled, and DRY (Don't Repeat Yourself) codebase ready for QA and production deployment.