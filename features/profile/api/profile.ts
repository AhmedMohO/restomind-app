import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { UserRole } from "@/features/auth/auth"

export interface ApiImage {
  public_id: string
  secure_url: string
}

export interface UserAddress {
  _id: string
  label?: string
  phoneNumber: string
  street: string
  city: string
  country?: string
  isDefault: boolean
}

export interface FullUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  gender?: "male" | "female"
  phone: string
  isEmailVerified: boolean
  DOB?: string
  image?: ApiImage
  addresses?: UserAddress[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressPayload {
  label?: string
  fullName?: string
  phoneNumber: string
  street: string
  city: string
  country?: string
  isDefault?: boolean
}

/** GET /auth/me — Full profile details of logged-in user */
export async function getProfileApi(): Promise<FullUser> {
  const response = await apiClient("/auth/me")
  return parseOrThrow<FullUser>(response, "getProfileApi")
}

/** PATCH /auth/update-me — Update user details or profile picture (multipart/form-data) */
export async function updateProfileApi(formData: FormData): Promise<FullUser> {
  const response = await apiClient("/auth/update-me", {
    method: "PATCH",
    body: formData,
  })
  return parseOrThrow<FullUser>(response, "updateProfileApi")
}

/** GET /auth/addresses — Saved delivery addresses */
export async function getAddressesApi(): Promise<UserAddress[]> {
  const response = await apiClient("/auth/addresses")
  const json = await parseOrThrow<{ data: UserAddress[] }>(response, "getAddressesApi")
  return json.data || []
}

/** POST /auth/addresses — Add new delivery address */
export async function addAddressApi(payload: AddressPayload): Promise<UserAddress[]> {
  const response = await apiClient("/auth/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const json = await parseOrThrow<{ data: UserAddress[] }>(response, "addAddressApi")
  return json.data || []
}

/** PATCH /auth/addresses/:addressId — Update saved address */
export async function updateAddressApi(
  addressId: string,
  payload: Partial<AddressPayload>
): Promise<UserAddress[]> {
  const response = await apiClient(`/auth/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  const json = await parseOrThrow<{ data: UserAddress[] }>(response, "updateAddressApi")
  return json.data || []
}

/** DELETE /auth/addresses/:addressId — Remove saved address */
export async function deleteAddressApi(addressId: string): Promise<UserAddress[]> {
  const response = await apiClient(`/auth/addresses/${addressId}`, {
    method: "DELETE",
  })
  const json = await parseOrThrow<{ message?: string; data: UserAddress[] }>(response, "deleteAddressApi")
  return json.data || []
}

/** PATCH /auth/addresses/:addressId/default — Set address as active default */
export async function setDefaultAddressApi(addressId: string): Promise<UserAddress[]> {
  const response = await apiClient(`/auth/addresses/${addressId}/default`, {
    method: "PATCH",
  })
  const json = await parseOrThrow<{ data: UserAddress[] }>(response, "setDefaultAddressApi")
  return json.data || []
}
