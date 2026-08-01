import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  CreatePartnershipPayload,
  PaginatedPartnershipApplications,
  PartnershipApplicationItem,
  PartnershipApplicationStatusResult,
  QueryPartnershipApplicationParams,
} from "./type"

export * from "./type"

/** POST /partnership-applications — Submit partnership application (Public) */
export async function submitPartnershipApplication(
  payload: CreatePartnershipPayload
): Promise<{ message: string; application: PartnershipApplicationItem }> {
  const response = await publicApiClient("/partnership-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ message: string; application: PartnershipApplicationItem }>(
    response,
    "submitPartnershipApplication"
  )
}

/** GET /partnership-applications/status/:id?email=... — Check status (Public) */
export async function checkPartnershipApplicationStatus(
  id: string,
  email: string
): Promise<PartnershipApplicationStatusResult> {
  const response = await publicApiClient(
    `/partnership-applications/status/${id}?email=${encodeURIComponent(email)}`
  )
  return parseOrThrow<PartnershipApplicationStatusResult>(
    response,
    "checkPartnershipApplicationStatus"
  )
}

/** GET /admin/partnership-applications — Admin list view */
export async function getPartnershipApplications(
  params: QueryPartnershipApplicationParams = {}
): Promise<PaginatedPartnershipApplications> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/admin/partnership-applications${qs}`)
  return parseOrThrow<PaginatedPartnershipApplications>(
    response,
    "getPartnershipApplications"
  )
}

/** GET /admin/partnership-applications/:id — Admin details view */
export async function getPartnershipApplicationById(
  id: string
): Promise<PartnershipApplicationItem> {
  const response = await apiClient(`/admin/partnership-applications/${id}`)
  return parseOrThrow<PartnershipApplicationItem>(
    response,
    "getPartnershipApplicationById"
  )
}

/** PATCH /admin/partnership-applications/:id/review — Admin mark under review */
export async function markPartnershipUnderReview(
  id: string
): Promise<PartnershipApplicationItem> {
  const response = await apiClient(
    `/admin/partnership-applications/${id}/review`,
    { method: "PATCH" }
  )
  return parseOrThrow<PartnershipApplicationItem>(
    response,
    "markPartnershipUnderReview"
  )
}

/** POST /admin/partnership-applications/:id/reject — Admin reject application */
export async function rejectPartnershipApplication(
  id: string,
  reason: string
): Promise<PartnershipApplicationItem> {
  const response = await apiClient(
    `/admin/partnership-applications/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  )
  return parseOrThrow<PartnershipApplicationItem>(
    response,
    "rejectPartnershipApplication"
  )
}

/** POST /admin/partnership-applications/:id/approve — Admin approve application */
export async function approvePartnershipApplication(
  id: string
): Promise<{ message: string; userId: string; restaurantId: string; status: string }> {
  const response = await apiClient(
    `/admin/partnership-applications/${id}/approve`,
    { method: "POST" }
  )
  return parseOrThrow<{
    message: string
    userId: string
    restaurantId: string
    status: string
  }>(response, "approvePartnershipApplication")
}

/** POST /admin/partnership-applications/:id/resend-approval-email — Admin resend email */
export async function resendApprovalEmail(
  id: string
): Promise<{ message: string }> {
  const response = await apiClient(
    `/admin/partnership-applications/${id}/resend-approval-email`,
    { method: "POST" }
  )
  return parseOrThrow<{ message: string }>(response, "resendApprovalEmail")
}
