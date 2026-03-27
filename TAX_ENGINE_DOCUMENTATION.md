# Tax Engine Implementation

## Overview

The tax engine has been fully implemented in the POSSUM project with all functionalities from the neon-possum project, including:

- **Tax Profiles**: Configure different tax profiles for different regions/countries
- **Tax Categories**: Organize products into tax categories
- **Tax Rules**: Define complex tax rules with conditions and priorities
- **Tax Simulator**: Test tax calculations before applying them

## Architecture

### Core Components

1. **Domain Models** (`com.possum.domain.model`)
   - `TaxProfile`: Represents a tax configuration profile
   - `TaxCategory`: Product categorization for tax purposes
   - `TaxRule`: Individual tax rules with conditions

2. **Application Layer** (`com.possum.application`)
   - `TaxEngine`: Core tax calculation engine
   - `TaxManagementService`: Service for managing tax configurations

3. **Persistence Layer** (`com.possum.persistence`)
   - `TaxRepository`: Interface for tax data operations
   - `SqliteTaxRepository`: SQLite implementation
   - Mappers: `TaxProfileMapper`, `TaxCategoryMapper`, `TaxRuleMapper`

4. **UI Layer** (`com.possum.ui.settings.tax`)
   - `TaxManagementController`: Main tax management UI
   - `TaxProfilesController`: Manage tax profiles
   - `TaxCategoriesController`: Manage tax categories
   - `TaxRulesController`: Manage tax rules
   - `TaxSimulatorController`: Test tax calculations
   - `TaxManagementWindow`: Window launcher

## Features

### Tax Profiles

Tax profiles define the overall tax configuration:

- **Name**: Profile identifier (e.g., "GST India", "VAT UK")
- **Country/Region Code**: Geographic scope
- **Pricing Mode**: 
  - `INCLUSIVE`: Tax included in price
  - `EXCLUSIVE`: Tax added to price
- **Active Status**: Only one profile can be active at a time

### Tax Categories

Categories group products for tax purposes:

- **Name**: Category identifier
- **Description**: Optional description
- **Product Count**: Shows how many products use this category

### Tax Rules

Rules define how tax is calculated:

#### Basic Properties
- **Tax Profile**: Which profile this rule belongs to
- **Tax Category**: Which category this applies to (or all)
- **Rate**: Tax percentage
- **Priority**: Order of application (lower = first)
- **Compound**: Whether tax is calculated on base + previous taxes

#### Constraints (Optional)
- **Min/Max Price**: Apply only to items within price range
- **Min/Max Invoice Total**: Apply only when invoice total is in range
- **Customer Type**: Apply only to specific customer types
- **Valid From/To**: Date range for rule validity
- **Scope**: ITEM (per item) or INVOICE (whole invoice)

### Tax Calculation

The `TaxEngine` calculates taxes based on:

1. **Active Profile**: Uses the currently active tax profile
2. **Applicable Rules**: Filters rules based on constraints
3. **Priority Order**: Applies rules in priority order
4. **Compound Calculation**: Handles compound taxes correctly
5. **Pricing Mode**: Adjusts calculation for inclusive/exclusive pricing

#### Calculation Flow

```
1. Get active tax profile
2. For each invoice item:
   a. Find applicable rules (category, price, date, etc.)
   b. Sort by priority
   c. Calculate simple taxes first
   d. Calculate compound taxes on (base + simple taxes)
   e. Round to 2 decimal places
3. Sum all item taxes
4. Calculate grand total based on pricing mode
```

## Database Schema

The tax tables are already created in the initial schema:

```sql
-- Tax Categories
CREATE TABLE tax_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tax Profiles
CREATE TABLE tax_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_code TEXT,
  region_code TEXT,
  pricing_mode TEXT CHECK(pricing_mode IN ('INCLUSIVE', 'EXCLUSIVE')) NOT NULL,
  is_active INTEGER DEFAULT 0 CHECK(is_active IN (0,1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tax Rules
CREATE TABLE tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_profile_id INTEGER NOT NULL,
  tax_category_id INTEGER,
  rule_scope TEXT CHECK(rule_scope IN ('ITEM', 'INVOICE')) DEFAULT 'ITEM',
  min_price REAL,
  max_price REAL,
  min_invoice_total REAL,
  max_invoice_total REAL,
  customer_type TEXT,
  rate_percent REAL NOT NULL,
  is_compound INTEGER DEFAULT 0 CHECK(is_compound IN (0,1)),
  priority INTEGER DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tax_profile_id) REFERENCES tax_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id) ON DELETE SET NULL
);
```

## Usage

### Accessing Tax Management

1. Navigate to **Settings** in the application
2. Click on the **Tax** tab
3. Click **Open Tax Management** button
4. A new window opens with four tabs:
   - Profiles
   - Categories
   - Rules
   - Simulator

### Creating a Tax Profile

1. Go to **Profiles** tab
2. Fill in the form:
   - Name: e.g., "GST India"
   - Country Code: e.g., "IN"
   - Region Code: (optional)
   - Pricing Mode: INCLUSIVE or EXCLUSIVE
   - Active: Check to make this the active profile
3. Click **Add**

### Creating Tax Categories

1. Go to **Categories** tab
2. Fill in:
   - Name: e.g., "Standard Rate"
   - Description: (optional)
3. Click **Add**

### Creating Tax Rules

1. Go to **Rules** tab
2. Select a profile from the dropdown
3. Fill in the rule details:
   - Category: Select or leave as "All Categories"
   - Scope: ITEM or INVOICE
   - Rate: Tax percentage (e.g., 18)
   - Priority: 0 for first, higher numbers for later
   - Compound: Check if this tax should be calculated on base + previous taxes
4. Optionally add constraints:
   - Price ranges
   - Invoice total ranges
   - Customer type
   - Date validity
5. Click **Add**

### Testing with Simulator

1. Go to **Simulator** tab
2. Enter:
   - Unit Price: e.g., 100
   - Quantity: e.g., 1
   - Tax Category: Select from dropdown
3. Click **Calculate Tax**
4. View detailed breakdown of tax calculation

## Example: GST India Setup

### Profile
- Name: "GST India"
- Country: "IN"
- Pricing Mode: EXCLUSIVE
- Active: Yes

### Categories
1. Standard Rate (18%)
2. Reduced Rate (5%)
3. Zero Rated (0%)

### Rules for Standard Rate
- Profile: GST India
- Category: Standard Rate
- Rate: 18%
- Priority: 0
- Compound: No

### Rules for Reduced Rate
- Profile: GST India
- Category: Reduced Rate
- Rate: 5%
- Priority: 0
- Compound: No

## Integration with Sales

The tax engine is automatically used during sales:

1. When creating a sale, the `SalesService` uses `TaxEngine`
2. Each sale item's tax category determines which rules apply
3. Tax is calculated and stored with the sale
4. Tax breakdown is saved in `tax_rule_snapshot` field

## Code Examples

### Using TaxEngine Programmatically

```java
// Initialize
TaxEngine engine = new TaxEngine(taxRepository, jsonService);
engine.init();

// Create invoice
TaxableItem item = new TaxableItem(1L, new BigDecimal("100"), 2, 1L);
TaxableInvoice invoice = new TaxableInvoice(List.of(item));

// Calculate
TaxCalculationResult result = engine.calculate(invoice, customer);

// Access results
BigDecimal totalTax = result.totalTax();
BigDecimal grandTotal = result.grandTotal();
```

### Using TaxManagementService

```java
TaxManagementService service = new TaxManagementService(taxRepository);

// Get active profile
Optional<TaxProfile> active = service.getActiveTaxProfile();

// Create category
long categoryId = service.createTaxCategory("Standard Rate", "18% GST");

// Create rule
TaxRule rule = new TaxRule(/* ... */);
long ruleId = service.createTaxRule(rule);
```

## Files Created/Modified

### New Files
- `com/possum/application/taxes/TaxManagementService.java`
- `com/possum/ui/settings/tax/TaxManagementController.java`
- `com/possum/ui/settings/tax/TaxProfilesController.java`
- `com/possum/ui/settings/tax/TaxCategoriesController.java`
- `com/possum/ui/settings/tax/TaxRulesController.java`
- `com/possum/ui/settings/tax/TaxSimulatorController.java`
- `com/possum/ui/settings/tax/TaxManagementWindow.java`
- `resources/fxml/settings/tax/tax-management.fxml`
- `resources/fxml/settings/tax/tax-profiles.fxml`
- `resources/fxml/settings/tax/tax-categories.fxml`
- `resources/fxml/settings/tax/tax-rules.fxml`
- `resources/fxml/settings/tax/tax-simulator.fxml`

### Modified Files
- `com/possum/ui/settings/SettingsController.java`
- `resources/fxml/settings/settings-view.fxml`

### Existing Files (Already Present)
- `com/possum/application/sales/TaxEngine.java`
- `com/possum/domain/model/TaxProfile.java`
- `com/possum/domain/model/TaxCategory.java`
- `com/possum/domain/model/TaxRule.java`
- `com/possum/persistence/repositories/interfaces/TaxRepository.java`
- `com/possum/persistence/repositories/sqlite/SqliteTaxRepository.java`
- Database schema in `V1__initial_schema.sql`

## Testing

The tax simulator provides a way to test calculations without affecting actual sales:

1. Create test profiles and rules
2. Use the simulator to verify calculations
3. Adjust rules as needed
4. Once satisfied, use in actual sales

## Best Practices

1. **Start Simple**: Create one profile with basic rules first
2. **Test Thoroughly**: Use the simulator before going live
3. **Document Rules**: Use clear names and descriptions
4. **Priority Management**: Keep priorities simple (0, 10, 20, etc.)
5. **Compound Taxes**: Only use when legally required
6. **Date Ranges**: Use for temporary tax changes
7. **Backup**: Export database before major tax changes

## Troubleshooting

### Tax Not Calculating
- Check if a profile is active
- Verify rules exist for the profile
- Check if product has correct tax category

### Wrong Tax Amount
- Verify pricing mode (INCLUSIVE vs EXCLUSIVE)
- Check rule priorities
- Review compound tax settings
- Use simulator to debug

### Cannot Delete Category
- Category is used by products
- Update products first or use a different category

## Future Enhancements

Possible improvements:
- Import/export tax configurations
- Tax reports and analytics
- Multi-currency tax handling
- Tax exemption certificates
- Audit trail for tax changes
- Tax rate history tracking
