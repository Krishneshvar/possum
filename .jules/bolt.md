## 2025-02-16 - Optimizing Product Retrieval with Fast Path
**Learning:** Correlated subqueries in `SELECT` lists can be significant bottlenecks in SQLite when dealing with large datasets or complex logic (like stock calculation from multiple tables), even if `LIMIT` is used, because they complicate the query plan.
**Action:** When a computed field (like stock) is expensive but only needed for display (not filtering/sorting), fetch the base entities first using `LIMIT/OFFSET`, collect their IDs, and then perform a batch calculation for that specific page of results. This "Fast Path" avoids calculating the field for rows that are discarded by pagination.

## 2025-05-22 - Optimizing Date Range Filtering
**Learning:** SQLite cannot use indexes on columns when they are wrapped in functions like `date()`. Using `date(sale_date) >= date(?)` causes a full index/table scan, which is significantly slower (e.g., 40x in benchmarks) than direct string comparison `sale_date >= ?`.
**Action:** When filtering by date on `DATETIME` columns, convert the input date to a full timestamp string (e.g., append `00:00:00` or `23:59:59`) and use direct comparison operators (`>=`, `<=`) to enable index usage.
