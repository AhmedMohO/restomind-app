import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiUser,
  CreateUserPayload,
  GetUsersParams,
  PaginatedUsers,
  UpdateUserPayload,
} from "./type"

export * from "./type"

/** GET /users — paginated & filtered list (admin or manager) */
export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedUsers> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/users${qs}`)
  return parseOrThrow<PaginatedUsers>(response, "getUsers")
}

/** GET /users/:id — user details (admin or manager) */
export async function getUserById(id: string): Promise<{ data: ApiUser }> {
  const response = await apiClient(`/users/${id}`)
  return parseOrThrow<{ data: ApiUser }>(response, "getUserById")
}

/** POST /users — create user (admin or manager) */
export async function createUser(payload: CreateUserPayload): Promise<{ data: ApiUser }> {
  const response = await apiClient("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiUser }>(response, "createUser")
}

/** PATCH /users/:id — update user (admin or manager) */
export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<{ data: ApiUser }> {
  const response = await apiClient(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiUser }>(response, "updateUser")
}

/** DELETE /users/:id — soft delete user (admin or manager for staff) */
export async function deleteUser(id: string): Promise<{ message: string }> {
  const response = await apiClient(`/users/${id}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "deleteUser")
}

/** PATCH /users/:id/status — activate/deactivate user status */
export async function updateUserStatus(
  id: string,
  isActive: boolean
): Promise<{ _id: string; isActive: boolean; employmentStatus?: string; message?: string }> {
  const response = await apiClient(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
  return parseOrThrow<{ _id: string; isActive: boolean; employmentStatus?: string; message?: string }>(
    response,
    "updateUserStatus"
  )
}

/** POST /users/:id/resend-setup-email — resend invitation setup email */
export async function resendSetupEmail(id: string): Promise<{ message: string }> {
  const response = await apiClient(`/users/${id}/resend-setup-email`, {
    method: "POST",
  })
  return parseOrThrow<{ message: string }>(response, "resendSetupEmail")
}

/** POST /users/:id/reset-password — send password reset email link */
export async function resetUserPassword(id: string): Promise<{ message: string }> {
  const response = await apiClient(`/users/${id}/reset-password`, {
    method: "POST",
  })
  return parseOrThrow<{ message: string }>(response, "resetUserPassword")
}

