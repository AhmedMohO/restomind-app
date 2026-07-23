import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { createUser, getUsers, type ApiUser, type PaginatedUsers, CreateUserPayload } from "@/features/users/api"

export async function GET(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

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
    return NextResponse.json<ApiResponse<PaginatedUsers>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch users",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  let body
  try {
    body = (await request.json()) as CreateUserPayload
    console.log(body);

  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  try {
    const res = await createUser(body)
    return NextResponse.json<ApiResponse<ApiUser>>(
      { success: true, data: res.data },
      { status: 201 }
    )
  } catch (err) {
    console.error("[api/users] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to create user",
      },
      { status: 500 }
    )
  }
}
