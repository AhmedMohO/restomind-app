"use client"

import * as React from "react"

/**
 * Debounces a rapidly-changing value (typically a search input).
 *
 * The timer is reset on every change and cleared on unmount, so a value that
 * keeps changing never emits an intermediate update and a component that
 * unmounts mid-typing never schedules a state update on a dead component.
 *
 * @param value  The value to debounce.
 * @param delay  Debounce window in milliseconds (default 300).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
