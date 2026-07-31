"use client"

import { useTheme } from "@space-man/react-theme-animation"

/**
 * Chart palette, validated with the dataviz validator against this app's own
 * card surfaces (#fff6f3 light, #202020 dark). All six checks pass in both
 * modes: light CVD ΔE 9.2 / normal-vision 27.6; dark CVD ΔE 9.4 / 26.5.
 *
 * Do NOT substitute the app's --chart-1..5 tokens here. They are a single-hue
 * terracotta ramp (#a24b36 … #ffe6d0) and fail the categorical gate outright
 * (normal-vision ΔE 9.5 vs a floor of 15) — full-colour readers cannot
 * tell adjacent series apart. Those tokens are for sequential encoding only.
 */
export const CHART_COLORS = {
  series1: { light: "#2a78d6", dark: "#3987e5" }, // predicted / forecast
  series2: { light: "#eb6834", dark: "#d95926" }, // actual / recorded
  series3: { light: "#1baf7a", dark: "#199e70" }, // reserved; 2.64:1 on light,
  //                                                 so it ships with direct labels
  grid: { light: "#e1e0d9", dark: "#2c2c2a" },
  axis: { light: "#c3c2b7", dark: "#383835" },
  muted: "#898781",
} as const

/**
 * Status colours are reserved and never themed. Always paired with an icon and
 * a text label — hue alone never carries the meaning.
 */
export const RISK_COLORS = {
  low: "#0ca30c",
  medium: "#fab219",
  high: "#d03b3b",
} as const

export type RiskLevel = keyof typeof RISK_COLORS

export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme === "dark" ? "dark" : "light"
  return {
    series1: CHART_COLORS.series1[mode],
    series2: CHART_COLORS.series2[mode],
    series3: CHART_COLORS.series3[mode],
    grid: CHART_COLORS.grid[mode],
    axis: CHART_COLORS.axis[mode],
    muted: CHART_COLORS.muted,
  }
}
