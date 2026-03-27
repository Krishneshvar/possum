# Bill Settings & Appearance Implementation

## Overview
Successfully implemented comprehensive bill settings and appearance customization from neon-possum (Electron/React) into possum (JavaFX), with adaptations for JavaFX printing capabilities.

## Key Components Implemented

### 1. Data Models

#### BillSection.java
- Represents individual sections of a bill (header, meta, items, totals, footer)
- Supports configurable options per section (alignment, fontSize, custom text, etc.)
- Type-safe option getters with defaults

#### Enhanced BillSettings.java
- Replaced simple settings with comprehensive schema-based configuration
- Supports:
  - Paper width (58mm, 80mm)
  - Date format (standard, ISO, short, long)
  - Time format (12h, 24h)
  - Currency symbol
  - List of configurable sections with ordering

### 2. Rendering Engine

#### Enhanced BillRenderer.java
- Section-based rendering system
- Supports:
  - Dynamic section visibility and ordering
  - Per-section alignment (left, center, right)
  - Per-section font sizes (small, medium, large)
  - Store header with logo support
  - Customizable footer text
  - HTML escaping for security
  - Date/time formatting based on settings
  - Variant names in item display

### 3. UI Components

#### BillSettingsController.java
- Comprehensive settings management interface
- Features:
  - Live preview using WebView
  - Section editor with visibility toggles
  - Section reordering (up/down buttons)
  - Per-section option editors
  - Format settings (paper width, date/time, currency)
  - Mock data generation for preview
  - Real-time preview updates

#### bill-settings-view.fxml
- Two-tab layout:
  - Layout & Sections: Section management with live editing
  - General Options: Paper size, date/time formats, currency
- Side-by-side preview panel
- Responsive design with proper spacing

#### Updated SettingsController.java
- Removed old simple bill settings
- Added button to open comprehensive bill settings window
- Modal window for focused editing experience

### 4. Printing Infrastructure

#### Enhanced PrinterService.java
- Custom paper size support for thermal printers
- Proper page layout configuration:
  - 58mm = 164.4 points
  - 80mm = 226.8 points
  - Tall page height for continuous thermal paper
  - Zero margins for thermal printing
- Paper width parameter support

## Key Differences: Electron vs JavaFX

### Electron (neon-possum)
- Uses Chromium's print API
- Can set exact paper dimensions in microns
- Direct printer control via electron APIs
- HTML rendering in hidden BrowserWindow
- File-based temp HTML for printing

### JavaFX (possum)
- Uses JavaFX PrinterJob API
- Paper size via PrintHelper.createPaper()
- WebView for HTML rendering
- Platform.runLater() for UI thread operations
- Custom PageLayout with zero margins

## Features Implemented

### Section Management
1. **Store Header**
   - Store name, details, phone, GSTIN
   - Logo support (URL/base64)
   - Configurable alignment and font size

2. **Bill Meta**
   - Bill number, date, cashier, customer
   - Configurable date/time formats
   - Alignment options

3. **Items Table**
   - Product name with variant
   - Quantity, rate, amount columns
   - Configurable font size

4. **Totals**
   - Subtotal, tax, discount, total
   - Configurable alignment
   - Item count display

5. **Footer**
   - Custom text support
   - Configurable alignment and font size

### Format Options
- Paper width: 58mm or 80mm
- Date formats: standard (DD/MM/YYYY), ISO (YYYY-MM-DD), short, long
- Time formats: 12-hour (AM/PM) or 24-hour
- Currency symbol: Customizable (₹, $, €, etc.)

### UI/UX Features
- Live preview with mock data
- Section visibility toggles
- Section reordering
- Per-section option editors
- Real-time preview updates
- Modal window for focused editing
- Responsive layout

## Integration Points

### Settings Storage
- Uses existing SettingsStore infrastructure
- JSON serialization via JsonService
- Atomic file writes for safety
- Default settings initialization

### Printing Flow
1. Load bill settings from SettingsStore
2. Load general settings for currency/store info
3. Render HTML using BillRenderer
4. Create custom PageLayout for thermal paper
5. Print via PrinterJob with WebView
6. Show preview dialog

### POS Integration
- PosController already uses BillRenderer
- Automatically picks up new settings
- No changes needed to printing flow
- Preview dialog shows formatted bill

## Files Created/Modified

### Created
- `/src/main/java/com/possum/shared/dto/BillSection.java`
- `/src/main/java/com/possum/ui/settings/BillSettingsController.java`
- `/src/main/resources/fxml/settings/bill-settings-view.fxml`

### Modified
- `/src/main/java/com/possum/shared/dto/BillSettings.java`
- `/src/main/java/com/possum/infrastructure/printing/BillRenderer.java`
- `/src/main/java/com/possum/infrastructure/printing/PrinterService.java`
- `/src/main/java/com/possum/ui/settings/SettingsController.java`
- `/src/main/resources/fxml/settings/settings-view.fxml`

## Usage

### For Users
1. Navigate to Settings → Bill tab
2. Click "Open Bill Settings" button
3. Configure sections in "Layout & Sections" tab
4. Set formats in "General Options" tab
5. Preview changes in real-time
6. Click "Save Changes" to persist

### For Developers
```java
// Load settings
BillSettings billSettings = settingsStore.loadBillSettings();
GeneralSettings generalSettings = settingsStore.loadGeneralSettings();

// Render bill
String html = BillRenderer.renderBill(saleResponse, generalSettings, billSettings);

// Print with custom paper size
printerService.printInvoice(html, printerName, billSettings.getPaperWidth());
```

## Testing Recommendations

1. **Section Visibility**: Toggle each section on/off
2. **Section Ordering**: Move sections up/down
3. **Format Options**: Test all date/time/currency combinations
4. **Paper Sizes**: Test both 58mm and 80mm
5. **Store Header**: Test with/without logo
6. **Footer**: Test custom text with line breaks
7. **Printing**: Test on actual thermal printer
8. **Preview**: Verify preview matches printed output

## Future Enhancements

1. Logo file upload with base64 conversion
2. Additional section types (QR code, barcode)
3. Custom CSS styling per section
4. Template presets (retail, restaurant, etc.)
5. Multi-language support
6. Tax breakdown section
7. Payment method details section
8. Return policy section

## Notes

- All HTML output is escaped for security
- Settings are stored in JSON format
- Default settings are created on first load
- Preview uses mock sale data
- Thermal printer paper width must match settings
- WebView requires JavaFX runtime
- Modal window prevents accidental navigation
