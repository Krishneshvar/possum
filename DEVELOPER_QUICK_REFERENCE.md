# Quick Reference: Using Abstract Base Controllers

## Creating a New CRUD Controller

### Step 1: Extend AbstractCrudController

```java
public class MyEntityController extends AbstractCrudController<MyEntity, MyEntityFilter> {
    
    private final MyEntityService service;
    
    public MyEntityController(MyEntityService service, WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.service = service;
    }
    
    // Implement required methods...
}
```

### Step 2: Implement Required Methods

```java
@Override
protected void setupPermissions() {
    // Setup button permissions and icons
    if (addButton != null) {
        UIPermissionUtil.requirePermission(addButton, Permissions.MY_ENTITY_MANAGE);
    }
}

@Override
protected void setupTable() {
    // Define table columns
    TableColumn<MyEntity, String> nameCol = new TableColumn<>("Name");
    nameCol.setCellValueFactory(cellData -> 
        new SimpleStringProperty(cellData.getValue().name()));
    
    dataTable.getTableView().getColumns().add(nameCol);
    addActionMenuColumn(); // Adds standard action menu
}

@Override
protected void setupFilters() {
    // Add filters and setup listener
    filterBar.addMultiSelectFilter("status", "Status", 
        List.of("active", "inactive"), s -> s, false);
    
    setupStandardFilterListener(); // Use standard listener
    // OR with custom handling:
    setupStandardFilterListener((filters, reload) -> {
        // Custom filter processing
        reload.run();
    });
}

@Override
protected MyEntityFilter buildFilter() {
    return new MyEntityFilter(
        getSearchOrNull(),
        getCurrentPage(),
        getPageSize(),
        "name",
        "ASC"
    );
}

@Override
protected PagedResult<MyEntity> fetchData(MyEntityFilter filter) {
    return service.getEntities(filter);
}

@Override
protected String getEntityName() {
    return "entities"; // plural
}

@Override
protected String getEntityNameSingular() {
    return "Entity"; // singular
}

@Override
protected List<MenuItem> buildActionMenu(MyEntity entity) {
    List<MenuItem> items = new ArrayList<>();
    
    MenuItem editItem = new MenuItem("Edit");
    editItem.setOnAction(e -> handleEdit(entity));
    items.add(editItem);
    
    MenuItem deleteItem = new MenuItem("Delete");
    deleteItem.setOnAction(e -> handleDelete(entity));
    items.add(deleteItem);
    
    return items;
}

@Override
protected void deleteEntity(MyEntity entity) throws Exception {
    service.delete(entity.id());
}

@Override
protected String getEntityIdentifier(MyEntity entity) {
    return entity.name(); // Used in delete confirmation
}
```

### Step 3: Add Custom Actions (Optional)

```java
@FXML
private void handleAdd() {
    workspaceManager.openDialog("Add Entity", "/fxml/my-entity-form.fxml");
}

@FXML
private void handleEdit(MyEntity entity) {
    workspaceManager.openDialog("Edit Entity", "/fxml/my-entity-form.fxml", 
        Map.of("entityId", entity.id()));
}
```

---

## Adding CSV Import

### Step 1: Create Import Handler Inner Class

```java
private class ImportHandler extends AbstractImportController<MyEntity, MyImportRow> {
    
    @Override
    protected String[] getRequiredHeaders() {
        return new String[]{"Entity Name", "Name"};
    }
    
    @Override
    protected MyImportRow parseRow(List<String> row, Map<String, Integer> headers) {
        String name = CsvImportUtil.emptyToNull(
            CsvImportUtil.getValue(row, headers, "Entity Name", "Name")
        );
        if (name == null) return null;
        
        String description = CsvImportUtil.emptyToNull(
            CsvImportUtil.getValue(row, headers, "Description")
        );
        
        return new MyImportRow(name, description);
    }
    
    @Override
    protected MyEntity createEntity(MyImportRow record) throws Exception {
        return service.create(record.name(), record.description());
    }
    
    @Override
    protected String getImportTitle() {
        return "Import Entities from CSV";
    }
    
    @Override
    protected String getEntityName() {
        return "entity(ies)";
    }
    
    @Override
    protected void onImportComplete() {
        loadData(); // Reload table
    }
}

private record MyImportRow(String name, String description) {}
```

### Step 2: Wire Up Import Button

```java
private final ImportHandler importHandler;

public MyEntityController(MyEntityService service, WorkspaceManager workspaceManager) {
    super(workspaceManager);
    this.service = service;
    this.importHandler = new ImportHandler();
}

@Override
protected void setupPermissions() {
    // ... other permissions ...
    if (importHandler.importButton != null) {
        UIPermissionUtil.requirePermission(importHandler.importButton, 
            Permissions.MY_ENTITY_MANAGE);
    }
}

@FXML
private void handleImport() {
    importHandler.handleImport();
}
```

---

## Helper Methods Available

### From AbstractCrudController:

```java
// Pagination
getCurrentPage()        // Get current page number (0-based)
getPageSize()          // Get current page size

// Search
hasSearch()            // Check if search text exists
getSearchOrNull()      // Get search text or null

// Data Loading
loadData()             // Reload data with current filters

// Standard Actions
handleRefresh()        // Refresh data and show notification
handleDelete(entity)   // Delete with confirmation dialog

// Filter Setup
setupStandardFilterListener()                    // Basic listener
setupStandardFilterListener((filters, reload) -> {}) // Custom listener

// Table Setup
addActionMenuColumn()  // Add standard action menu column
```

---

## FXML Requirements

Your FXML must include these fx:id attributes:

```xml
<!-- Required for AbstractCrudController -->
<FilterBar fx:id="filterBar" />
<DataTableView fx:id="dataTable" />
<PaginationBar fx:id="paginationBar" />

<!-- Optional (for import) -->
<Button fx:id="importButton" text="Import" onAction="#handleImport" />
```

---

## Common Patterns

### Custom Status Badge Rendering

```java
statusCol.setCellFactory(col -> new TableCell<>() {
    @Override
    protected void updateItem(String status, boolean empty) {
        super.updateItem(status, empty);
        if (empty || status == null) {
            setGraphic(null);
        } else {
            Label badge = new Label(status);
            badge.getStyleClass().addAll("badge", "badge-status");
            badge.getStyleClass().add("badge-success"); // or badge-warning, etc.
            setGraphic(badge);
        }
    }
});
```

### Custom Filter Handling

```java
@Override
protected void setupFilters() {
    filterBar.addMultiSelectFilter("category", "Categories", 
        categories, Category::name);
    
    setupStandardFilterListener((filters, reload) -> {
        List<Category> selected = (List<Category>) filters.get("category");
        if (selected != null && !selected.isEmpty()) {
            currentCategoryIds = selected.stream()
                .map(Category::id)
                .toList();
        } else {
            currentCategoryIds = null;
        }
        reload.run();
    });
}
```

### Date Column Formatting

```java
TableColumn<MyEntity, LocalDateTime> dateCol = new TableColumn<>("Date");
dateCol.setCellValueFactory(cellData -> 
    new SimpleObjectProperty<>(cellData.getValue().createdAt()));
dateCol.setCellFactory(col -> new TableCell<>() {
    @Override
    protected void updateItem(LocalDateTime item, boolean empty) {
        super.updateItem(item, empty);
        if (empty || item == null) {
            setText(null);
        } else {
            LocalDateTime local = TimeUtil.toLocal(item);
            setText(TimeUtil.formatStandard(local));
        }
    }
});
```

---

## Tips & Best Practices

1. **Keep controllers thin** - Business logic belongs in services
2. **Use inner classes for import** - Avoids multiple inheritance issues
3. **Leverage helper methods** - Don't reimplement what's provided
4. **Consistent naming** - Follow existing patterns for methods and variables
5. **Error handling** - Let base classes handle common errors
6. **Permissions** - Always check permissions in setupPermissions()
7. **Custom features** - Override loadData() if you need custom rendering (like card view)

---

## Example: Minimal Controller (50 lines)

```java
public class SimpleEntityController extends AbstractCrudController<SimpleEntity, SimpleEntityFilter> {
    
    private final SimpleEntityService service;
    
    public SimpleEntityController(SimpleEntityService service, WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.service = service;
    }
    
    @Override
    protected void setupPermissions() {
        // No special permissions
    }
    
    @Override
    protected void setupTable() {
        TableColumn<SimpleEntity, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        dataTable.getTableView().getColumns().add(nameCol);
        addActionMenuColumn();
    }
    
    @Override
    protected void setupFilters() {
        setupStandardFilterListener();
    }
    
    @Override
    protected SimpleEntityFilter buildFilter() {
        return new SimpleEntityFilter(getSearchOrNull(), getCurrentPage(), getPageSize());
    }
    
    @Override
    protected PagedResult<SimpleEntity> fetchData(SimpleEntityFilter filter) {
        return service.getAll(filter);
    }
    
    @Override
    protected String getEntityName() { return "entities"; }
    
    @Override
    protected String getEntityNameSingular() { return "Entity"; }
    
    @Override
    protected List<MenuItem> buildActionMenu(SimpleEntity entity) {
        MenuItem deleteItem = new MenuItem("Delete");
        deleteItem.setOnAction(e -> handleDelete(entity));
        return List.of(deleteItem);
    }
    
    @Override
    protected void deleteEntity(SimpleEntity entity) throws Exception {
        service.delete(entity.id());
    }
    
    @Override
    protected String getEntityIdentifier(SimpleEntity entity) {
        return entity.name();
    }
}
```

That's it! A fully functional CRUD controller in ~50 lines.
