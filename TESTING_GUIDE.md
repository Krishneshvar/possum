# Testing Guide: POSSUM Application

**Version**: 1.0  
**Last Updated**: Sprint 5  
**Purpose**: Comprehensive testing preparation for refactored codebase

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Scenarios](#test-scenarios)
3. [Controller Testing](#controller-testing)
4. [Repository Testing](#repository-testing)
5. [Validation Testing](#validation-testing)
6. [Integration Testing](#integration-testing)
7. [Manual Testing Checklist](#manual-testing-checklist)

---

## Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │   Manual    │  (10%)
        │   Testing   │
        ├─────────────┤
        │ Integration │  (20%)
        │   Testing   │
        ├─────────────┤
        │    Unit     │  (70%)
        │   Testing   │
        └─────────────┘
```

### Test Coverage Goals

- **Unit Tests**: 70% coverage minimum
- **Integration Tests**: Critical paths covered
- **Manual Tests**: UI/UX validation

---

## Test Scenarios

### 1. List Controllers (CRUD)

#### CustomersController

**Test Cases**:
1. ✅ Load customers list with pagination
2. ✅ Search customers by name/email/phone
3. ✅ Filter customers by criteria
4. ✅ Sort customers by different columns
5. ✅ Navigate between pages
6. ✅ View customer details
7. ✅ Edit customer
8. ✅ Delete customer (soft delete)
9. ✅ Refresh data
10. ✅ Import customers from CSV
11. ✅ Handle empty results
12. ✅ Handle permission restrictions

**Edge Cases**:
- Empty search results
- Invalid page numbers
- Large datasets (1000+ records)
- Special characters in search
- Concurrent modifications

#### UsersController

**Test Cases**:
1. ✅ Load users list with pagination
2. ✅ Search users by name/username
3. ✅ Filter users by active status
4. ✅ View user details
5. ✅ Edit user
6. ✅ Delete user (soft delete)
7. ✅ Display user status badges
8. ✅ Handle permission restrictions

**Edge Cases**:
- Cannot delete current user
- Cannot delete admin user
- Status badge colors correct
- Role assignments persist

#### ProductsController

**Test Cases**:
1. ✅ Load products list with pagination
2. ✅ Search products by name/SKU
3. ✅ Filter products by category/status
4. ✅ Display product cards
5. ✅ Display product status badges
6. ✅ View product details
7. ✅ Edit product
8. ✅ Delete product
9. ✅ Import products from CSV
10. ✅ Handle variants correctly

**Edge Cases**:
- Products with multiple variants
- Products without images
- Out of stock products
- Discontinued products

#### SuppliersController

**Test Cases**:
1. ✅ Load suppliers list with pagination
2. ✅ Search suppliers by name/contact
3. ✅ Filter suppliers by payment policy
4. ✅ View supplier details
5. ✅ Edit supplier
6. ✅ Delete supplier

**Edge Cases**:
- Suppliers with no payment policy
- Suppliers with pending orders
- GSTIN validation

#### TransactionsController

**Test Cases**:
1. ✅ Load transactions list with pagination
2. ✅ Search transactions
3. ✅ Filter transactions by type/status
4. ✅ Display transaction status
5. ✅ Format transaction amounts
6. ✅ View transaction details

**Edge Cases**:
- Large transaction amounts
- Negative amounts (refunds)
- Multiple payment methods

#### CategoriesController

**Test Cases**:
1. ✅ Load categories list
2. ✅ Display category tree
3. ✅ Search categories
4. ✅ Add category
5. ✅ Edit category
6. ✅ Import categories from CSV
7. ✅ Handle parent-child relationships

**Edge Cases**:
- Nested categories (3+ levels)
- Categories with no products
- Circular parent references

---

### 2. Form Controllers

#### CustomerFormController

**Test Cases**:
1. ✅ CREATE mode: Empty form
2. ✅ EDIT mode: Populated form
3. ✅ VIEW mode: Read-only form
4. ✅ Name validation (required)
5. ✅ Phone validation (format)
6. ✅ Email validation (format)
7. ✅ Save new customer
8. ✅ Update existing customer
9. ✅ Cancel without saving
10. ✅ Error handling on save failure

**Validation Tests**:
- Empty name → Error
- Invalid phone format → Error
- Invalid email format → Error
- Valid data → Success
- Duplicate email → Error (if enforced)

#### UserFormController

**Test Cases**:
1. ✅ CREATE mode: Empty form
2. ✅ EDIT mode: Populated form
3. ✅ VIEW mode: Read-only form
4. ✅ Name validation (required)
5. ✅ Username validation (required, no spaces)
6. ✅ Password validation (CREATE: required, EDIT: optional)
7. ✅ Status selection
8. ✅ Role assignment
9. ✅ Save new user
10. ✅ Update existing user

**Validation Tests**:
- Empty name → Error
- Empty username → Error
- Username with spaces → Error
- Short username → Error
- Empty password (CREATE) → Error
- Empty password (EDIT) → OK
- Invalid status → Error

#### SupplierFormController

**Test Cases**:
1. ✅ CREATE mode: Empty form
2. ✅ EDIT mode: Populated form
3. ✅ VIEW mode: Read-only form
4. ✅ Name validation (required)
5. ✅ Phone validation (format)
6. ✅ Email validation (format)
7. ✅ Payment policy selection
8. ✅ Save new supplier
9. ✅ Update existing supplier

**Validation Tests**:
- Empty name → Error
- Invalid phone → Error
- Invalid email → Error
- Valid data → Success

---

### 3. Validation Framework

#### FieldValidator Tests

**Test Cases**:
1. ✅ Required validator
2. ✅ MinLength validator
3. ✅ MaxLength validator
4. ✅ Pattern validator
5. ✅ Email validator
6. ✅ Phone validator
7. ✅ NoSpaces validator
8. ✅ Range validator
9. ✅ Positive validator
10. ✅ PositiveDecimal validator
11. ✅ NotNull validator (ComboBox)
12. ✅ Custom validator
13. ✅ Multiple validators on same field
14. ✅ Error display on validation failure
15. ✅ Error clearing on valid input
16. ✅ Focus-lost validation trigger

**Edge Cases**:
- Null values
- Empty strings
- Whitespace-only strings
- Special characters
- Very long strings
- Numeric edge cases (0, negative, decimal)

---

### 4. UI Components

#### ButtonFactory Tests

**Test Cases**:
1. ✅ Create primary button
2. ✅ Create secondary button
3. ✅ Create destructive button
4. ✅ Create icon button
5. ✅ Create card action button
6. ✅ Create edit button
7. ✅ Create delete button
8. ✅ Apply add button style
9. ✅ Apply refresh button style
10. ✅ Button action triggers correctly

**Visual Tests**:
- Icons display correctly
- Colors match design
- Hover states work
- Cursor changes to hand

#### BadgeFactory Tests

**Test Cases**:
1. ✅ Create status badge (active)
2. ✅ Create status badge (inactive)
3. ✅ Create product status badge
4. ✅ Create user status badge
5. ✅ Create success badge
6. ✅ Create warning badge
7. ✅ Create error badge
8. ✅ Create count badge

**Visual Tests**:
- Colors match status
- Text is readable
- Badges are consistent size

#### MenuBuilder Tests

**Test Cases**:
1. ✅ Build menu with view action
2. ✅ Build menu with edit action
3. ✅ Build menu with delete action
4. ✅ Build menu with separator
5. ✅ Build menu with custom action
6. ✅ Menu actions trigger correctly

---

### 5. Repository Patterns

#### UpdateBuilder Tests

**Test Cases**:
1. ✅ Build UPDATE with single field
2. ✅ Build UPDATE with multiple fields
3. ✅ Build UPDATE with null fields (skipped)
4. ✅ Build UPDATE with WHERE clause
5. ✅ Build UPDATE with multiple WHERE conditions
6. ✅ Parameter collection correct
7. ✅ SQL generation correct
8. ✅ updated_at automatically added

**Edge Cases**:
- All fields null
- Empty WHERE clause
- Special characters in values

#### WhereBuilder Tests

**Test Cases**:
1. ✅ Build WHERE with deleted_at filter
2. ✅ Build WHERE with search (single column)
3. ✅ Build WHERE with search (multiple columns)
4. ✅ Build WHERE with IN clause
5. ✅ Build WHERE with custom condition
6. ✅ Build WHERE with multiple conditions
7. ✅ Parameter collection correct
8. ✅ Empty WHERE clause handling

**Edge Cases**:
- Null search term
- Empty search term
- Empty IN list
- Special characters in search
- SQL injection attempts

#### Helper Methods Tests

**Test Cases**:
1. ✅ softDelete() updates deleted_at
2. ✅ count() returns correct count
3. ✅ parseDateTime() handles valid dates
4. ✅ parseDateTime() handles null
5. ✅ boolToInt() converts true to 1
6. ✅ boolToInt() converts false to 0
7. ✅ boolToInt() handles null with default

---

### 6. Import Handlers

#### CSV Import Tests

**Test Cases**:
1. ✅ Import valid CSV file
2. ✅ Import CSV with missing headers
3. ✅ Import CSV with extra columns
4. ✅ Import CSV with invalid data
5. ✅ Import CSV with duplicate data
6. ✅ Import large CSV (1000+ rows)
7. ✅ Progress tracking updates
8. ✅ Error handling for failed rows
9. ✅ Success notification
10. ✅ Data refresh after import

**Edge Cases**:
- Empty CSV file
- CSV with only headers
- CSV with special characters
- CSV with different encodings
- CSV with quoted fields
- CSV with line breaks in fields

---

## Controller Testing

### Unit Test Example

```java
@Test
void testBuildFilter() {
    // Arrange
    CustomersController controller = new CustomersController(
        customerRepository,
        workspaceManager
    );
    controller.searchField.setText("John");
    controller.currentPage = 2;
    controller.itemsPerPage = 20;
    
    // Act
    CustomerFilter filter = controller.buildFilter();
    
    // Assert
    assertEquals("John", filter.searchTerm());
    assertEquals(2, filter.page());
    assertEquals(20, filter.limit());
}

@Test
void testFetchData() {
    // Arrange
    CustomerFilter filter = new CustomerFilter("John", 1, 10);
    List<Customer> mockCustomers = List.of(
        new Customer(1L, "John Doe", "123", "john@example.com", null, null, null, null)
    );
    PagedResult<Customer> mockResult = new PagedResult<>(mockCustomers, 1, 1, 1, 10);
    when(customerRepository.findCustomers(filter)).thenReturn(mockResult);
    
    // Act
    PagedResult<Customer> result = controller.fetchData(filter);
    
    // Assert
    assertEquals(1, result.data().size());
    assertEquals("John Doe", result.data().get(0).name());
}
```

---

## Repository Testing

### Unit Test Example

```java
@Test
void testUpdateBuilderWithNullFields() {
    // Arrange
    UpdateBuilder builder = new UpdateBuilder("customers")
            .set("name", "John")
            .set("phone", null)  // Should be skipped
            .set("email", "john@example.com")
            .where("id = ?", 1L);
    
    // Act
    String sql = builder.getSql();
    Object[] params = builder.getParams();
    
    // Assert
    assertTrue(sql.contains("name = ?"));
    assertFalse(sql.contains("phone = ?"));
    assertTrue(sql.contains("email = ?"));
    assertEquals(3, params.length); // name, email, id
}

@Test
void testWhereBuilderWithSearch() {
    // Arrange
    WhereBuilder builder = new WhereBuilder()
            .addNotDeleted()
            .addSearch("John", "name", "email");
    
    // Act
    String where = builder.build();
    List<Object> params = builder.getParams();
    
    // Assert
    assertTrue(where.contains("deleted_at IS NULL"));
    assertTrue(where.contains("name LIKE ?"));
    assertTrue(where.contains("email LIKE ?"));
    assertEquals(2, params.size());
    assertEquals("%John%", params.get(0));
    assertEquals("%John%", params.get(1));
}
```

---

## Validation Testing

### Unit Test Example

```java
@Test
void testRequiredValidator() {
    // Arrange
    TextField field = new TextField();
    FieldValidator validator = FieldValidator.of(field)
            .addValidator(Validators.required("Name is required"));
    
    // Act & Assert - Empty field
    field.setText("");
    ValidationResult result = validator.validate();
    assertFalse(result.isValid());
    assertEquals("Name is required", result.getErrorMessage());
    
    // Act & Assert - Valid field
    field.setText("John");
    result = validator.validate();
    assertTrue(result.isValid());
}

@Test
void testEmailValidator() {
    // Arrange
    TextField field = new TextField();
    FieldValidator validator = FieldValidator.of(field)
            .addValidator(Validators.email());
    
    // Act & Assert - Invalid email
    field.setText("invalid-email");
    ValidationResult result = validator.validate();
    assertFalse(result.isValid());
    
    // Act & Assert - Valid email
    field.setText("john@example.com");
    result = validator.validate();
    assertTrue(result.isValid());
}
```

---

## Integration Testing

### Test Scenarios

#### End-to-End Customer Management

1. **Create Customer**
   - Navigate to Customers page
   - Click "Add Customer"
   - Fill in form with valid data
   - Click "Save"
   - Verify customer appears in list
   - Verify success notification

2. **Edit Customer**
   - Select customer from list
   - Click "Edit"
   - Modify fields
   - Click "Save"
   - Verify changes reflected in list
   - Verify success notification

3. **Delete Customer**
   - Select customer from list
   - Click "Delete"
   - Confirm deletion
   - Verify customer removed from list
   - Verify success notification

4. **Search Customer**
   - Enter search term
   - Verify filtered results
   - Clear search
   - Verify all results shown

5. **Import Customers**
   - Click "Import"
   - Select valid CSV file
   - Verify progress dialog
   - Verify import success
   - Verify customers in list

---

## Manual Testing Checklist

### Pre-Testing Setup

- [ ] Database is in clean state
- [ ] Test data is prepared
- [ ] Application starts without errors
- [ ] All dependencies are available

### Functional Testing

#### Customers Module
- [ ] List loads correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Sorting works
- [ ] Add customer works
- [ ] Edit customer works
- [ ] View customer works
- [ ] Delete customer works
- [ ] Import customers works

#### Users Module
- [ ] List loads correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Add user works
- [ ] Edit user works
- [ ] View user works
- [ ] Delete user works
- [ ] Status badges display correctly
- [ ] Role assignment works

#### Products Module
- [ ] List loads correctly
- [ ] Card view displays correctly
- [ ] Table view displays correctly
- [ ] Search works
- [ ] Filters work
- [ ] Add product works
- [ ] Edit product works
- [ ] View product works
- [ ] Delete product works
- [ ] Variant management works
- [ ] Import products works

#### Suppliers Module
- [ ] List loads correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Add supplier works
- [ ] Edit supplier works
- [ ] View supplier works
- [ ] Delete supplier works
- [ ] Payment policy selection works

#### Transactions Module
- [ ] List loads correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Transaction details display correctly
- [ ] Status formatting correct
- [ ] Amount formatting correct

#### Categories Module
- [ ] List loads correctly
- [ ] Tree view displays correctly
- [ ] Search works
- [ ] Add category works
- [ ] Edit category works
- [ ] Import categories works
- [ ] Parent-child relationships work

### Validation Testing

#### Form Validation
- [ ] Required fields show error when empty
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Pattern validation works
- [ ] Numeric validation works
- [ ] Error messages display correctly
- [ ] Error messages clear when valid
- [ ] Focus-lost validation triggers

### UI/UX Testing

#### Visual Consistency
- [ ] Buttons styled consistently
- [ ] Badges styled consistently
- [ ] Menus styled consistently
- [ ] Forms styled consistently
- [ ] Tables styled consistently
- [ ] Icons display correctly
- [ ] Colors match design
- [ ] Spacing is consistent

#### Responsiveness
- [ ] Window resizing works
- [ ] Tables resize correctly
- [ ] Forms resize correctly
- [ ] Scrolling works smoothly
- [ ] No layout breaks

#### Accessibility
- [ ] Tab navigation works
- [ ] Keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] Error messages readable
- [ ] Tooltips display correctly

### Performance Testing

- [ ] List loads in < 2 seconds
- [ ] Search responds in < 1 second
- [ ] Form saves in < 1 second
- [ ] Import processes 1000 rows in < 10 seconds
- [ ] No memory leaks
- [ ] No UI freezing

### Error Handling

- [ ] Network errors handled gracefully
- [ ] Database errors handled gracefully
- [ ] Validation errors displayed clearly
- [ ] Permission errors handled correctly
- [ ] Unexpected errors logged

### Security Testing

- [ ] Permission checks work
- [ ] Unauthorized actions blocked
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Session management works

---

## Test Data

### Sample Customers

```csv
Name,Phone,Email,Address
John Doe,+1-555-0101,john@example.com,123 Main St
Jane Smith,+1-555-0102,jane@example.com,456 Oak Ave
Bob Johnson,+1-555-0103,bob@example.com,789 Pine Rd
```

### Sample Users

```csv
Name,Username,Password,Status
Admin User,admin,admin123,active
Test User,testuser,test123,active
Inactive User,inactive,inactive123,inactive
```

### Sample Products

```csv
Name,Description,Category,Price,Cost Price,SKU
Product A,Description A,Category 1,10.00,5.00,SKU001
Product B,Description B,Category 2,20.00,10.00,SKU002
Product C,Description C,Category 1,30.00,15.00,SKU003
```

### Sample Suppliers

```csv
Name,Contact Person,Phone,Email,Address
Supplier A,Contact A,+1-555-0201,suppliera@example.com,Address A
Supplier B,Contact B,+1-555-0202,supplierb@example.com,Address B
Supplier C,Contact C,+1-555-0203,supplierc@example.com,Address C
```

---

## Bug Reporting Template

```markdown
### Bug Report

**Title**: [Short description]

**Priority**: [Critical/High/Medium/Low]

**Module**: [Customers/Users/Products/etc.]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[If applicable]

**Environment**:
- OS: [Windows/Mac/Linux]
- Java Version: [Version]
- Database: [SQLite version]

**Additional Context**:
[Any other relevant information]
```

---

## Testing Schedule

### Week 1: Unit Testing
- Day 1-2: Controller tests
- Day 3-4: Repository tests
- Day 5: Validation tests

### Week 2: Integration Testing
- Day 1-2: End-to-end scenarios
- Day 3-4: Edge cases
- Day 5: Performance testing

### Week 3: Manual Testing
- Day 1-2: Functional testing
- Day 3: UI/UX testing
- Day 4: Security testing
- Day 5: Bug fixes

---

**Last Updated**: Sprint 5  
**Maintained By**: QA Team
