"use server"

import { requireRole } from "@/lib/auth/auth"
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors"
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettings,
  type SystemSettingsUpdate,
} from "./api"

/** Server Action: read the platform switches. Admin-only. */
export async function fetchSystemSettingsAction(): Promise<SystemSettings | null> {
  try {
    await requireRole(["admin"])
    return await getSystemSettings()
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      console.warn("[fetchSystemSettingsAction] Unauthorized access attempt", error.message)
      return null
    }
    console.error("[fetchSystemSettingsAction]", error)
    return null
  }
}

/**
 * Server Action: change one or more switches. Admin-only.
 *
 * Errors are returned rather than thrown so the panel can put the toggle back
 * where it was and say why. A switch that silently appears to have flipped
 * when it did not is worse than an error — an admin would walk away believing
 * trials are off while every new merchant still gets one.
 */
export async function updateSystemSettingsAction(
  body: SystemSettingsUpdate
): Promise<{ settings: SystemSettings } | { error: string }> {
  try {
    await requireRole(["admin"])
    return { settings: await updateSystemSettings(body) }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { error: "You do not have permission to change system settings." }
    }
    console.error("[updateSystemSettingsAction]", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save the setting. Please try again.",
    }
  }
}
