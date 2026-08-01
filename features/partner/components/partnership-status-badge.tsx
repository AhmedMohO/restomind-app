import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, Eye, CheckCircle, XCircle, ShieldCheck } from "lucide-react"
import type { PartnershipApplicationStatus } from "../api/type"

interface PartnershipStatusBadgeProps {
  status: PartnershipApplicationStatus
  className?: string
}

export function PartnershipStatusBadge({
  status,
  className,
}: PartnershipStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 rounded-full border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-semibold px-2.5 py-0.5 text-xs",
            className
          )}
        >
          <Clock className="size-3" />
          <span>Pending</span>
        </Badge>
      )
    case "UNDER_REVIEW":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 rounded-full border-blue-500/30 bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-semibold px-2.5 py-0.5 text-xs",
            className
          )}
        >
          <Eye className="size-3" />
          <span>Under Review</span>
        </Badge>
      )
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold px-2.5 py-0.5 text-xs",
            className
          )}
        >
          <CheckCircle className="size-3" />
          <span>Approved</span>
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 rounded-full border-red-500/30 bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-semibold px-2.5 py-0.5 text-xs",
            className
          )}
        >
          <XCircle className="size-3" />
          <span>Rejected</span>
        </Badge>
      )
    case "ONBOARDED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 rounded-full border-purple-500/30 bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 font-semibold px-2.5 py-0.5 text-xs",
            className
          )}
        >
          <ShieldCheck className="size-3" />
          <span>Onboarded</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      )
  }
}
