"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"

export interface PaginatedSelectOption<T = unknown> {
  value: string
  label: string
  subLabel?: string
  badge?: string
  icon?: React.ReactNode
  data?: T
}

export interface PaginatedSelectFetchParams {
  page: number
  limit: number
  search: string
}

export interface PaginatedSelectFetchResult<T = unknown> {
  items: PaginatedSelectOption<T>[]
  totalPages: number
  total?: number
}

export interface PaginatedSelectProps<T = unknown> {
  id?: string
  value?: string
  selectedOption?: PaginatedSelectOption<T>
  onValueChange: (
    value: string,
    selectedOption?: PaginatedSelectOption<T>
  ) => void
  fetchData: (
    params: PaginatedSelectFetchParams
  ) => Promise<PaginatedSelectFetchResult<T>>
  queryKey?: unknown[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  limit?: number
  renderOption?: (
    option: PaginatedSelectOption<T>,
    isSelected: boolean
  ) => React.ReactNode
  renderSelected?: (option: PaginatedSelectOption<T>) => React.ReactNode
}

export function PaginatedSelect<T = unknown>({
  id,
  value,
  selectedOption,
  onValueChange,
  fetchData,
  queryKey = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  limit = 5,
  renderOption,
  renderSelected,
}: PaginatedSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Cache selected option to preserve trigger display across pagination/search
  const [cachedOption, setCachedOption] =
    React.useState<PaginatedSelectOption<T> | null>(null)
  const locale = useLocale()
  const isAr = locale === "ar"
  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when popover opens/closes
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setDebouncedSearch("")
      setPage(1)
    }
  }, [open])

  // Fetch paginated options
  const { data, isLoading, isFetching } = useQuery<
    PaginatedSelectFetchResult<T>
  >({
    queryKey: [...queryKey, "paginated-select", page, limit, debouncedSearch],
    queryFn: () => fetchData({ page, limit, search: debouncedSearch }),
    staleTime: 30 * 1000,
  })

  const items = data?.items ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  // Clear cached option when value is cleared externally
  const [prevValue, setPrevValue] = React.useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!value) {
      setCachedOption(null)
    }
  }

  // Active option derived during render
  const activeOption =
    (value
      ? items.find((item: PaginatedSelectOption<T>) => item.value === value)
      : null) ??
    (cachedOption?.value === value ? cachedOption : null) ??
    (selectedOption?.value === value ? selectedOption : null)

  const handleSelect = (option: PaginatedSelectOption<T>) => {
    if (value === option.value) {
      onValueChange("", undefined)
      setCachedOption(null)
    } else {
      onValueChange(option.value, option)
      setCachedOption(option)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-input px-3 py-2 text-sm transition-colors focus:ring-1 focus:ring-ring focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {activeOption ? (
            renderSelected ? (
              renderSelected(activeOption)
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                {activeOption.icon && (
                  <div className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                    {activeOption.icon}
                  </div>
                )}
                <span className="truncate font-medium text-foreground">
                  {activeOption.label}
                </span>
                {activeOption.subLabel && (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    ({activeOption.subLabel})
                  </span>
                )}
                {activeOption.badge && (
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] capitalize"
                  >
                    {activeOption.badge}
                  </Badge>
                )}
              </div>
            )
          ) : (
            <span className="truncate text-muted-foreground">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[calc(100vw-2rem)] max-w-md p-0 shadow-lg sm:w-[380px]"
      >
        {/* Search header */}
        <div className="relative flex items-center border-b border-border p-2">
          <Search className="absolute start-4 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg border-none ps-9 pe-8 text-xs focus-visible:ring-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute end-4 rounded-full p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Option list */}
        <div className="max-h-60 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-28 flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
              <p>No results found</p>
              {search && (
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Try searching with a different keyword
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map((option: PaginatedSelectOption<T>) => {
                const isSelected = value === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-xs transition-colors hover:bg-accent/60",
                      isSelected &&
                        "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <>
                        <div className="flex min-w-0 items-center gap-2.5">
                          {option.icon ? (
                            <div
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {option.icon}
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {option.label[0]?.toUpperCase() ?? "O"}
                            </div>
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {option.label}
                            </span>
                            {option.subLabel && (
                              <span className="truncate text-[11px] text-muted-foreground">
                                {option.subLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {option.badge && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] capitalize"
                            >
                              {option.badge}
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="size-4 text-primary" />
                          )}
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Page {page} of {totalPages}
            </span>
            {isFetching && !isLoading && (
              <Loader2 className="size-3 animate-spin text-primary" />
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="size-7 rounded-lg"
              title="Previous Page"
            >
              <ChevronLeft className={`size-3.5 ${isAr ? "rotate-180" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="size-7 rounded-lg"
              title="Next Page"
            >
              <ChevronRight
                className={`size-3.5 ${isAr ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
