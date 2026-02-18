## 2025-05-22 - Async Confirmation Dialogs
**Learning:** Shadcn UI's `AlertDialog` component requires manual implementation of loading states for asynchronous actions. Users might double-click or navigate away if no feedback is provided during deletion/confirmation.
**Action:** Always wrap `onConfirm` handlers in a try/finally block within the dialog component to manage an `isDeleting` (or `isLoading`) state, and disable buttons/show a spinner during the operation.
