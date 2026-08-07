"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  MoreHorizontal,
  Clock,
} from "lucide-react"
import { useRouter } from "@/i18n/routing"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import {
  usePartnershipApplicationsList,
  useApprovePartnershipApplication,
  useRejectPartnershipApplication,
  useMarkPartnershipUnderReview,
  useResendApprovalEmail,
} from "../hooks/use-partnership"
import type { PartnershipApplicationItem } from "../api/type"
import { PartnershipStatusBadge } from "./partnership-status-badge"
import { getErrorMessage } from "@/lib/api/utils"

export function AdminPartnershipTable() {
  const t = useTranslations("Dashboard.partnershipApplications")
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  // Dialog states
  const [approveTarget, setApproveTarget] =
    React.useState<PartnershipApplicationItem | null>(null)
  const [rejectTarget, setRejectTarget] =
    React.useState<PartnershipApplicationItem | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")

  const { data, isLoading, isError, refetch } = usePartnershipApplicationsList({
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  const rawItems = data?.items ?? []
  // Filter locally by search term (businessName, ownerName, email)
  const items = React.useMemo(() => {
    if (!search.trim()) return rawItems
    const query = search.toLowerCase()
    return rawItems.filter(
      (item) =>
        item.businessName.toLowerCase().includes(query) ||
        `${item.ownerFirstName} ${item.ownerLastName}`
          .toLowerCase()
          .includes(query) ||
        item.email.toLowerCase().includes(query)
    )
  }, [rawItems, search])

  const total = data?.total ?? items.length
  const totalPages = data?.totalPages ?? 1

  const markReviewMutation = useMarkPartnershipUnderReview()
  const approveMutation = useApprovePartnershipApplication()
  const rejectMutation = useRejectPartnershipApplication()
  const resendEmailMutation = useResendApprovalEmail()

  const handleMarkReview = async (id: string) => {
    try {
      await markReviewMutation.mutateAsync(id)
      toast.success(t("reviewSuccess") || "Application marked as Under Review.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status."))
    }
  }

  const handleApproveConfirm = async () => {
    if (!approveTarget) return
    try {
      await approveMutation.mutateAsync(approveTarget._id)
      toast.success(
        t("approveSuccess") ||
          "Application approved! Manager account created and setup email sent."
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve application."))
    } finally {
      setApproveTarget(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.")
      return
    }
    try {
      await rejectMutation.mutateAsync({
        id: rejectTarget._id,
        reason: rejectionReason.trim(),
      })
      toast.success(t("rejectSuccess") || "Application rejected.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject application."))
    } finally {
      setRejectTarget(null)
      setRejectionReason("")
    }
  }

  const handleResendEmail = async (id: string) => {
    try {
      await resendEmailMutation.mutateAsync(id)
      toast.success(t("resendSuccess") || "Approval setup email resent.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend email."))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {t("title") || "Partnership Applications"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle") ||
              "Manage restaurant & bakery partner requests, review business profiles, and approve accounts."}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full max-w-full flex-1 flex-col gap-1.5 sm:max-w-sm">
          <Label
            htmlFor="partnership-search"
            className="text-xs font-semibold text-muted-foreground"
          >
            {t("searchLabel") || "Search applications"}
          </Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="partnership-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                t("searchPlaceholder") || "Search by business, owner, email..."
              }
              className="rounded-xl ps-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="partnership-status-filter"
            className="text-xs font-semibold whitespace-nowrap text-muted-foreground"
          >
            {t("statusFilter") || "Status"}:
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger
              id="partnership-status-filter"
              aria-label="Filter status"
              className="w-[160px] rounded-xl"
            >
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="PENDING">{t("statuses.pending")}</SelectItem>
              <SelectItem value="UNDER_REVIEW">{t("statuses.underReview")}</SelectItem>
              <SelectItem value="APPROVED">{t("statuses.approved")}</SelectItem>
              <SelectItem value="REJECTED">{t("statuses.rejected")}</SelectItem>
              <SelectItem value="ONBOARDED">{t("statuses.onboarded")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("fetchError")}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("noApplications")}
            </p>
          </div>
        ) : (
          <Table className="min-w-[700px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("colBusiness")}
                </TableHead>
                <TableHead className="text-start">
                  {t("colOwner")}
                </TableHead>
                <TableHead className="text-start">
                  {t("colLocation")}
                </TableHead>
                <TableHead className="text-start">
                  {t("colStatus")}
                </TableHead>
                <TableHead className="text-start">
                  {t("colDate")}
                </TableHead>
                <TableHead className="text-end">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((app: PartnershipApplicationItem) => {
                const ownerFullName = `${app.ownerFirstName} ${app.ownerLastName}`
                const formattedDate = app.createdAt
                  ? new Date(app.createdAt).toLocaleDateString()
                  : "—"

                return (
                  <TableRow
                    key={app._id}
                    onClick={() =>
                      router.push(
                        `/dashboard/partnership-applications/${app._id}`
                      )
                    }
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {app.businessName}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {app.businessType}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {ownerFullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {app.email}
                        </span>
                        {app.phone && (
                          <span
                            dir="ltr"
                            className="text-xs text-muted-foreground"
                          >
                            {app.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {app.city}
                      {app.district ? `, ${app.district}` : ""}
                    </TableCell>

                    <TableCell>
                      <PartnershipStatusBadge status={app.status} />
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formattedDate}
                    </TableCell>

                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 rounded-lg" />}>
                            <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>{t("colActions")}</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/partnership-applications/${app._id}`
                                )
                              }
                            >
                              <Eye className="size-4 me-2" />
                              <span>{t("viewDetails")}</span>
                            </DropdownMenuItem>

                            {app.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => handleMarkReview(app._id)}
                              >
                                <Clock className="size-4 me-2 text-blue-600" />
                                <span>{t("markUnderReview")}</span>
                              </DropdownMenuItem>
                            )}

                            {(app.status === "PENDING" ||
                              app.status === "UNDER_REVIEW") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setApproveTarget(app)}
                                  className="text-emerald-600 focus:text-emerald-600"
                                >
                                  <CheckCircle className="size-4 me-2" />
                                  <span>{t("approveApplication")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRejectTarget(app)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="size-4 me-2" />
                                  <span>{t("reject")}</span>
                                </DropdownMenuItem>
                              </>
                            )}

                            {app.status === "APPROVED" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleResendEmail(app._id)}
                                >
                                  <Mail className="size-4 me-2 text-purple-600" />
                                  <span>{t("resendSetupEmail")}</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
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

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null)
        }}
        title={t("approveModalTitle")}
        description={
          approveTarget
            ? t("approveModalDesc", {
                name: approveTarget.businessName,
                email: approveTarget.email,
              })
            : ""
        }
        confirmText={t("approveModalConfirm")}
        cancelText={t("cancel")}
        variant="default"
        onConfirm={handleApproveConfirm}
      />

      {/* Reject Reason Dialog */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectionReason("")
          }
        }}
      >
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rejectModalTitle")}</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? t("rejectModalDesc", {
                    name: rejectTarget.businessName,
                    email: rejectTarget.email,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason" className="text-xs font-semibold">
              {t("rejectionReasonLabel")}
            </Label>
            <Textarea
              id="reject-reason"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("rejectionReasonPlaceholder")}
              className="rounded-xl text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null)
                setRejectionReason("")
              }}
              className="rounded-xl"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="rounded-xl gap-2"
            >
              {rejectMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              <span>{t("reject")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
