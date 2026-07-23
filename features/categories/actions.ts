"use server"

import { getCategories } from "./api"
import type { ApiCategory } from "./api/type"

/** Server Action: Fetch public categories list */
export async function fetchCategoriesAction(): Promise<ApiCategory[]> {
  try {
    const response = await getCategories()
    return response.data;
  } catch (error) {
    console.error("[fetchCategoriesAction] Error fetching categories:", error)
    return []
  }
}
