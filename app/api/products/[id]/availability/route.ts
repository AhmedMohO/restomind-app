import { connection } from "next/server"
import { z } from "zod"

import { changeProductAvailability } from "@/features/products/api"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const PRODUCT_ROLES = ["admin", "manager", "staff"] as const
const availabilitySchema = z.object({ isAvailable: z.boolean() })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, availabilitySchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await changeProductAvailability(id, parsed.data.isAvailable)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update product availability")
  }
}
