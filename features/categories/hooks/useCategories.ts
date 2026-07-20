import { useQuery } from "@tanstack/react-query"
import { fetchCategoriesAction } from "../actions"
import type { ApiCategory } from "../api/type"

export const CATEGORIES_QUERY_KEY = "categories"

/**
 * Custom hook to fetch public categories using TanStack Query.
 */
export function useCategories(initialData?: ApiCategory[]) {
  return useQuery<ApiCategory[]>({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: () => fetchCategoriesAction(),
    initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
