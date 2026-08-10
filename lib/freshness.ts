export type FreshnessStatusType = "peak_fresh" | "fresh" | "expiring_soon" | "expired" | "none"

export interface FreshnessInfo {
  status: FreshnessStatusType
  remainingPercent: number
  elapsedPercent: number
  totalWindowMs: number
  remainingMs: number
  elapsedMs: number
  startDate?: Date
  expiryDate?: Date
}

export function getFreshnessInfo(
  startDateStr?: string | Date,
  endDateStr?: string | Date,
  createdAtStr?: string | Date
): FreshnessInfo {
  const startRaw = startDateStr || createdAtStr
  const startDate = startRaw ? new Date(startRaw) : new Date()
  const validStart = !isNaN(startDate.getTime()) ? startDate : new Date()

  let expiryDate: Date | null = null

  if (endDateStr) {
    const d = new Date(endDateStr)
    if (!isNaN(d.getTime())) {
      expiryDate = d
    }
  }

  if (!expiryDate) {
    return {
      status: "none",
      remainingPercent: 0,
      elapsedPercent: 100,
      totalWindowMs: 0,
      remainingMs: 0,
      elapsedMs: 0,
    }
  }

  const now = new Date()

  const totalWindowMs = Math.max(1, expiryDate.getTime() - validStart.getTime())
  const elapsedMs = Math.max(0, now.getTime() - validStart.getTime())
  const remainingMs = expiryDate.getTime() - now.getTime()

  if (remainingMs <= 0) {
    return {
      status: "expired",
      remainingPercent: 0,
      elapsedPercent: 100,
      totalWindowMs,
      remainingMs: 0,
      elapsedMs: totalWindowMs,
      startDate: validStart,
      expiryDate,
    }
  }

  const remainingPercent = Math.min(100, Math.max(0, (remainingMs / totalWindowMs) * 100))
  const elapsedPercent = 100 - remainingPercent

  let status: FreshnessStatusType = "fresh"

  // Expiring soon: <= 25% remaining or <= 2 hours remaining
  const twoHoursMs = 2 * 60 * 60 * 1000
  if (remainingPercent <= 25 || remainingMs <= twoHoursMs) {
    status = "expiring_soon"
  } else if (remainingPercent >= 70) {
    status = "peak_fresh"
  } else {
    status = "fresh"
  }

  return {
    status,
    remainingPercent,
    elapsedPercent,
    totalWindowMs,
    remainingMs,
    elapsedMs,
    startDate: validStart,
    expiryDate,
  }
}

export function formatTimeDuration(ms: number): string {
  if (ms <= 0) return "0m"
  const totalMinutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}
