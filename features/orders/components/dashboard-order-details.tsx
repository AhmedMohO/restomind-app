"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Link } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/api/utils"
import type {
  ApiChildOrder,
  ApiGroupSubOrder,
  OrderStatus,
} from "@/features/orders/api/type"
import {
  useDashboardOrderDetails,
  useUpdateOrderStatus,
} from "@/features/orders/hooks/use-dashboard-orders"
import OrderDetailsPage from "@/features/orders/components/OrderDetailsPage"
import { OrderStatusSelect } from "@/features/orders/components/order-status-select"

interface DashboardOrderDetailsProps {
  groupOrderId: string
  locale: string
}

function subOrderId(order: ApiGroupSubOrder | ApiChildOrder): string {
  return "orderId" in order ? order.orderId : order._id
}

/**
 * Order details for every dashboard role.
 *
 * The BFF scopes details to the caller: admins get group orders, managers get child orders (`GET /orders/:id`).
 */
export function DashboardOrderDetails({
  groupOrderId,
  locale,
}: DashboardOrderDetailsProps) {
  const t = useTranslations("Dashboard.orders")
  const { data, isLoading, isError, refetch } =
    useDashboardOrderDetails(groupOrderId)
  const updateStatus = useUpdateOrderStatus()
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const handleStatusChange = React.useCallback(
    async (order: ApiGroupSubOrder | ApiChildOrder, status: OrderStatus) => {
      if (!status || status === order.status) return
      const id = subOrderId(order)

      setUpdatingId(id)
      try {
        await updateStatus.mutateAsync({ id, status })
        toast.success(t("statusUpdateSuccess"))
      } catch (err) {
        console.error("[DashboardOrderDetails] status update failed", err)
        toast.error(getErrorMessage(err, t("statusUpdateError")))
      } finally {
        setUpdatingId(null)
      }
    },
    [t, updateStatus]
  )

  const renderStatusControl = React.useCallback(
    (order: ApiGroupSubOrder | ApiChildOrder) => (
      <OrderStatusSelect
        value={order.status}
        onChange={(next) => handleStatusChange(order, next)}
        disabled={updatingId === subOrderId(order)}
        className="w-full sm:w-[190px]"
      />
    ),
    [handleStatusChange, updatingId]
  )


  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{t("detailFetchError")}</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-xl"
        >
          {t("retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        nativeButton={false}
        render={<Link href="/dashboard/orders" />}
        variant="outline"
        className="gap-2 rounded-xl"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        <span>{t("backToOrders")}</span>
      </Button>

      <OrderDetailsPage
        orderGroup={data}
        locale={locale}
        renderStatusControl={renderStatusControl}
      />
    </div>
  )
}
