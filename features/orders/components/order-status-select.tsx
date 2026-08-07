"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORDER_STATUSES,
  getStatusMeta,
  isFinalizedStatus,
  getValidNextStatuses,
} from "@/features/orders/status"
import type { OrderStatus } from "@/features/orders/api/type"
import { cn } from "@/lib/utils"

export const ORDER_STATUS_OPTIONS = ORDER_STATUSES


interface OrderStatusSelectProps {
  value: OrderStatus
  onChange: (status: OrderStatus) => void
  disabled?: boolean
  className?: string
}

export function OrderStatusSelect({
  value,
  onChange,
  disabled,
  className,
}: OrderStatusSelectProps) {
  const tOrders = useTranslations("Orders")
  const meta = getStatusMeta(value)
  const isFinalized = isFinalizedStatus(value)
  const validOptions = getValidNextStatuses(value)
  const isControlDisabled = Boolean(disabled || isFinalized)

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next && next !== value) {
          onChange(next as OrderStatus)
        }
      }}
      disabled={isControlDisabled}
    >
      <SelectTrigger
        className={cn(
          "h-9 min-w-[160px] rounded-lg text-xs font-semibold",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue>
          <span className="inline-flex items-center gap-1.5">
            {disabled ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <meta.Icon className="size-3.5" />
            )}
            <span>{tOrders(meta.labelKey)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {validOptions.map((status) => {
          const statusMeta = getStatusMeta(status)
          return (
            <SelectItem key={status} value={status}>
              <span className="inline-flex items-center gap-2">
                <statusMeta.Icon className="size-3.5" />
                <span>{tOrders(statusMeta.labelKey)}</span>
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

