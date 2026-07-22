import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type { ApiUser, CreateUserPayload, PaginatedUsers } from "@/features/users/api"

export interface GetUsersQueryKeyParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export const USERS_QUERY_KEY = ["users"] as const

export function useUsersList(params: GetUsersQueryKeyParams = {}) {
  const queryKey = [...USERS_QUERY_KEY, params] as const
  return useQuery<PaginatedUsers>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", String(params.page))
      if (params.limit) searchParams.set("limit", String(params.limit))
      if (params.search) searchParams.set("search", params.search)
      if (params.role) searchParams.set("role", params.role)

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
      const res = await clientFetch<unknown>(`/users${qs}`)

      if (!res) {
        return { items: [], page: 1, limit: 10, totalPages: 1 }
      }

      // Handle raw array response
      if (Array.isArray(res)) {
        return { items: res as ApiUser[], page: 1, limit: 10, totalPages: 1 }
      }

      const obj = res as Record<string, unknown>

      // Handle PaginatedUsers { items: [...] }
      if (Array.isArray(obj.items)) {
        return {
          items: obj.items as ApiUser[],
          page: Number(obj.page ?? 1),
          limit: Number(obj.limit ?? 10),
          totalPages: Number(obj.totalPages ?? 1),
        }
      }

      // Handle nested { data: { items: [...] } } or { data: [...] }
      if (obj.data) {
        if (Array.isArray(obj.data)) {
          return { items: obj.data as ApiUser[], page: 1, limit: 10, totalPages: 1 }
        }
        const dataObj = obj.data as Record<string, unknown>
        if (Array.isArray(dataObj.items)) {
          return {
            items: dataObj.items as ApiUser[],
            page: Number(dataObj.page ?? 1),
            limit: Number(dataObj.limit ?? 10),
            totalPages: Number(dataObj.totalPages ?? 1),
          }
        }
      }

      return { items: [], page: 1, limit: 10, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const data = await clientFetch<ApiUser>("/users", {
        method: "POST",
        body: payload as unknown as Record<string, unknown>,
      })
      return data as ApiUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}
