"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string | null
  onChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  startMonth?: Date
  endMonth?: Date
  disabledMatcher?: (date: Date) => boolean
  allowFuture?: boolean
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.split("T")[0].split("-")
  if (parts.length !== 3) return undefined
  const [y, m, d] = parts.map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined
  return new Date(y, m - 1, d)
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  minDate,
  maxDate,
  startMonth,
  endMonth,
  disabledMatcher,
  allowFuture = true,
}: DatePickerProps) {
  const activeLocale = useLocale()
  const dateLocale = activeLocale === "ar" ? ar : enUS
  const [open, setOpen] = React.useState(false)

  const selectedDate = parseLocalDate(value)

  const defaultStartMonth = startMonth ?? minDate ?? new Date(1930, 0)
  const defaultEndMonth =
    endMonth ??
    maxDate ??
    new Date(new Date().getFullYear() + 30, 11)

  const isDateDisabled = (date: Date) => {
    if (disabledMatcher) {
      return disabledMatcher(date)
    }

    const targetTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime()

    if (minDate) {
      const minTime = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate()
      ).getTime()
      if (targetTime < minTime) return true
    }

    if (maxDate) {
      const maxTime = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate()
      ).getTime()
      if (targetTime > maxTime) return true
    }

    if (!allowFuture && !maxDate) {
      const todayTime = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ).getTime()
      if (targetTime > todayTime) return true
    }

    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !selectedDate && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <span>
          {selectedDate
            ? format(selectedDate, "PPP", { locale: dateLocale })
            : placeholder ?? "Pick a date"}
        </span>
        <CalendarIcon className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"))
            } else {
              onChange(undefined)
            }
            setOpen(false)
          }}
          captionLayout="dropdown"
          startMonth={defaultStartMonth}
          endMonth={defaultEndMonth}
          disabled={isDateDisabled}
          locale={dateLocale}
        />
      </PopoverContent>
    </Popover>
  )
}
