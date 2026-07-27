"use client"

import { Clock } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HOURS, MINUTES } from "@/features/offers/utils"

export interface TimePickerProps {
  hour: string
  minute: string
  ampm: string
  disabled?: boolean
  onHourChange: (val: string) => void
  onMinuteChange: (val: string) => void
  onAmpmChange: (val: string) => void
}

export function TimePicker({
  hour,
  minute,
  ampm,
  disabled = false,
  onHourChange,
  onMinuteChange,
  onAmpmChange,
}: TimePickerProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Clock className="size-3.5 text-primary" />
        <span>Time</span>
      </div>
      <div className="flex items-center gap-1">
        <Select value={hour} onValueChange={(val) => val && onHourChange(val)} disabled={disabled}>
          <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="font-bold text-muted-foreground">:</span>

        <Select value={minute} onValueChange={(val) => val && onMinuteChange(val)} disabled={disabled}>
          <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ampm} onValueChange={(val) => val && onAmpmChange(val)} disabled={disabled}>
          <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
