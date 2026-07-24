"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react"
import Image from "next/image"
import { Link, useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDeleteUser, useUsersList } from "../hooks/use-users"
import type { ApiUser } from "../api"
import { UserRoleBadge } from "./user-role-badge"
import { UserStatusBadge } from "./user-status-badge"
import { getErrorMessage } from "@/lib/api/utils"
import { useAuthStore } from "@/features/auth/store/useAuthStore"

export function AdminUserTable() {
  const t = useTranslations("Dashboard.users")
  const router = useRouter()
  const currentUserRole = useAuthStore((s) => s.user?.role)
  const isManager = currentUserRole === "manager"

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>(isManager ? "staff" : "all")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string
    name: string
  } | null>(null)

  const [prevIsManager, setPrevIsManager] = React.useState(isManager)
  if (prevIsManager !== isManager) {
    setPrevIsManager(isManager)
    if (isManager) {
      setRoleFilter("staff")
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const activeRole = isManager ? "staff" : (roleFilter !== "all" ? roleFilter : undefined)

  const { data, isLoading, isError, refetch } = useUsersList({
    page,
    limit,
    search: debouncedSearch || undefined,
    role: activeRole,
  })

  const items = data?.items ?? []
  const total = items.length
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useDeleteUser()

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(t("deleteSuccess"))
    } catch (err) {
      console.error("[AdminUserTable] delete failed", err)
      toast.error(getErrorMessage(err, t("deleteError")))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isManager ? t("managerTitle") : t("adminTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isManager ? t("managerSubtitle") : t("adminSubtitle")}
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/users/new" />}
          className="w-full gap-2 rounded-xl sm:w-auto"
        >
          <Plus className="size-4" />
          <span>{isManager ? t("addStaff") : t("addUser")}</span>
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-full flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-xl pl-9"
          />
        </div>

        {!isManager && (
          <div className="flex items-center gap-3">
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                if (val) setRoleFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder={t("roleAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("roleAll")}</SelectItem>
                <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                <SelectItem value="manager">{t("roleManager")}</SelectItem>
                <SelectItem value="staff">{t("roleStaff")}</SelectItem>
                <SelectItem value="customer">{t("roleCustomer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table container */}
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("noUsers")}</p>
          </div>
        ) : (
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("colUser")}</TableHead>
                <TableHead className="text-start">{t("colEmail")}</TableHead>
                <TableHead className="text-start">{t("colRole")}</TableHead>
                <TableHead className="text-start">{t("colStatus")}</TableHead>
                <TableHead className="text-start">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user: ApiUser) => {
                const fullName = `${user.firstName} ${user.lastName}`
                const isDeletingThis = deletingId === user._id

                return (
                  <TableRow
                    key={user._id}
                    onClick={() => router.push(`/dashboard/users/${user._id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.image?.secure_url ? (
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border">
                            <Image
                              fill
                              src={user.image.secure_url}
                              alt={fullName}
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {user.firstName?.[0]?.toUpperCase() ?? "U"}
                          </div>
                        )}
                        <div className="flex min-w-0 flex-col">
                          <span className="max-w-[160px] truncate font-semibold text-foreground sm:max-w-xs">
                            {fullName}
                          </span>
                          {user.phone && (
                            <span
                              dir="ltr"
                              className="text-xs text-muted-foreground"
                            >
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-[200px]">
                      {user.email}
                    </TableCell>

                    <TableCell className="shrink-0">
                      <UserRoleBadge role={user.role} />
                    </TableCell>

                    <TableCell className="shrink-0">
                      <UserStatusBadge isDeleted={user.isDeleted} />
                    </TableCell>

                    <TableCell className="shrink-0">
                      <div className="flex shrink-0 items-center justify-start gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/users/${user._id}/edit`)
                          }}
                          className="size-8 rounded-lg"
                          title={t("editUser")}
                        >
                          <Edit2 className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeletingThis}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget({
                              id: user._id,
                              name: fullName,
                            })
                          }}
                          className="size-8 rounded-lg text-destructive hover:text-destructive"
                          title={t("deleteBtn")}
                        >
                          {isDeletingThis ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination controls */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l)
          setPage(1)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("deleteConfirmDesc", { name: deleteTarget.name })
            : t("deleteConfirmTitle")
        }
        confirmText={t("deleteBtn")}
        cancelText={t("cancelBtn")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
