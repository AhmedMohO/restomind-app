import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  archivePlanAction,
  createPlanAction,
  deletePlanAction,
  fetchPlansAction,
  updatePlanAction,
} from "../actions"
import type { Plan, PlanCreate, PlanUpdate } from "../api/type"

export const PLANS_QUERY_KEY = ["admin", "plans"] as const

export function usePlans() {
  return useQuery<Plan[] | null>({
    queryKey: PLANS_QUERY_KEY,
    queryFn: fetchPlansAction,
    staleTime: 30 * 1000,
  })
}

/**
 * Mutations invalidate rather than patching the cache.
 *
 * A write can change more than the row it targets — making a plan the trial
 * plan clears the flag on every other, and holderCount is recomputed server
 * side. Refetching keeps the table honest instead of showing two trial plans.
 */
function useInvalidatePlans() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (body: PlanCreate) => {
      const result = await createPlanAction(body)
      if ("error" in result) throw new Error(result.error)
      return result.data
    },
    onSuccess: invalidate,
  })
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async ({ slug, body }: { slug: string; body: PlanUpdate }) => {
      const result = await updatePlanAction(slug, body)
      if ("error" in result) throw new Error(result.error)
      return result.data
    },
    onSuccess: invalidate,
  })
}

export function useArchivePlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async ({
      slug,
      archived,
    }: {
      slug: string
      archived: boolean
    }) => {
      const result = await archivePlanAction(slug, archived)
      if ("error" in result) throw new Error(result.error)
      return result.data
    },
    onSuccess: invalidate,
  })
}

export function useDeletePlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (slug: string) => {
      const result = await deletePlanAction(slug)
      if ("error" in result) throw new Error(result.error)
      return result.data
    },
    onSuccess: invalidate,
  })
}
