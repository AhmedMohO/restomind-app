import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  fetchSystemSettingsAction,
  updateSystemSettingsAction,
} from "../actions"
import type { SystemSettings, SystemSettingsUpdate } from "../api/type"

export const SYSTEM_SETTINGS_QUERY_KEY = ["system-settings"] as const

export function useSystemSettings() {
  return useQuery<SystemSettings | null>({
    queryKey: SYSTEM_SETTINGS_QUERY_KEY,
    queryFn: fetchSystemSettingsAction,
    staleTime: 30 * 1000,
  })
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: SystemSettingsUpdate) => {
      const result = await updateSystemSettingsAction(body)
      if ("error" in result) throw new Error(result.error)
      return result.settings
    },
    // The response is the settings as they now stand, including a recounted
    // earlyBirdClaimed. Writing it straight into the cache avoids a refetch
    // that could momentarily show the old value back.
    onSuccess: (settings) => {
      queryClient.setQueryData(SYSTEM_SETTINGS_QUERY_KEY, settings)
    },
  })
}
