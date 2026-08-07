"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Archive,
  ArchiveRestore,
  Layers,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  useArchivePlan,
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useUpdatePlan,
} from "../hooks/use-plans"
import {
  BILLING_INTERVALS,
  INTERVAL_MONTHS,
  type Plan,
  type PlanCreate,
  type PlanUpdate,
} from "../api/type"
import { PlanFormDialog } from "./plan-form-dialog"

/** Cents to a display string in whole EGP, or an em dash when not sold. */
function price(cents: number | null): string {
  return cents === null ? "—" : (cents / 100).toLocaleString()
}

export function PlansPanel() {
  const t = useTranslations("Dashboard.plans")
  const { data: plans, isLoading } = usePlans()

  const create = useCreatePlan()
  const update = useUpdatePlan()
  const archive = useArchivePlan()
  const remove = useDeletePlan()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Plan | undefined>()
  const [deleting, setDeleting] = React.useState<Plan | undefined>()

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setFormOpen(true)
  }

  const submit = (body: PlanCreate | PlanUpdate) => {
    const mutation = editing
      ? update.mutateAsync({ slug: editing.slug, body: body as PlanUpdate })
      : create.mutateAsync(body as PlanCreate)

    mutation
      .then(() => {
        toast.success(editing ? t("saved") : t("created"))
        setFormOpen(false)
      })
      // The API message names the offending interval or the blocking counts,
      // so it is shown verbatim rather than replaced with a generic failure.
      .catch((error: Error) => toast.error(error.message))
  }

  const toggleArchive = (plan: Plan) => {
    archive
      .mutateAsync({ slug: plan.slug, archived: !plan.archived })
      .then(() => toast.success(plan.archived ? t("restored") : t("archived")))
      .catch((error: Error) => toast.error(error.message))
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.slug)
      toast.success(t("deleted"))
      setDeleting(undefined)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Layers className="size-5" aria-hidden />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          {t("newPlan")}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {!isLoading && plans && plans.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription>{t("emptyDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="bg-muted rounded px-2 py-1 text-xs">
              npm run seed:subscription-plans -- --apply
            </code>
          </CardContent>
        </Card>
      )}

      {!isLoading && plans && plans.length > 0 && (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.slug} className={plan.archived ? "opacity-70" : ""}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {plan.label}
                      <span className="text-muted-foreground font-mono text-xs font-normal">
                        {plan.slug}
                      </span>
                      {plan.isTrialPlan && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="size-3" aria-hidden />
                          {t("trialBadge")}
                        </Badge>
                      )}
                      {plan.archived && (
                        <Badge variant="outline">{t("archivedBadge")}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {plan.productCap === null
                        ? t("unlimitedProducts")
                        : t("upToProducts", {
                            count: plan.productCap.toLocaleString(),
                          })}
                      {" · "}
                      {t("holders", { count: plan.holderCount })}
                    </CardDescription>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("edit")}
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    {/* Archiving the trial plan would leave new merchants
                        with no capacity, so the API refuses it too. */}
                    <TooltipProvider>
                      <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              plan.archived ? t("restore") : t("archive")
                            }
                            disabled={plan.isTrialPlan && !plan.archived}
                            onClick={() => toggleArchive(plan)}
                            nativeButton
                          >
                            {plan.archived ? (
                              <ArchiveRestore className="size-4" />
                            ) : (
                              <Archive className="size-4" />
                            )}
                          </Button>
                        }
                      />
                        <TooltipContent>
                          {plan.isTrialPlan && !plan.archived
                            ? t("cannotArchiveTrial")
                            : plan.archived
                              ? t("restore")
                              : t("archiveHint")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("delete")}
                      onClick={() => setDeleting(plan)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {BILLING_INTERVALS.map((interval) => {
                    const cents = plan.prices[interval]
                    return (
                      <div
                        key={interval}
                        className="rounded-md border px-3 py-2"
                      >
                        <p className="text-muted-foreground text-xs">
                          {t(`interval.${interval}`)}
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                          {price(cents)}
                          {cents !== null && (
                            <span className="text-muted-foreground ms-1 text-xs font-normal">
                              {t("egp")}
                            </span>
                          )}
                        </p>
                        {cents !== null && (
                          <p className="text-muted-foreground text-xs tabular-nums">
                            {t("perMonth", {
                              amount: Math.round(
                                cents / 100 / INTERVAL_MONTHS[interval]
                              ).toLocaleString(),
                            })}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editing}
        saving={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        onConfirm={confirmDelete}
        isLoading={remove.isPending}
        title={t("deleteTitle", { label: deleting?.label ?? "" })}
        description={
          deleting && deleting.holderCount > 0
            ? t("deleteBlockedHint", { count: deleting.holderCount })
            : t("deleteHint")
        }
        confirmText={t("delete")}
      />
    </div>
  )
}
