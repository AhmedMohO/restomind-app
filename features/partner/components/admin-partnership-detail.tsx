"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Loader2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ShieldCheck,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import {
  usePartnershipApplicationById,
  useApprovePartnershipApplication,
  useRejectPartnershipApplication,
  useMarkPartnershipUnderReview,
  useResendApprovalEmail,
} from "../hooks/use-partnership"
import { PartnershipStatusBadge } from "./partnership-status-badge"
import { getErrorMessage } from "@/lib/api/utils"

interface AdminPartnershipDetailProps {
  id: string
}

export function AdminPartnershipDetail({ id }: AdminPartnershipDetailProps) {
  const t = useTranslations("Dashboard.partnershipApplications")

  const {
    data: application,
    isLoading,
    isError,
    refetch,
  } = usePartnershipApplicationById(id)

  const [approveOpen, setApproveOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState("")

  const markReviewMutation = useMarkPartnershipUnderReview()
  const approveMutation = useApprovePartnershipApplication()
  const rejectMutation = useRejectPartnershipApplication()
  const resendEmailMutation = useResendApprovalEmail()

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !application) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/partnership-applications" />
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl"
          >
            {t("retry")}
          </Button>
        </div>
      </div>
    )
  }

  const ownerFullName = `${application.ownerFirstName} ${application.ownerLastName}`

  const handleMarkReview = async () => {
    try {
      await markReviewMutation.mutateAsync(application._id)
      toast.success(t("reviewSuccess"))
    } catch (err) {
      toast.error(getErrorMessage(err, t("updateStatusError")))
    }
  }

  const handleApproveConfirm = async () => {
    try {
      await approveMutation.mutateAsync(application._id)
      toast.success(t("approveSuccess"))
    } catch (err) {
      toast.error(getErrorMessage(err, t("approveError")))
    } finally {
      setApproveOpen(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t("provideRejectReason"))
      return
    }
    try {
      await rejectMutation.mutateAsync({
        id: application._id,
        reason: rejectionReason.trim(),
      })
      toast.success(t("rejectSuccess"))
    } catch (err) {
      toast.error(getErrorMessage(err, t("rejectError")))
    } finally {
      setRejectOpen(false)
      setRejectionReason("")
    }
  }

  const handleResendEmail = async () => {
    try {
      await resendEmailMutation.mutateAsync(application._id)
      toast.success(t("resendSuccess"))
    } catch (err) {
      toast.error(getErrorMessage(err, t("resendError")))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/partnership-applications" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold">
                {application.businessName}
              </h1>
              <PartnershipStatusBadge status={application.status} />
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {application.businessType} • ID: {application.applicationId}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {application.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={handleMarkReview}
              disabled={markReviewMutation.isPending}
              className="gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              {markReviewMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Clock className="size-4" />
              )}
              <span>{t("markUnderReview")}</span>
            </Button>
          )}

          {(application.status === "PENDING" ||
            application.status === "UNDER_REVIEW") && (
            <>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                className="gap-2 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="size-4" />
                <span>{t("reject")}</span>
              </Button>
              <Button
                onClick={() => setApproveOpen(true)}
                className="gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <CheckCircle className="size-4" />
                <span>{t("approveApplication")}</span>
              </Button>
            </>
          )}

          {application.status === "APPROVED" && (
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resendEmailMutation.isPending}
              className="gap-2 rounded-xl"
            >
              {resendEmailMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              <span>{t("resendSetupEmail")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid of detail cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Business Profile */}
        <Card className="rounded-2xl border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Building className="size-4 text-primary" />
              <span>{t("businessProfile")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">{t("businessName")}</span>
              <span className="font-semibold">{application.businessName}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">{t("businessType")}</span>
              <span className="font-medium capitalize">
                {application.businessType}
              </span>
            </div>
            {application.commercialRegistration && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="size-3.5" />
                  {t("commercialReg")}
                </span>
                <span className="font-mono text-xs">
                  {application.commercialRegistration}
                </span>
              </div>
            )}
            {application.website && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Globe className="size-3.5" />
                  {t("website")}
                </span>
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[200px] truncate text-xs text-primary underline"
                >
                  {application.website}
                </a>
              </div>
            )}
            {application.notes && (
              <div className="space-y-1 pt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="size-3.5" />
                  {t("notes")}
                </span>
                <p className="rounded-xl bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground">
                  {application.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Owner & Contact Info */}
        <Card className="rounded-2xl border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <User className="size-4 text-primary" />
              <span>{t("ownerDetails")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">{t("ownerName")}</span>
              <span className="font-semibold">{ownerFullName}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Mail className="size-3.5" />
                {t("email")}
              </span>
              <span className="font-medium">{application.email}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="size-3.5" />
                {t("phone")}
              </span>
              <span dir="ltr" className="font-mono text-xs">
                {application.phone}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                {t("cityDistrict")}
              </span>
              <span>
                {application.city}
                {application.district ? `, ${application.district}` : ""}
              </span>
            </div>
            {application.street && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("street")}</span>
                <span>{application.street}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Review Timeline & Linked Account */}
        <Card className="rounded-2xl border border-border md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="size-4 text-primary" />
              <span>{t("reviewAudit")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="size-3.5" />
                {t("submittedAt")}
              </span>
              <span className="font-semibold text-foreground">
                {application.createdAt
                  ? new Date(application.createdAt).toLocaleString()
                  : "—"}
              </span>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" />
                {t("reviewedBy")}
              </span>
              <span className="font-semibold text-foreground">
                {application.reviewedBy
                  ? `${application.reviewedBy.firstName || ""} ${
                      application.reviewedBy.lastName || ""
                    }`.trim() || application.reviewedBy.email
                  : t("notReviewedYet")}
              </span>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3">
              <span className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="size-3.5" />
                {t("approvedBy")}
              </span>
              <span className="font-semibold text-foreground">
                {application.approvedBy
                  ? `${application.approvedBy.firstName || ""} ${
                      application.approvedBy.lastName || ""
                    }`.trim() || application.approvedBy.email
                  : t("notApprovedYet")}
              </span>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Store className="size-3.5" />
                {t("createdRestaurantId")}
              </span>
              <span className="truncate font-mono font-semibold text-foreground">
                {application.restaurantId
                  ? typeof application.restaurantId === "object"
                    ? application.restaurantId._id ||
                      application.restaurantId.name
                    : application.restaurantId
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approve Modal */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={t("approveModalTitle")}
        description={t("approveModalDesc", {
          name: application.businessName,
          email: application.email,
        })}
        confirmText={t("approveModalConfirm")}
        cancelText={t("cancel")}
        variant="default"
        onConfirm={handleApproveConfirm}
      />

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("rejectModalTitle")}</DialogTitle>
            <DialogDescription>
              {t("rejectModalDesc", {
                name: application.businessName,
                email: application.email,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label
              htmlFor="reject-reason-detail"
              className="text-xs font-semibold"
            >
              {t("rejectionReasonLabel")}
            </Label>
            <Textarea
              id="reject-reason-detail"
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
                setRejectOpen(false)
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
              className="gap-2 rounded-xl"
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
