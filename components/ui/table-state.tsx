"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  Loader2,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc"

export interface TableStateProps {
  isLoading: boolean
  isError?: boolean
  isEmpty?: boolean
  /** Rendered when none of the loading / error / empty states apply. */
  children: React.ReactNode

  onRetry?: () => void
  errorText?: string
  retryText?: string

  emptyIcon?: React.ElementType
  emptyTitle?: string
  emptyDescription?: string
  /** When provided, an inline "clear filters" action is offered on the empty state. */
  onClearFilters?: () => void
  clearFiltersText?: string
}

/**
 * Single source of truth for the loading / error / empty states of a
 * dashboard table. Keeps the three states visually identical across modules
 * and keeps list containers free of repeated branching markup.
 */
export function TableState({
  isLoading,
  isError = false,
  isEmpty = false,
  children,
  onRetry,
  errorText = "Something went wrong.",
  retryText = "Try again",
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = "Nothing to show",
  emptyDescription,
  onClearFilters,
  clearFiltersText = "Clear filters",
}: TableStateProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex h-64 w-full items-center justify-center"
      >
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="sr-only">{retryText}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{errorText}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="rounded-xl">
            {retryText}
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <EmptyIcon className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
          {emptyDescription && (
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          )}
        </div>
        {onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="mt-2 gap-2 rounded-xl text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span>{clearFiltersText}</span>
          </Button>
        )}
      </div>
    )
  }

  return <>{children}</>
}

export interface SortableHeaderProps {
  /** The sort field this header controls. */
  field: string
  /** The field the list is currently sorted by. */
  activeField: string
  order: SortDirection
  onSort: (field: string) => void
  children: React.ReactNode
  align?: "start" | "end" | "center"
  className?: string
}

/**
 * A table header cell that toggles sorting for `field`. The caret reflects the
 * active field and direction; inactive columns get a neutral affordance.
 */
export function SortableHeader({
  field,
  activeField,
  order,
  onSort,
  children,
  align = "start",
  className,
}: SortableHeaderProps) {
  const isActive = activeField === field

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      aria-label={typeof children === "string" ? children : undefined}
      className={cn(
        "h-8 gap-1.5 font-semibold hover:bg-transparent",
        align === "start" && "-ms-3 text-start",
        align === "end" && "ms-auto text-end",
        align === "center" && "mx-auto",
        className
      )}
    >
      <span>{children}</span>
      {!isActive ? (
        <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
      ) : order === "asc" ? (
        <ArrowUp className="size-3.5 text-primary" />
      ) : (
        <ArrowDown className="size-3.5 text-primary" />
      )}
    </Button>
  )
}

/**
 * Shared sort-state reducer: clicking the active column flips direction,
 * clicking a new column selects it ascending. Returns the next state so
 * callers can also reset pagination in the same update.
 */
export function nextSortState(
  current: { sort: string; order: SortDirection },
  field: string
): { sort: string; order: SortDirection } {
  if (current.sort === field) {
    return { sort: field, order: current.order === "asc" ? "desc" : "asc" }
  }
  return { sort: field, order: "asc" }
}
