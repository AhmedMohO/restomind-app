"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/useAuth"
import RefundsTable from "./RefundsTable"
import { useRefunds } from "../hooks/use-refunds"

export function RefundsContainer() {
  const { role, isLoading: isAuthLoading } = useAuth()
  const canReview = role === "admin"

  const { data: refunds = [], isLoading } = useRefunds()

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return <RefundsTable refunds={refunds} canReview={canReview} />
}
