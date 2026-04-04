# Legacy Serieswise CSV Import

This project now supports importing bill-level legacy sales from `serieswise.csv` exports.

## What gets imported

From each valid row in `Serieswise Sales Report`:

- `Bill Number` -> legacy invoice number
- `Bill Date` + `Bill Time` -> sale datetime (stored in UTC)
- `Customer Code` -> legacy customer code (reference only)
- `Customer Name` -> legacy customer name
- `Net amount` -> net bill amount
- `Bill Number` prefix -> payment method mapping:
  - `C*` or `X*` -> `Cash`
  - `K*` -> `Debit Card`
  - any other prefix -> `Legacy Import` (unknown/uncategorized)

Rows such as report headers, blanks, and `Grand Total` are skipped.

## Storage model

Legacy bills are stored in a dedicated table:

- `legacy_sales`

This is intentionally separate from `sales`/`sale_items` because the source export is summary-only and does not contain line-item details.

## Where legacy data is reused

Imported legacy data is automatically included in:

- Bill History (`SalesHistoryController`)
- Transactions list (`SqliteTransactionRepository`)
- Sales summary + daily/monthly/yearly analytics (`SqliteReportsRepository`)
- Sales-by-payment-method analytics merged into real payment buckets (`Cash`, `Debit Card`, etc.) when mapped

## Functional limitations

Because the source is summary-only:

- No item-level bill detail can be opened for legacy bills
- No reprint from detailed template for legacy bills
- No return/edit/cancel actions on legacy bills
- Top-selling-product analytics cannot be reconstructed from legacy serieswise rows
- If a legacy prefix cannot be mapped to a known app payment method, totals still appear in overall sales but not in a specific payment bucket

## Re-import behavior

Import is idempotent by invoice number:

- same invoice re-import updates the legacy row
- no duplicate legacy bill rows are created
