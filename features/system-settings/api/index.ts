import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { SystemSettings, SystemSettingsUpdate } from "./type"

export * from "./type"

/** GET /admin/settings — platform switches plus early-bird usage. */
export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await apiClient("/admin/settings")
  return parseOrThrow<SystemSettings>(response, "getSystemSettings")
}

/** PATCH /admin/settings — returns the settings as they now stand. */
export async function updateSystemSettings(
  body: SystemSettingsUpdate
): Promise<SystemSettings> {
  const response = await apiClient("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<SystemSettings>(response, "updateSystemSettings")
}
