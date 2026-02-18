# POS Application Audit Report

## 1. Executive Summary

**Verdict: NOT Production Ready (Requires Critical Fixes)**

The application demonstrates a solid foundation with a modern technology stack (Electron, Vite, React, SQLite) and a clean, modular architecture. The separation of concerns between Frontend (React/RTK Query) and Backend (Express/Controller-Service-Repository) is excellent, making the codebase maintainable and scalable.

However, **critical security and data integrity flaws** prevent immediate production deployment:
1.  **Race Conditions in Sales**: Stock processing has a window where inventory can be oversold.
2.  **Inventory Logic Gap**: The system tracks inventory "Lots" (batches/expiry) on receiving but **ignores** them on sales, rendering expiry tracking impossible.
3.  **Network Security**: The backend Express server (Port 3001) may be exposed to the local network, allowing unauthorized access if not properly bound to localhost or protected by firewall rules.
4.  **Session Persistence**: Sessions are in-memory only; app restarts log everyone out.

## 2. Architecture Overview

### Identified Pattern
**Hybrid Desktop-Web Architecture**:
-   **Runtime**: Electron (Main Process) handling window management and some IPC.
-   **Backend**: Local Express.js server spawned by Electron, acting as a REST API.
-   **Frontend**: React Single Page Application (SPA) served via Vite/Electron, communicating with the Backend via HTTP (`localhost:3001`).
-   **Database**: Embedded SQLite (`better-sqlite3`) with WAL mode.

### Structural Evaluation
| Aspect | Rating (1-10) | Notes |
| :--- | :--- | :--- |
| **Modularity** | 9/10 | Excellent feature-based folder structure in both Frontend and Backend. |
| **Separation** | 8/10 | Clear Controller-Service-Repository layers. |
| **Complexity** | 5/10 | HTTP overhead for local communication adds slight latency/complexity vs direct IPC. |
| **Scalability** | 7/10 | Good for single-node. SQLite is robust but local-only (appropriate for standalone POS). |

## 3. Backend Review

### Strengths
-   **Layered Architecture**: `Controller` (Input/Output) → `Service` (Business Logic) → `Repository` (Data Access) separation is strictly followed.
-   **Transactions**: Critical operations (e.g., `createSale`) use database transactions to ensure atomicity.
-   **Validation**: Zod is used for request validation (`*.schema.ts`), ensuring strict type safety.
-   **Math Safety**: `decimal.js` is used for financial calculations, preventing floating-point errors.

### Critical Flaws
1.  **Concurrency Race Condition**:
    -   In `createSale` (Sales Service), stock is fetched **outside** the transaction.
    -   The check `if (currentStock < item.quantity)` passes based on potentially stale data.
    -   The transaction starts *after* this check. Two concurrent requests can oversell inventory before the database constraint kicks in (if one exists).
2.  **Inventory Lot Disconnect**:
    -   `receiveInventory` creates `inventory_lots` with expiry dates.
    -   `createSale` calls `adjustInventory` with `lot_id: null`.
    -   **Result**: The system knows *that* you have stock, but not *which* batch was sold. You cannot track which specific expiring items are leaving the store. FIFO/LIFO logic is missing.

### Security Risks
-   **Port 3001 Exposure**: `expressApp.listen(3001)` binds to `0.0.0.0` by default on many systems. If the POS machine is on a store WiFi, anyone on the network could potentially hit `http://IP:3001/api/...`.
-   **In-Memory Sessions**: `auth.service.ts` stores sessions in a JS `Map`. If the Electron app updates or restarts (even incorrectly), all active cashier sessions are killed immediately.

## 4. Frontend Review

### Structure & State
-   **Architecture**: Feature-based (`features/Sales`, `features/Inventory`) mirrors the backend. Very evident where code lives.
-   **State Management**: Redux Toolkit (RTK) + RTK Query is a strong choice. Caching and invalidation are handled well.
-   **Components**: Shadcn/UI provides a polished, professional look.

### Logic & UX
-   **Duplicate Logic**: The Frontend (`Cart.tsx`) performs its own stock checks using `maxStock`. This `maxStock` is a snapshot from when the product was loaded. If stock updates in the background, the UI might allow adding an item, only to fail at checkout.
    -   *Recommendation*: Rely on backend validation or implement real-time stock sync (Polling/WebSockets).
-   **Missing POS Features**:
    -   **Price Override**: No UI to manually adjust price (negotiation).
    -   **Hold/Suspend Bill**: No persistent "Hold" functionality. Browser refresh = lost cart.
    -   **Customer Display**: No support for a secondary facing display.

## 5. Database & Integrity Review

### Schema Analysis
-   **Engine**: SQLite + `better-sqlite3`.
-   **Settings**: `WAL` mode enabled (good for concurrency). `Foreign Keys` enabled.
-   **Sales Table**: proper `NUMERIC` types used.
-   **Inventory**: Split into `inventory_lots` and `inventory_adjustments`.
    -   *Issue*: `inventory_adjustments` tracks changes but doesn't maintain a "current stock" counter on the `variants` table. Determining stock requires summing all adjustments (or lots), which gets slower over time (`O(n)`). A snapshot or cached `current_stock` column is recommended for performance.

## 6. Critical Flow Trace: "Sale Creation"

1.  **User adds item**: Frontend checks `maxStock` (cached).
2.  **User clicks Pay**: Frontend calculates `discount` and sends payload.
3.  **Backend Controller**: Validates payload shape (Zod).
4.  **Backend Service**:
    -   Fetches Variant & Stock (Async, No Lock). **[RACE CONDITION RISK]**
    -   Checks Stock.
    -   **Start Transaction**:
        -   Calculates Taxes (Tax Engine).
        -   Inserts `Sale`.
        -   Inserts `SaleItems`.
        -   Inserts `InventoryAdjustment` (Global variant stock, no Lot ID). **[DATA GAP]**
        -   Inserts `Payment`.
        -   Logs `Audit` entry.
    -   **Commit Transaction**.
5.  **Return**: Success 200.

## 7. Production Readiness Checklist

| Category | Status | Details |
| :--- | :--- | :--- |
| **Crash Recovery** | ⚠️ | DB is safe (ACID), but Sessions are lost (In-Memory). |
| **Data Backup** | ❌ | No automated backup mechanism found. |
| **Logging** | ✅ | `winston` configured with rotation. |
| **Security** | ⚠️ | Localhost binding verification needed. |
| **Offline Mode** | ❌ | App is local-first (good), but requires the local server process. |
| **Updates** | ✅ | `electron-updater` allows remote updates. |

## 8. Recommendations & Roadmap

### Priority 1: Critical Fixes (Before Release)
-   [ ] **Fix Race Condition**: Move the stock check *inside* the transaction or use a `CHECK` constraint in the database to prevent negative stock.
-   [ ] **Bind Server to Localhost**: Ensure `expressApp.listen(3001, '127.0.0.1')` is strictly local.
-   [ ] **Inventory Logic**: Decide on FIFO or LIFO. When selling, the system *must* recursively find the oldest open `inventory_lot` and deduct from it to maintain accurate expiry tracking.

### Priority 2: Important Improvements
-   [ ] **Session Persistence**: Move sessions to Redis (overkill) or a simple SQLite table `user_sessions` so logins survive restarts.
-   [ ] **Stock Caching**: Add a `current_stock` column to `variants` updated via triggers or service logic to avoid summing `adjustments` every time.
-   [ ] **Frontend Hold Bill**: Persist current `cart` to `localStorage` or `IndexedDB` to prevent data loss on reload.

### Priority 3: Feature Completeness
-   [ ] Implement Price Overrides (with Admin PIN/Permission).
-   [ ] Implement "Close Register" (End of Day) reports.
-   [ ] Implement Data Backup/Restore UI.

## 9. Final Ratings

-   **Architecture**: 8/10
-   **Backend Robustness**: 6/10 (Docked for Race Condition & Lot Logic)
-   **Frontend Robustness**: 9/10
-   **Security**: 6/10 (Port exposure risk)
-   **Production Readiness**: 5/10
