import { connection } from "next/server"

import { createImportJob, getImportJobs } from "@/features/imports/api"
import { parseImportsQuery } from "@/features/imports/api/query"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const ALLOWED_IMPORT_EXTENSIONS = [".csv"]
const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * GET /imports — recent job history. `getImportJobs` returns the upstream's
 * raw `{ items, page, limit, total, totalPages }` (no `data` wrapper on
 * that side — see the doc comment on `PaginatedImportJobs`); `jsonSuccess`
 * still wraps it in THIS BFF's own `{ success, data }` envelope, same as
 * `app/api/predictions/route.ts`.
 */
export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager", "admin"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsed = parseImportsQuery(searchParams)
  if (!parsed.ok) return handleServerError(parsed.message, parsed.message, 400)

  try {
    const data = await getImportJobs(parsed.params)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch import jobs")
  }
}

/**
 * POST /imports — multipart/form-data (`file` + `importType`). Forwards the
 * `FormData` straight through: `apiClient` skips setting `Content-Type`
 * when `init.body` is a `FormData`, so the multipart boundary survives
 * (`lib/api/client.ts:90-92`) — never set it manually here.
 */
export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager", "admin"])
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return handleServerError(
      "Invalid request body",
      "Invalid request body",
      400
    )
  }

  // Cheap client-visible guard before spending an upstream round trip — the
  // backend would 400 with the same message anyway
  // (`ImportsService.createImport`), but failing fast here avoids the
  // network hop for the most common mistake (submitting with no file).
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return handleServerError(
      "CSV file is required",
      "CSV file is required",
      400
    )
  }

  const hasAllowedExtension = ALLOWED_IMPORT_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  )
  if (!hasAllowedExtension) {
    return handleServerError(
      "Only .csv files are supported",
      "Only .csv files are supported",
      400
    )
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return handleServerError(
      "File exceeds the 10 MB import size limit",
      "File exceeds the 10 MB import size limit",
      400
    )
  }

  try {
    const data = await createImportJob(formData)
    return jsonSuccess(data, 201)
  } catch (err) {
    return handleUpstreamError(err, "Failed to create import job")
  }
}
