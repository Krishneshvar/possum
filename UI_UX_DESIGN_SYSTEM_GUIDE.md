# POSSUM UI/UX Design System Guide

## 1. Purpose
This document is the implementation guide for POSSUM's Emerald & Slate design system.  
It is intended to keep all future UI work consistent, accessible, and performant.

## 2. Architecture
Styles are organized into layered files:

```text
styles/
├── tokens.css
├── base.css
├── components.css
├── app-shell.css
├── workspace.css
├── inventory.css
├── pos.css
├── returns.css
├── settings.css
└── views/
    ├── inventory.css
    ├── pos.css
    ├── returns.css
    └── settings.css
```

## 3. Token System
Core semantic tokens are in `styles/tokens.css`.

- Colors: `-color-primary`, `-color-bg-canvas`, `-color-surface`, `-color-border`, `-color-text-main`
- Focus: `-color-focus-ring`, `-shadow-focus`
- Typography: `-fx-font-size-display/xl/lg/md/base/sm`
- Radius: `-fx-radius-sm/md/lg/xl`
- Shadows: `-shadow-sm/md/lg`

Rule: use semantic tokens in all view styles. Avoid raw hex values in FXML inline styles.

## 4. Shared Components
Defined in `styles/components.css`:

- Buttons: `primary-button`, `danger-button`, `action-button`
- Inputs: `text-field`, `combo-box`, `date-picker`, `text-area`
- Data states: `empty-state-*`, `table-loading-overlay`
- Form system:
  - `form-section`
  - `form-section-title`
  - `form-section-subtitle`
  - `required-indicator`
  - `field-helper`
  - `field-error`
  - `input-error`
  - `form-actions`

## 5. Accessibility Baseline

### 5.1 Automatic accessibility enhancement
`com.possum.ui.common.accessibility.AccessibilityEnhancer` runs for workspace views and dialogs.

It:
- makes controls focus traversable
- sets fallback `accessibleText` from label text/prompt text when missing

### 5.2 Keyboard mastery (global)
Implemented in `AppShellController`:

- `Ctrl+K`: focus search field in active view
- `Ctrl+S`: save/submit primary action
- `Ctrl+N`: create/add action (context-aware)
- `Ctrl+Tab` / `Ctrl+Shift+Tab`: next/previous workspace tab
- `Ctrl+W`: close active tab
- `Esc`: close open modal (owned stage)
- `?`: open shortcuts help dialog

### 5.3 POS shortcuts
POS keeps its module-specific shortcuts (`Ctrl+K`, `Ctrl+Enter`, `Ctrl+N`, `Ctrl+1..9`, `Esc`, `?`).

### 5.4 Focus visibility
Focus styling uses tokenized focus ring and shadow (`-shadow-focus`) across controls and tabs.

## 6. Form Validation Standard
All CRUD forms must:
- validate on blur and on submit
- show inline field errors using `field-error`
- mark invalid controls with `input-error`
- avoid toast-only validation for required fields

## 7. Performance Standards

### 7.1 Filter performance
`FilterBar` search/text filters are debounced (220ms) to reduce repeated query/load calls.

### 7.2 CSS performance
- prefer class-based styling over inline styles
- avoid deeply nested selectors when a reusable style class is enough
- keep style responsibilities split by layer (`components` vs `views`)

### 7.3 Image assets
- shell now uses optimized lightweight logo asset (`icons/icon-shell.png`)
- avoid loading oversized images for small UI surfaces

## 8. Screen-Level Conventions
- View root: `workspace-view`
- Header block: `view-header` + `view-title` + `view-subtitle`
- Top action rows: `view-toolbar`
- Management forms: `form-section` layout
- Empty lists/tables must show meaningful empty state messaging

## 9. Contribution Checklist
Before merging UI work:

1. Uses tokenized colors/spacing/radius
2. No critical inline style hacks unless unavoidable
3. Required fields have inline validation errors
4. Keyboard tab/focus path is usable
5. Interactive controls have accessible text/tooltips where relevant
6. Loading/empty/error states are present
7. `./gradlew classes` passes

## 10. Phase 6 Deliverables Completed
- Accessibility audit pass integrated in runtime view loading
- Global keyboard navigation and shortcuts implemented
- Workspace tab keyboard navigation implemented
- Focus ring consistency improved
- Filter debounce and shell image optimization implemented
- Design system documentation finalized in this guide
