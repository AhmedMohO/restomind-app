/** 12-hour clock hours: "01" – "12" */
export const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))

/** 5-minute interval minutes: "00", "05", … "55" */
export const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

export interface ParsedDateTime {
  date: Date
  hour: string
  minute: string
  ampm: string
}

/**
 * Parses an ISO date string into separate date, 12-hour clock hour, minute, and AM/PM parts.
 * Returns a safe fallback (current time) if the string is missing or invalid.
 */
export function parseISOToState(
  isoStr?: string,
  defaultHour = "12",
  defaultMin = "00",
  defaultAmpm = "PM"
): ParsedDateTime {
  const fallback: ParsedDateTime = {
    date: new Date(),
    hour: defaultHour,
    minute: defaultMin,
    ampm: defaultAmpm,
  }

  if (!isoStr) return fallback

  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return fallback

  let h = date.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12

  return {
    date,
    hour: String(h).padStart(2, "0"),
    minute: String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, "0"),
    ampm,
  }
}

/**
 * Combines a Date and separate 12-hour time parts into a single Date object.
 * Returns `undefined` if no date is provided.
 */
export function buildDateFromState(
  date?: Date,
  hourStr = "12",
  minStr = "00",
  ampm = "PM"
): Date | undefined {
  if (!date) return undefined

  let h = parseInt(hourStr, 10) || 12
  if (ampm === "PM" && h < 12) h += 12
  if (ampm === "AM" && h === 12) h = 0

  const result = new Date(date)
  result.setHours(h, parseInt(minStr, 10) || 0, 0, 0)
  return result
}
