import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

export default function GenericDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  dialogTitle = "Confirm Deletion",
  itemName = "this item",
  confirmButtonText = "Delete"
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex p-2 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">{dialogTitle}</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete{" "}
          <strong>"{itemName}"</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white"
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
