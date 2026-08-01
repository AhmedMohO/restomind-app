import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type {
  CreatePartnershipPayload,
  PaginatedPartnershipApplications,
  PartnershipApplicationItem,
  PartnershipApplicationStatusResult,
} from "../api/type"

export const PARTNERSHIP_QUERY_KEY = ["partnership-applications"] as const

export interface GetPartnershipApplicationsParams {
  page?: number
  limit?: number
  status?: string
}

export function usePartnershipApplicationsList(
  params: GetPartnershipApplicationsParams = {}
) {
  const queryKey = [...PARTNERSHIP_QUERY_KEY, params] as const
  return useQuery<PaginatedPartnershipApplications>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", String(params.page))
      if (params.limit) searchParams.set("limit", String(params.limit))
      if (params.status && params.status !== "all") {
        searchParams.set("status", params.status)
      }

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
      const res = await clientFetch<unknown>(`/partnership-applications${qs}`)

      if (!res) {
        return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
      }

      const obj = res as Record<string, unknown>

      if (Array.isArray(obj.items)) {
        return {
          items: obj.items as PartnershipApplicationItem[],
          page: Number(obj.page ?? 1),
          limit: Number(obj.limit ?? 10),
          total: Number(obj.total ?? obj.items.length),
          totalPages: Number(obj.totalPages ?? 1),
        }
      }

      return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function usePartnershipApplicationById(id: string) {
  return useQuery<PartnershipApplicationItem | null>({
    queryKey: ["partnership-application", id],
    queryFn: async () => {
      if (!id) return null
      const res = await clientFetch<PartnershipApplicationItem>(
        `/partnership-applications/${id}`
      )
      return res ?? null
    },
    enabled: Boolean(id),
  })
}

export function useSubmitPartnershipApplication() {
  return useMutation({
    mutationFn: async (payload: CreatePartnershipPayload) => {
      const res = await clientFetch<{
        message: string
        application: PartnershipApplicationItem
      }>("/partnership-applications/submit", {
        method: "POST",
        body: payload as unknown as Record<string, unknown>,
      })
      return res
    },
  })
}

export function useCheckPartnershipStatus() {
  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await clientFetch<PartnershipApplicationStatusResult>(
        `/partnership-applications/status/${id}?email=${encodeURIComponent(email)}`
      )
      return res
    },
  })
}

export function useMarkPartnershipUnderReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await clientFetch<PartnershipApplicationItem>(
        `/partnership-applications/${id}/review`,
        { method: "PATCH" }
      )
      return res
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PARTNERSHIP_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["partnership-application", id] })
    },
  })
}

export function useRejectPartnershipApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await clientFetch<PartnershipApplicationItem>(
        `/partnership-applications/${id}/reject`,
        {
          method: "POST",
          body: { reason },
        }
      )
      return res
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PARTNERSHIP_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: ["partnership-application", variables.id],
      })
    },
  })
}

export function useApprovePartnershipApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await clientFetch<{
        message: string
        userId: string
        restaurantId: string
        status: string
      }>(`/partnership-applications/${id}/approve`, {
        method: "POST",
      })
      return res
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PARTNERSHIP_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["partnership-application", id] })
    },
  })
}

export function useResendApprovalEmail() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await clientFetch<{ message: string }>(
        `/partnership-applications/${id}/resend-approval-email`,
        { method: "POST" }
      )
      return res
    },
  })
}
