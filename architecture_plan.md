# POSSUM Architecture & Improvement Plan

## Context

POSSUM is a **standalone desktop POS application** for small-to-medium businesses. It runs on a single machine, used by one operator at a time (or a small team sharing one terminal). It is **not** a web server, a multi-tenant SaaS, or a high-concurrency distributed system.

This context changes almost everything about what "production-ready" means here. Many patterns from the original plan (HikariCP connection pools, distributed tracing, circuit breakers, Kubernetes, blue-green deployments) are simply not applicable and would add complexity with zero benefit.

The real goal is: **reliable, maintainable, correct software that a small business can depend on daily.**

---

## ✅ What's Already Good

| Area | Assessment |
| :--- | :--- |
| Clean layered architecture (UI → Application → Domain → Persistence) | Solid foundation |
| Repository pattern with interfaces + SQLite implementations | Well done |
| Transaction management with savepoints for nested transactions | Robust |
| Domain models as Java records (immutable) | Good practice |
| BCrypt password hashing | Correct |
| RBAC with roles, permissions, and per-user overrides | Well thought out |
| Session management with expiry and cleanup | Functional |
| Flyway migrations for schema versioning | Correct approach |
| Daily automated database backups with retention and restore | Excellent for a desktop app |
| Rolling file log appender with size/time rotation | Good |
| Lazy service initialization via `ServiceLocator` | Appropriate |
| Constructor-based dependency injection | Correct |

---

## ❌ Real Problems (Calibrated to Desktop SMB Context)

### 1. MANUAL DI RESOLVER — MAINTAINABILITY ISSUE 🔴

`DependencyInjector.resolveDependency()` is a 150+ line if-else chain that manually maps every type to an instance. Every new controller or service requires editing this file.

**Why it matters for a desktop app**: This is a pure maintainability problem. It's not a performance issue, but it makes the codebase fragile and hard to extend. Adding a new feature means touching `DependencyInjector`, `AppBootstrap`, and `ApplicationModule` — three files for what should be a one-file change.

**Appropriate fix**: Replace the if-else resolver with a simple `Map<Class<?>, Supplier<Object>>` registry. No need for Guice or Spring — that would be massive overkill for a desktop app.

---

### 2. SINGLE DATABASE CONNECTION — ACCEPTABLE BUT FRAGILE 🟡

The single `Connection` in `DatabaseManager` is fine for a single-user desktop app. SQLite itself is not designed for high concurrency. However, the current design has one real risk: the `DatabaseBackupService` opens a **second** maintenance connection for `VACUUM INTO`, which is correct, but the `TransactionManager` shares the same connection object across all service calls. If a background thread (e.g. the backup scheduler) and the UI thread both try to use the connection simultaneously, there is a race condition.

**Why it matters**: The backup scheduler runs on a daemon thread. If a sale is being processed while a backup runs, both share the same `DatabaseManager` connection reference.

**Appropriate fix**: The `TransactionManager` already uses `synchronized`. Ensure `DatabaseBackupService` always uses its own independent connection (it already does via `openMaintenanceConnection()`). Add a brief connection health check on startup. No connection pool needed.

---

### 3. APPBOOTSTRAP — GOD CLASS 🔴

`AppBootstrap.initializeCore()` manually wires 20+ objects in a single 80-line method with no structure. There are also two `SqliteTaxRepository` instances created (`taxRepository` and `taxRepository1`) — a clear copy-paste bug.

**Why it matters**: Every new feature requires editing `AppBootstrap`. It's also the source of subtle bugs like the duplicate repository above.

**Appropriate fix**: Split wiring into logical groups (persistence, application, UI) as private methods. Eliminate the duplicate instantiation.

---

### 4. TESTING — SEVERELY LACKING 🔴

~2% test coverage for business-critical logic. The tax engine, sales flow, returns, and inventory deduction have zero unit tests.

**Why it matters for a desktop app**: A cashier using this software daily will encounter bugs in edge cases (zero-quantity items, tax-exempt customers, partial refunds, concurrent backup during sale). These are exactly the kinds of bugs unit tests catch before they reach a real business.

**Appropriate fix**: JUnit 5 + Mockito are already in the build. Write focused unit tests for the domain logic that matters most: `TaxEngine`, `SalesService`, `ReturnsService`, `InventoryService`. No need for Testcontainers or H2 — use an in-memory SQLite (`:memory:`) for repository integration tests.

---

### 5. ERROR HANDLING — INCONSISTENT 🔴

Exceptions from services surface as raw stack traces in some UI controllers. There is no consistent pattern for how domain exceptions (`ValidationException`, `NotFoundException`, `InsufficientStockException`) are translated into user-facing messages.

**Why it matters**: A cashier sees a Java stack trace instead of "Insufficient stock for Item X". This is a real usability and trust problem for an SMB.

**Appropriate fix**: A single `ErrorHandler` utility that maps known domain exceptions to human-readable messages, used consistently in all UI controllers. No need for a global exception bus — just a shared static helper.

---

### 6. LOGGING — MDC CONTEXT MISSING 🟡

The rolling file appender is good. What's missing is user/session context in log lines. When debugging a reported issue, there's no way to filter logs by which user was logged in or which sale was being processed.

**Why it matters**: When a merchant reports "something went wrong yesterday afternoon", you need to be able to find the relevant log lines quickly.

**Appropriate fix**: Add MDC (Mapped Diagnostic Context) with `userId` and `username` set at login and cleared at logout. This is a 10-line change.

---

### 7. SECURITY — BRUTE FORCE PROTECTION MISSING 🟡

The login form has no rate limiting or lockout after repeated failures. On a desktop app this is lower risk than a web app, but it's still a gap — especially since the app stores financial data.

**Why it matters**: A disgruntled employee or physical access attacker can brute-force the login.

**Appropriate fix**: A simple in-memory failed-attempt counter per username with a 5-minute lockout after 5 failures. No external library needed.

---

### 8. INPUT VALIDATION — SERVICE-LAYER GAPS 🟡

Some services rely on UI-side validation only. The `TaxEngine` now validates prices (fixed in Phase 1), but services like `CustomerService` and `UserService` don't validate inputs before hitting the database.

**Why it matters**: If validation is only in the UI, any programmatic call (tests, imports, future API) bypasses it entirely.

**Appropriate fix**: Add guard clauses at the top of each service method for the most critical fields. Not a full Bean Validation framework — just explicit checks with `ValidationException`.

---

### 9. SALESSERVICE — TOO MANY DEPENDENCIES 🟡

`SalesService` has 11 constructor dependencies. This is a sign it's doing too much. It handles sale creation, cancellation, payment method changes, customer changes, legacy imports, and invoice number generation all in one class.

**Why it matters**: Hard to test, hard to reason about, and any change risks breaking unrelated functionality.

**Appropriate fix**: Extract `InvoiceNumberService` (invoice generation logic) and keep `SalesService` focused on the sale lifecycle. This reduces dependencies and makes each piece independently testable.

---

### 10. CUSTOMER TYPE MANAGEMENT — UI GAP 🟡

`customerType` and `isTaxExempt` were added to the domain model (Phase 1 fixes), but there is no UI to set these fields when creating or editing a customer. The fields exist in the database but are permanently `NULL`/`false`.

**Why it matters**: The tax engine's customer-type-based rules and tax exemption are completely non-functional until the UI exposes these fields.

**Appropriate fix**: Add `customerType` dropdown and `isTaxExempt` toggle to the customer form.

---

## 📋 REVISED PHASE PLAN

### PHASE 1: TARGETED FIXES ✅ COMPLETE
*The README "Areas for Improvement" items — already implemented.*

- ✅ Fixed `TaxEngine` customer type check (`name()` → `customerType()`)
- ✅ Added `isTaxExempt` short-circuit to `TaxEngine`
- ✅ Added input validation (negative prices) to `TaxEngine`
- ✅ Moved tax rounding to invoice level
- ✅ Added `customerType` + `isTaxExempt` to `Customer` model + migration
- ✅ Added access-denied audit logging to `ServiceSecurity`
- ✅ Replaced probabilistic session cleanup with deterministic threshold

---

### PHASE 2: TESTING & CORRECTNESS (High Priority)
**Goal**: Catch bugs before they reach a real business. Focus on the code paths that handle money.

#### 2.1 Test Infrastructure
- Add Mockito to `build.gradle.kts`
- Create a shared `TestFixtures` class with builder-style factory methods for domain objects (`Customer`, `Variant`, `TaxRule`, etc.)
- Set up an in-memory SQLite helper for repository tests (`:memory:` JDBC URL, run Flyway migrations on it)
- **Effort**: 2 days

#### 2.2 TaxEngine Unit Tests
- Test zero-tax when no active profile
- Test tax-exempt customer short-circuit
- Test INCLUSIVE vs EXCLUSIVE pricing modes
- Test compound rules
- Test customer type filtering
- Test date validity (validFrom/validTo)
- Test invoice-level rounding (sum of raw values rounded once)
- Test negative price validation
- **Effort**: 2 days

#### 2.3 SalesService Unit Tests
- Test `createSale` happy path
- Test insufficient stock rejection
- Test discount distribution across items
- Test tax calculation integration
- Test `cancelSale` stock restoration
- Test `updateSaleItems` stock restore + re-deduct
- **Effort**: 3 days

#### 2.4 ReturnsService + InventoryService Unit Tests
- Test partial return refund calculation
- Test stock restoration on return
- Test inventory deduction and restoration symmetry
- **Effort**: 2 days

#### 2.5 Auth Unit Tests
- Test login with correct/incorrect credentials
- Test session expiry
- Test deterministic cleanup threshold
- Test brute force lockout (once implemented in Phase 3)
- **Effort**: 1 day

---

### PHASE 3: STABILITY & UX CORRECTNESS (High Priority)
**Goal**: Make the app reliable and honest with the user when things go wrong.

#### 3.1 Consistent Error Handling in UI
- Create `ErrorHandler.toUserMessage(Throwable)` that maps domain exceptions to readable strings
- Apply it in every controller's catch block (replace raw `e.getMessage()` calls)
- **Effort**: 2 days

#### 3.2 Brute Force Login Protection
- Add `LoginAttemptTracker` (in-memory map: username → attempt count + lockout timestamp)
- Lock account for 5 minutes after 5 consecutive failures
- Show remaining lockout time in the login UI
- Log all failed attempts via SLF4J WARN
- **Effort**: 1 day

#### 3.3 MDC Logging Context
- Set `userId` and `username` in MDC on successful login
- Clear MDC on logout
- Update log pattern to include `%X{userId}` and `%X{username}`
- **Effort**: half a day

#### 3.4 AppBootstrap Cleanup
- Remove duplicate `SqliteTaxRepository` instantiation
- Split `initializeCore()` into `initializePersistence()`, `initializeApplication()`, `initializeUI()`
- **Effort**: 1 day

#### 3.5 Customer Form UI — Expose customerType and isTaxExempt
- Add `customerType` dropdown (Retailer, Wholesaler, Government, NGO, Other) to `CustomerFormController`
- Add `isTaxExempt` checkbox
- Wire to `CustomerService.createCustomer` / `updateCustomer` (update method signatures to include new fields)
- **Effort**: 1 day

---

### PHASE 4: MAINTAINABILITY (Medium Priority)
**Goal**: Make the codebase easier to extend without introducing bugs.

#### 4.1 Replace DI if-else Resolver
- Replace `resolveDependency()` if-else chain with a `Map<Class<?>, Supplier<Object>>` registry
- Register all dependencies in the constructor
- Keep the same reflection-based controller factory — just clean up the lookup
- **Effort**: 1 day

#### 4.2 Extract InvoiceNumberService
- Move `generateInvoiceNumber()` and `getNextSequenceForPaymentType()` out of `SalesService`
- Create `InvoiceNumberService` with its own repository method
- Reduces `SalesService` constructor from 11 to 10 dependencies
- **Effort**: half a day

#### 4.3 Service-Layer Input Validation
- Add guard clauses to `CustomerService`, `UserService`, `ProductService` for null/blank/negative inputs
- Throw `ValidationException` with a clear message
- **Effort**: 1 day

#### 4.4 DatabaseManager Connection Health Check
- On `getConnection()`, if the connection is open but stale (e.g. after a restore), detect and reinitialize
- Add a simple `PRAGMA schema_version` ping on startup to confirm the connection is live
- **Effort**: half a day

---

### PHASE 5: POLISH & OPERATIONS ✅ COMPLETE
**Goal**: Quality-of-life improvements for the merchant and developer.

#### 5.1 Startup Health Check
- Before loading the UI, verify: database is accessible, migrations are up to date, backup directory is writable
- Show a clear error dialog (not a stack trace) if any check fails
- **Effort**: 1 day

#### 5.2 Settings — Expose Tax Profile Reload
- Currently `TaxEngine.init()` is called inside transactions. Add a manual "Reload Tax Settings" button in the Tax Management UI so merchants don't need to restart the app after changing tax profiles.
- **Effort**: half a day

#### 5.3 Audit Log — Enrich Security Events
- Log failed login attempts to the `audit_log` table (currently only logged to file)
- Log access-denied events to `audit_log` (currently only logged to file via `ServiceSecurity`)
- This gives the merchant a visible record of security events in the Audit UI
- **Effort**: 1 day

#### 5.4 Export & Reporting Improvements
- Ensure all report exports handle empty result sets gracefully (no blank Excel files)
- Add a "no data" message to report views when filters return zero results
- **Effort**: 1 day

---

## 📊 REVISED EFFORT SUMMARY

| Phase | Focus | Effort | Priority |
| :--- | :--- | :--- | :--- |
| Phase 1 | Targeted README fixes | ✅ Done | CRITICAL |
| Phase 2 | Testing & Correctness | ~10 days | HIGH |
| Phase 3 | Stability & UX Correctness | ~6 days | HIGH |
| Phase 4 | Maintainability | ~3 days | MEDIUM |
| Phase 5 | Polish & Operations | ~4 days | LOW |
| **Total** | | **~23 days** | |

---

## ❌ Items from Original Plan — Removed as Inappropriate

| Item | Reason Removed |
| :--- | :--- |
| HikariCP connection pooling | SQLite is single-writer by design. A pool of connections to SQLite causes more problems than it solves. The single connection is correct for this use case. |
| Guice / Spring DI framework | Massive dependency for a desktop app. A `Map`-based registry solves the same problem with zero overhead. |
| Typesafe Config / application.yml | The app has no environments (dev/staging/prod). Settings are already stored in `SettingsStore` (JSON files in AppData). Adding a config framework adds complexity with no benefit. |
| Distributed tracing (OpenTelemetry / Jaeger) | This is a single-process desktop app. There is nothing to trace across services. |
| Circuit breakers (Resilience4j) | There are no external HTTP calls. The only I/O is SQLite and the local filesystem. |
| Prometheus + Grafana metrics | A merchant running a POS terminal does not have a Prometheus server. |
| Docker / containerization | This is a native desktop app packaged with jpackage. Containerization is not applicable. |
| CI/CD pipeline (GitHub Actions) | Valuable eventually, but not a correctness or reliability issue for the app itself. |
| Blue-green deployment | Not applicable to a desktop installer. |
| Feature flags (Unleash / Togglz) | Overkill for a single-tenant desktop app. |
| H2 in-memory database for tests | SQLite supports `:memory:` mode natively. No need for a second database engine. |
| Testcontainers | No containers in this stack. |
| ELK / Splunk log aggregation | The merchant is not running a log aggregation stack. Rolling files are sufficient. |
| CSRF protection | No web layer. Not applicable. |
| Security headers | No HTTP server. Not applicable. |
| Rate limiting (Bucket4j) | A simple in-memory counter is sufficient for a desktop login form. |

---

## 🏆 Success Criteria (Revised)

- [ ] Core money-handling logic (tax, sales, returns, inventory) has unit test coverage
- [ ] All domain exceptions surface as readable messages in the UI — no raw stack traces
- [ ] Login is protected against brute force
- [ ] `customerType` and `isTaxExempt` are editable in the customer form
- [ ] `AppBootstrap` has no duplicate instantiations
- [ ] Log lines include the active user's ID for post-incident debugging
- [ ] Startup fails fast with a clear message if the database is inaccessible
