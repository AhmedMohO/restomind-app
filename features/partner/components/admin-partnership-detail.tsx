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

  const { data: application, isLoading, isError, refetch } =
    usePartnershipApplicationById(id)

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
        <p className="text-sm text-muted-foreground">
          {t("notFound") || "Partnership application not found."}
        </p>
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/partnership-applications" />
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const ownerFullName = `${application.ownerFirstName} ${application.ownerLastName}`

  const handleMarkReview = async () => {
    try {
      await markReviewMutation.mutateAsync(application._id)
      toast.success(t("reviewSuccess") || "Application marked as Under Review.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status."))
    }
  }

  const handleApproveConfirm = async () => {
    try {
      await approveMutation.mutateAsync(application._id)
      toast.success(
        t("approveSuccess") ||
          "Application approved! Manager account created and setup email sent."
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve application."))
    } finally {
      setApproveOpen(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.")
      return
    }
    try {
      await rejectMutation.mutateAsync({
        id: application._id,
        reason: rejectionReason.trim(),
      })
      toast.success(t("rejectSuccess") || "Application rejected.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject application."))
    } finally {
      setRejectOpen(false)
      setRejectionReason("")
    }
  }

  const handleResendEmail = async () => {
    try {
      await resendEmailMutation.mutateAsync(application._id)
      toast.success(t("resendSuccess") || "Approval setup email resent.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend email."))
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
              {application.businessType} • ID: {application._id}
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
              className="rounded-xl gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {markReviewMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Clock className="size-4" />
              )}
              <span>Mark Under Review</span>
            </Button>
          )}

          {(application.status === "PENDING" ||
            application.status === "UNDER_REVIEW") && (
            <>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                className="rounded-xl gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <XCircle className="size-4" />
                <span>Reject</span>
              </Button>
              <Button
                onClick={() => setApproveOpen(true)}
                className="rounded-xl gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <CheckCircle className="size-4" />
                <span>Approve Application</span>
              </Button>
            </>
          )}

          {application.status === "APPROVED" && (
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resendEmailMutation.isPending}
              className="rounded-xl gap-2"
            >
              {resendEmailMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              <span>Resend Setup Email</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid of detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Business Profile */}
        <Card className="rounded-2xl border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Building className="size-4 text-primary" />
              <span>Business Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Business Name</span>
              <span className="font-semibold">{application.businessName}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Business Type</span>
              <span className="capitalize font-medium">{application.businessType}</span>
            </div>
            {application.commercialRegistration && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3.5" />
                  Commercial Reg
                </span>
                <span className="font-mono text-xs">{application.commercialRegistration}</span>
              </div>
            )}
            {application.website && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="size-3.5" />
                  Social / Website
                </span>
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline truncate max-w-[200px]"
                >
                  {application.website}
                </a>
              </div>
            )}
            {application.notes && (
              <div className="space-y-1 pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  Notes & Special Requests
                </span>
                <p className="text-xs rounded-xl bg-muted/50 p-2.5 leading-relaxed text-foreground">
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
              <span>Owner & Contact Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Owner Name</span>
              <span className="font-semibold">{ownerFullName}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Mail className="size-3.5" />
                Email
              </span>
              <span className="font-medium">{application.email}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Phone className="size-3.5" />
                Phone Number
              </span>
              <span dir="ltr" className="font-mono text-xs">{application.phone}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3.5" />
                City & District
              </span>
              <span>
                {application.city}
                {application.district ? `, ${application.district}` : ""}
              </span>
            </div>
            {application.street && (
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Street</span>
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
              <span>Review Audit & Linked Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-border p-3 space-y-1 bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" />
                Submitted At
              </span>
              <span className="font-semibold text-foreground">
                {application.createdAt
                  ? new Date(application.createdAt).toLocaleString()
                  : "—"}
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-1 bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5" />
                Reviewed By
              </span>
              <span className="font-semibold text-foreground">
                {application.reviewedBy
                  ? `${application.reviewedBy.firstName || ""} ${
                      application.reviewedBy.lastName || ""
                    }`.trim() || application.reviewedBy.email
                  : "Not reviewed yet"}
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-1 bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="size-3.5" />
                Approved By
              </span>
              <span className="font-semibold text-foreground">
                {application.approvedBy
                  ? `${application.approvedBy.firstName || ""} ${
                      application.approvedBy.lastName || ""
                    }`.trim() || application.approvedBy.email
                  : "Not approved yet"}
              </span>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-1 bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <Store className="size-3.5" />
                Created Restaurant ID
              </span>
              <span className="font-mono truncate font-semibold text-foreground">
                {application.restaurantId
                  ? typeof application.restaurantId === "object"
                    ? application.restaurantId._id || application.restaurantId.name
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
        title="Approve Partnership Application?"
        description={`Are you sure you want to approve "${application.businessName}"? This will automatically create a Manager User and Restaurant entity in the system and email an activation setup link to ${application.email}.`}
        confirmText="Approve & Send Setup Link"
        cancelText="Cancel"
        variant="default"
        onConfirm={handleApproveConfirm}
      />

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{application.businessName}&quot;. This reason will be emailed to {application.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason-detail" className="text-xs font-semibold">
              Rejection Reason *
            </Label>
            <Textarea
              id="reject-reason-detail"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
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
              Cancel
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
              <span>Reject Application</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
