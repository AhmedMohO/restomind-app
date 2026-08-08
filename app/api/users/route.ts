import { connection } from "next/server"
import {
  createUser,
  getUsers,
  type ApiUser,
  type CreateUserPayload,
  type PaginatedUsers,
} from "@/features/users/api"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { createUserSchema } from "@/schemas/user"

const USER_ROLES = ["admin", "manager"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(USER_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const role = searchParams.get("role") ?? undefined

  try {
    const data = await getUsers({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
      ...(role ? { role: role as "admin" | "manager" | "customer" | "staff" } : {}),
    })
    return jsonSuccess<PaginatedUsers>(data)
  } catch (err) {
    console.error("[api/users] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch users")
  }
}

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(USER_ROLES)
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, createUserSchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  if (auth.user.role !== "admin") {
    if (body.role === "admin" || body.role === "manager") {
      return handleServerError(
        "Only an admin can assign the admin or manager role",
        "Only an admin can assign the admin or manager role",
        403
      )
    }
    body.restaurantId = auth.user.restaurantId ?? null
  }

  // createUserSchema allows `null` on several optional fields (for clearing
  // values on update-style forms); CreateUserPayload only accepts
  // `string | undefined` for those same fields. Normalize null -> undefined
  // here rather than relaxing the schema or casting past the mismatch.
  const payload: CreateUserPayload = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    password: body.password,
    phone: body.phone,
    role: body.role,
    restaurantId: body.restaurantId ?? undefined,
    gender: body.gender ?? undefined,
    DOB: body.DOB ?? undefined,
    employeeCode: body.employeeCode ?? undefined,
    department: body.department ?? undefined,
    hireDate: body.hireDate ?? undefined,
    notes: body.notes ?? undefined,
  }

  try {
    const res = await createUser(payload)
    return jsonSuccess<ApiUser>(res.data, 201)
  } catch (err) {
    console.error("[api/users] POST failed", err)
    return handleUpstreamError(err, "Failed to create user")
  }
}
