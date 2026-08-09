"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Edit2,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Power,
  Search,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { Link, useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  useDeleteUser,
  useResendSetupEmail,
  useResetUserPassword,
  useUpdateUserStatus,
  useUsersList,
} from "../hooks/use-users"
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
  const [roleFilter, setRoleFilter] = React.useState<string>(
    isManager ? "staff" : "all"
  )
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [resendingId, setResendingId] = React.useState<string | null>(null)
  const [resettingId, setResettingId] = React.useState<string | null>(null)

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

  const activeRole = isManager
    ? "staff"
    : roleFilter !== "all"
      ? roleFilter
      : undefined

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
  const statusMutation = useUpdateUserStatus()
  const resendMutation = useResendSetupEmail()
  const resetPasswordMutation = useResetUserPassword()

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

  const handleToggleStatus = async (user: ApiUser, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = user.isActive === false ? true : false
    setTogglingId(user._id)
    try {
      await statusMutation.mutateAsync({ id: user._id, isActive: nextStatus })
      toast.success(
        nextStatus
          ? t("statusActivatedSuccess") ||
              "User account activated successfully!"
          : t("statusDeactivatedSuccess") ||
              "User account deactivated successfully!"
      )
    } catch (err) {
      console.error("[AdminUserTable] status toggle failed", err)
      toast.error(
        getErrorMessage(
          err,
          t("statusUpdateError") || "Failed to update user status"
        )
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleResendSetup = async (user: ApiUser, e: React.MouseEvent) => {
    e.stopPropagation()
    setResendingId(user._id)
    try {
      const res = await resendMutation.mutateAsync(user._id)
      toast.success(
        res?.message || t("resendSuccess") || "Setup email resent successfully!"
      )
    } catch (err) {
      console.error("[AdminUserTable] resend setup failed", err)
      toast.error(
        getErrorMessage(err, t("resendError") || "Failed to resend setup email")
      )
    } finally {
      setResendingId(null)
    }
  }

  const handleResetPassword = async (user: ApiUser, e: React.MouseEvent) => {
    e.stopPropagation()
    setResettingId(user._id)
    try {
      const res = await resetPasswordMutation.mutateAsync(user._id)
      toast.success(
        res?.message ||
          t("resetPasswordSuccess") ||
          "Password reset link sent to staff email!"
      )
    } catch (err) {
      console.error("[AdminUserTable] reset password failed", err)
      toast.error(
        getErrorMessage(
          err,
          t("resetPasswordError") || "Failed to send reset link"
        )
      )
    } finally {
      setResettingId(null)
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
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-full flex-1 flex-col gap-1.5 sm:max-w-sm">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-user-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="rounded-xl ps-9"
            />
          </div>
        </div>

        {!isManager && (
          <div className="flex flex-col gap-2">
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                if (val) setRoleFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger
                id="admin-role-filter"
                aria-label={t("role")}
                className="w-full rounded-xl sm:w-[150px]"
              >
                <SelectValue placeholder={t("roleAll")}>
                  {roleFilter === "all"
                    ? t("roleAll")
                    : roleFilter === "admin"
                      ? t("roleAdmin")
                      : roleFilter === "manager"
                        ? t("roleManager")
                        : roleFilter === "staff"
                          ? t("roleStaff")
                          : roleFilter === "customer"
                            ? t("roleCustomer")
                            : undefined}
                </SelectValue>
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
          <Table className="min-w-[650px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("colUser")}</TableHead>
                <TableHead className="text-start">{t("colEmail")}</TableHead>
                <TableHead className="text-start">{t("colRole")}</TableHead>
                <TableHead className="text-start">
                  {t("colDepartment") || "Dept / Code"}
                </TableHead>
                <TableHead className="text-start">{t("colStatus")}</TableHead>
                <TableHead className="text-start">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user: ApiUser) => {
                const fullName = `${user.firstName} ${user.lastName}`
                const isDeletingThis = deletingId === user._id
                const isTogglingThis = togglingId === user._id
                const isResendingThis = resendingId === user._id
                const isResettingThis = resettingId === user._id

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

                    <TableCell className="text-xs text-muted-foreground">
                      {user.department || user.employeeCode ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {user.department || "Staff"}
                          </span>
                          {user.employeeCode && (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {user.employeeCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="shrink-0">
                      <UserStatusBadge
                        isDeleted={user.isDeleted}
                        isActive={user.isActive}
                        isEmailVerified={user.isEmailVerified}
                      />
                    </TableCell>

                    <TableCell className="shrink-0">
                      <div className="flex shrink-0 items-center justify-start gap-1">
                        {/* Status Active Toggle */}
                        {!user.isDeleted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isTogglingThis}
                            onClick={(e) => handleToggleStatus(user, e)}
                            className={
                              user.isActive !== false
                                ? "size-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                : "size-8 rounded-lg text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                            }
                            title={
                              user.isActive !== false
                                ? t("deactivateUser") || "Deactivate Account"
                                : t("activateUser") || "Activate Account"
                            }
                          >
                            {isTogglingThis ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Power className="size-4" />
                            )}
                          </Button>
                        )}

                        {/* Resend Setup Email */}
                        {user.role === "staff" &&
                          (user.isActive === false || !user.isEmailVerified) &&
                          !user.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isResendingThis}
                              onClick={(e) => handleResendSetup(user, e)}
                              className="size-8 rounded-lg text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
                              title={
                                t("resendSetupEmail") ||
                                "Resend Setup Invitation Link"
                              }
                            >
                              {isResendingThis ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Mail className="size-4" />
                              )}
                            </Button>
                          )}

                        {/* Reset Password Email */}
                        {user.role === "staff" &&
                          user.isActive &&
                          user.isEmailVerified &&
                          !user.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isResettingThis}
                              onClick={(e) => handleResetPassword(user, e)}
                              className="size-8 rounded-lg text-purple-600 hover:bg-purple-500/10 hover:text-purple-700"
                              title={
                                t("resetPassword") || "Send Password Reset Link"
                              }
                            >
                              {isResettingThis ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <KeyRound className="size-4" />
                              )}
                            </Button>
                          )}

                        {/* Edit Button */}
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

                        {/* Delete Button */}
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
