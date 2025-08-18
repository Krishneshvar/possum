import { Plus } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export default function GenericPageHeader({ headerIcon, headerLabel, headerDescription, actionLabel, actionUrl }) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            {headerIcon}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">{headerLabel}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{headerDescription}</p>
          </div>
        </div>
        <Button
          asChild
          size="default"
          className="shrink-0 h-10 sm:h-11 px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto"
        >
          <Link to={actionUrl}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="truncate">{actionLabel}</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
