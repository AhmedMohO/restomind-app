import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiOffer,
  CreateOfferInput,
  GetActiveOffersParams,
  GetOffersParams,
  PaginatedOffers,
  UpdateOfferInput,
} from "@/features/offers/api/type"

export const OFFERS_QUERY_KEY = ["offers"] as const
export const ACTIVE_OFFERS_LIST_QUERY_KEY = ["offers", "active"] as const

export function useActiveOffersList(
  params: GetActiveOffersParams = {},
  options?: { initialData?: PaginatedOffers }
) {
  return useQuery<PaginatedOffers>({
    queryKey: [...ACTIVE_OFFERS_LIST_QUERY_KEY, params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedOffers>(`/offers/active${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
    initialData: options?.initialData,
  })
}

export function useOffersList(params: GetOffersParams = {}) {
  return useQuery<PaginatedOffers>({
    queryKey: [...OFFERS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedOffers>(`/offers${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function useOfferById(id: string | null) {
  return useQuery<ApiOffer | null>({
    queryKey: [...OFFERS_QUERY_KEY, "details", id],
    queryFn: async () => {
      if (!id) return null
      const res = await clientFetch<ApiOffer>(`/offers/${id}`)
      return res ?? null
    },
    enabled: Boolean(id),
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOfferInput) => {
      const res = await clientFetch<ApiOffer>("/offers", {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
      })
      return res as ApiOffer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY })
    },
  })
}

export function useUpdateOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOfferInput }) => {
      const res = await clientFetch<ApiOffer>(`/offers/${id}`, {
        method: "PATCH",
        body: data as unknown as Record<string, unknown>,
      })
      return res as ApiOffer
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...OFFERS_QUERY_KEY, "details", variables.id],
      })
    },
  })
}

export function useCancelOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await clientFetch<ApiOffer>(`/offers/${id}/cancel`, {
        method: "PATCH",
      })
      return res as ApiOffer
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...OFFERS_QUERY_KEY, "details", id],
      })
    },
  })
}
