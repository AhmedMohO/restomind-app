"use server"

import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettings,
  type SystemSettingsUpdate,
} from "./api"

/** Server Action: read the platform switches. */
export async function fetchSystemSettingsAction(): Promise<SystemSettings | null> {
  try {
    return await getSystemSettings()
  } catch (error) {
    console.error("[fetchSystemSettingsAction]", error)
    return null
  }
}

/**
 * Server Action: change one or more switches.
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
    return { settings: await updateSystemSettings(body) }
  } catch (error) {
    console.error("[updateSystemSettingsAction]", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save the setting. Please try again.",
    }
  }
}
