"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Archive,
  ArchiveRestore,
  Building2,
  CheckCircle2,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
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
import { Input } from "@/components/ui/input"
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
  type BillingInterval,
  type Plan,
  type PlanCreate,
  type PlanUpdate,
} from "../api/type"
import { PlanFormDialog } from "./plan-form-dialog"
import { getSavingsPercent, price } from "../utils"

type StatusFilter = "all" | "active" | "archived"

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

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

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

  // Filtered and sorted plans list
  const filteredPlans = React.useMemo(() => {
    if (!plans) return []
    const list = plans.filter((plan) => {
      const matchesSearch =
        search.trim() === "" ||
        plan.label.toLowerCase().includes(search.toLowerCase()) ||
        plan.slug.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !plan.archived) ||
        (statusFilter === "archived" && plan.archived)

      return matchesSearch && matchesStatus
    })

    return list.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [plans, search, statusFilter])

  // Stats summaries
  const totalPlansCount = plans?.length ?? 0
  const activePlansCount = plans?.filter((p) => !p.archived).length ?? 0
  const archivedPlansCount = plans?.filter((p) => p.archived).length ?? 0
  const trialPlanName = plans?.find((p) => p.isTrialPlan)?.label ?? "—"
  const totalHoldersCount =
    plans?.reduce((acc, p) => acc + p.holderCount, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
            <Layers className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="size-4" aria-hidden />
          {t("newPlan")}
        </Button>
      </div>

      {/* Quick Stats Grid */}
      {!isLoading && plans && plans.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Card className="border-border/60 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("stats.totalPlans")}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {totalPlansCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("stats.activePlans")}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {activePlansCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("stats.trialPlan")}
                </p>
                <p className="truncate text-base font-bold">{trialPlanName}</p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("stats.totalSubscribers")}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {totalHoldersCount}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter and Search Controls */}
      {!isLoading && plans && plans.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filter.searchPlaceholder")}
              className="ps-9 pe-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 end-2.5 my-auto flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 self-start rounded-lg border border-border/60 bg-muted/30 p-1 sm:self-auto">
            {(
              [
                { id: "all", count: totalPlansCount },
                { id: "active", count: activePlansCount },
                { id: "archived", count: archivedPlansCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`filter.${tab.id}`)}
                <span className="py-0.2 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      )}

      {/* Empty Seed State */}
      {!isLoading && plans && plans.length === 0 && (
        <Card className="border-dashed border-border/60 p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Layers className="size-6" />
          </div>
          <CardHeader className="p-0 pt-4">
            <CardTitle className="text-lg font-bold">
              {t("emptyTitle")}
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm">
              {t("emptyDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Empty Search/Filter Result */}
      {!isLoading &&
        plans &&
        plans.length > 0 &&
        filteredPlans.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("filter.searchPlaceholder")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
              }}
              className="mt-3"
            >
              {t("filter.all")}
            </Button>
          </Card>
        )}

      {/* Plans List */}
      {!isLoading && filteredPlans.length > 0 && (
        <div className="grid gap-5">
          {filteredPlans.map((plan) => {
            const isTrial = plan.isTrialPlan

            return (
              <Card
                key={plan.slug}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                  plan.archived
                    ? "border-border/50 bg-card/60 opacity-75"
                    : isTrial
                      ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-2xs hover:border-amber-500/50"
                      : "border-border/70 bg-card hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                          {plan.label}
                        </CardTitle>

                        <span className="rounded-md border border-border/50 bg-muted/80 px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                          {plan.slug}
                        </span>

                        {isTrial && (
                          <Badge className="gap-1.5 border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            <Sparkles className="size-3.5" aria-hidden />
                            {t("trialBadge")}
                          </Badge>
                        )}

                        {plan.archived && (
                          <Badge
                            variant="outline"
                            className="gap-1 bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                          >
                            <Archive className="size-3" aria-hidden />
                            {t("archivedBadge")}
                          </Badge>
                        )}
                      </div>

                      {/* Details pills */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Package className="size-3.5 text-primary" />
                          {plan.productCap === null
                            ? t("unlimitedProducts")
                            : t("upToProducts", {
                                count: plan.productCap.toLocaleString(),
                              })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary" />
                          {t("holders", { count: plan.holderCount })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("edit")}
                                onClick={() => openEdit(plan)}
                                className="transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent>{t("edit")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

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
                                className="transition-colors hover:bg-accent"
                              >
                                {plan.archived ? (
                                  <ArchiveRestore className="size-4 text-emerald-600 dark:text-emerald-400" />
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

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("delete")}
                                onClick={() => setDeleting(plan)}
                                className="transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent>{t("delete")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {BILLING_INTERVALS.map((interval) => {
                      const cents = plan.prices[interval]
                      const savings = getSavingsPercent(interval, plan.prices)
                      const isAvailable = cents !== null

                      return (
                        <div
                          key={interval}
                          className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                            isAvailable
                              ? "border-border/60 bg-muted/20 shadow-2xs hover:border-primary/40 hover:bg-card"
                              : "border-dashed border-border/40 bg-muted/10 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {t(`interval.${interval}`)}
                            </span>
                            {savings !== null && (
                              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                {t("saveSavings", { percent: savings })}
                              </Badge>
                            )}
                            {!isAvailable && (
                              <span className="text-[11px] text-muted-foreground">
                                {t("notAvailable")}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 space-y-0.5">
                            <p className="text-xl font-extrabold tracking-tight text-foreground tabular-nums">
                              {price(cents)}
                              {isAvailable && (
                                <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                                  {t("egp")}
                                </span>
                              )}
                            </p>
                            {isAvailable && (
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {t("perMonth", {
                                  amount: Math.round(
                                    cents / 100 / INTERVAL_MONTHS[interval]
                                  ).toLocaleString(),
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
