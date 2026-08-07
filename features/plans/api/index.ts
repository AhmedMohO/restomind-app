import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { Plan, PlanCreate, PlanUpdate } from "./type"

export * from "./type"

/** GET /admin/plans — every plan, archived included, with holder counts. */
export async function getPlans(): Promise<{ data: Plan[] }> {
  const response = await apiClient("/admin/plans")
  return parseOrThrow<{ data: Plan[] }>(response, "getPlans")
}

/** POST /admin/plans */
export async function createPlan(body: PlanCreate): Promise<Plan> {
  const response = await apiClient("/admin/plans", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<Plan>(response, "createPlan")
}

/** PATCH /admin/plans/:slug */
export async function updatePlan(
  slug: string,
  body: PlanUpdate
): Promise<Plan> {
  const response = await apiClient(`/admin/plans/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<Plan>(response, "updatePlan")
}

/** PATCH /admin/plans/:slug/archive */
export async function archivePlan(
  slug: string,
  archived: boolean
): Promise<Plan> {
  const response = await apiClient(
    `/admin/plans/${encodeURIComponent(slug)}/archive`,
    {
      method: "PATCH",
      body: JSON.stringify({ archived }),
      headers: { "Content-Type": "application/json" },
    }
  )
  return parseOrThrow<Plan>(response, "archivePlan")
}

/** DELETE /admin/plans/:slug — refused by the API while the plan is in use. */
export async function deletePlan(
  slug: string
): Promise<{ slug: string; deleted: boolean }> {
  const response = await apiClient(`/admin/plans/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  })
  return parseOrThrow<{ slug: string; deleted: boolean }>(
    response,
    "deletePlan"
  )
}
