import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function GenericPageHeader({ headerIcon, headerLabel, headerDescription, actionLabel, actionUrl }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {headerIcon}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{headerLabel}</h1>
            <p className="text-sm text-muted-foreground">{headerDescription}</p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to={actionUrl}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
