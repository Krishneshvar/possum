# POSSUM
> <b><u>P</u></b>oint <b><u>O</u></b>f <b><u>S</u></b>ale <b><u>S</u></b>olution for <b><u>U</u></b>nified <b><u>M</u></b>anagement

An open source POS (Point Of Sale) desktop application for small to medium scale businesses. A base application that works with plugins to improve merchant experience.

---

## Areas for Improvement

### Tax Engine Analysis

| Area | Current Implementation | Risk/Impact |
| :--- | :--- | :--- |
| **Customer Type Check** | `rule.customerType().equals(customer.name())` | **Fragile**: It currently compares a "type" constraint against the customer's *name* instead of a dedicated *type* field (e.g., Wholesaler, Retailer). |
| **Tax Exemption** | Customer model lacks an `isTaxExempt` field. | **Incomplete**: Production systems usually allow specific customers (e.g., NGOs, government entities) to be flagged as tax-exempt. |
| **Rounding Loss** | Items are rounded individually before summation. | **Legal Compliance**: Some tax authorities require summing raw values and rounding once at the invoice level. The engine should ideally support configurable rounding strategies. |
| **Input Validation** | Some fields rely on UI-side validation. | **Defensive Programming**: The `TaxEngine` itself should validate that rates are not negative and prices are valid before processing. |

---

# RBAC System Analysis

| Area | Current Implementation | Risk/Impact |
| :--- | :--- | :--- |
| **Session Cleanup** | Relies on 1% probability random cleanup in `validateSession`. | **Unpredictable**: In low-traffic systems, expired sessions might persist for a long time. A background scheduled task would be more robust. |
| **Hardcoded Superuser** | The string `"admin"` is hardcoded as the superuser role in `AuthorizationService`. | **Rigid**: While standard, making the "superuser" role ID-based or configurable would add flexibility. |
| **Token Generation** | Uses `UUID.randomUUID()` for tokens. | **Basic**: While secure, using JWT (JSON Web Tokens) would allow for "stateless" validation, potentially reducing database load in high-concurrency scenarios. |
| **Audit Coverage** | Audit log exists but isn't explicitly hooked into every permission check. | **Observability**: While `ServiceSecurity` checks permissions, it doesn't currently log the "Access Denied" events which are important for detecting intrusion attempts. |

---
