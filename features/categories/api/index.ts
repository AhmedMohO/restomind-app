import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiCategory } from "./type"

export * from "./type"

/** GET /categories — view all categories (public) */
export async function getCategories(): Promise<{ data: ApiCategory[] }> {
  const response = await publicApiClient("/categories")
  return parseOrThrow<{ data: ApiCategory[] }>(response, "getCategories")
}

/** GET /categories/:id — get category by ID (admin only) */
export async function getCategoryById(id: string): Promise<{ data: ApiCategory }> {
  const response = await apiClient(`/categories/${id}`)
  return parseOrThrow<{ data: ApiCategory }>(response, "getCategoryById")
}

/** POST /categories — create category (admin only, multipart/form-data) */
export async function createCategory(formData: FormData): Promise<{ data: ApiCategory }> {
  const response = await apiClient("/categories", {
    method: "POST",
    body: formData,
  })
  return parseOrThrow<{ data: ApiCategory }>(response, "createCategory")
}

/** PATCH /categories/:id — update category (admin only, multipart/form-data) */
export async function updateCategory(
  id: string,
  formData: FormData
): Promise<{ data: ApiCategory }> {
  const response = await apiClient(`/categories/${id}`, {
    method: "PATCH",
    body: formData,
  })
  return parseOrThrow<{ data: ApiCategory }>(response, "updateCategory")
}

/** DELETE /categories/:id — soft delete category (admin only) */
export async function deleteCategory(id: string): Promise<{ message: string }> {
  const response = await apiClient(`/categories/${id}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "deleteCategory")
}
