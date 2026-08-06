"use server"

import {
  archivePlan,
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
  type Plan,
  type PlanCreate,
  type PlanUpdate,
} from "./api"
import { extractApiMessage } from "@/lib/api/utils"

export type PlanResult<T> = { data: T } | { error: string }

/** Server Action: read every plan for the admin screen. */
export async function fetchPlansAction(): Promise<Plan[] | null> {
  try {
    return (await getPlans()).data
  } catch (error) {
    console.error("[fetchPlansAction]", error)
    return null
  }
}

/**
 * Errors are returned rather than thrown throughout this file.
 *
 * The API's refusals are the most useful thing the admin can read — a delete
 * blocked by 17 holders and 240 payments says exactly that, and a broken price
 * ladder names the offending interval. Swallowing them into a generic
 * "something went wrong" would throw away the only actionable part.
 */
export async function createPlanAction(
  body: PlanCreate
): Promise<PlanResult<Plan>> {
  try {
    return { data: await createPlan(body) }
  } catch (error) {
    console.error("[createPlanAction]", error)
    return { error: extractApiMessage(error, "Could not create the plan.") }
  }
}

export async function updatePlanAction(
  slug: string,
  body: PlanUpdate
): Promise<PlanResult<Plan>> {
  try {
    return { data: await updatePlan(slug, body) }
  } catch (error) {
    console.error("[updatePlanAction]", error)
    return { error: extractApiMessage(error, "Could not save the plan.") }
  }
}

export async function archivePlanAction(
  slug: string,
  archived: boolean
): Promise<PlanResult<Plan>> {
  try {
    return { data: await archivePlan(slug, archived) }
  } catch (error) {
    console.error("[archivePlanAction]", error)
    return {
      error: extractApiMessage(error, "Could not change the plan's status."),
    }
  }
}

export async function deletePlanAction(
  slug: string
): Promise<PlanResult<{ slug: string; deleted: boolean }>> {
  try {
    return { data: await deletePlan(slug) }
  } catch (error) {
    console.error("[deletePlanAction]", error)
    return { error: extractApiMessage(error, "Could not delete the plan.") }
  }
}
