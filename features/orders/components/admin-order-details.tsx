"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Mail, MapPin, Phone, Store, User } from "lucide-react"
import { Link } from "@/i18n/routing"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getErrorMessage } from "@/lib/api/utils"
import type { ApiOrderItem, OrderStatus } from "@/features/orders/api/type"
import type { ApiRestaurantOrder } from "@/features/orders/api/dashboard-types"
import {
  useAdminOrderGroup,
  useUpdateAdminOrderStatus,
} from "@/features/orders/hooks/use-admin-orders"
import { OrderStatusSelect } from "@/features/orders/components/order-status-select"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AdminOrderDetailsProps {
  orderGroupId: string
  locale: string
}



function getOrderId(order: ApiRestaurantOrder) {
  return order._id ?? order.orderId
}

function OrderItemRow({ item }: { item: ApiOrderItem }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {item.quantity}x
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.productTitle}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.offerPrice)}
            {item.offerPrice < item.originalPrice && (
              <span className="ms-2 line-through">
                {formatCurrency(item.originalPrice)}
              </span>
            )}
          </p>
        </div>
      </div>
      <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
    </div>
  )
}

function RestaurantOrderPanel({
  order,
  updatingId,
  onStatusChange,
}: {
  order: ApiRestaurantOrder
  updatingId: string | null
  onStatusChange: (order: ApiRestaurantOrder, status: OrderStatus) => void
}) {
  const t = useTranslations("Dashboard.orders")
  const id = getOrderId(order)

  return (
    <Card className="rounded-xl border-border bg-card p-0 shadow-xs">
      <CardHeader className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
            <Store className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">
              {order.restaurant?.name ?? order.items?.[0]?.restaurantName ?? t("unknownRestaurant")}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              #{id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <OrderStatusSelect
          value={order.status}
          onChange={(next) => onStatusChange(order, next)}
          disabled={updatingId === id}
          className="w-full sm:w-[180px]"
        />
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <Separator />
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <OrderItemRow key={`${item.offerId}-${item.productId}-${index}`} item={item} />
          ))}
        </div>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("subtotal")}</p>
            <p className="font-semibold">{formatCurrency(order.totalOriginalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("discount")}</p>
            <p className="font-semibold text-emerald-600">
              - {formatCurrency(order.totalDiscount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("grandTotal")}</p>
            <p className="font-bold text-primary">
              {formatCurrency(order.finalTotalPrice)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminOrderDetails({ orderGroupId, locale }: AdminOrderDetailsProps) {
  const t = useTranslations("Dashboard.orders")
  const tOrders = useTranslations("Orders")
  const { data, isLoading, isError, refetch } = useAdminOrderGroup(orderGroupId)
  const updateStatus = useUpdateAdminOrderStatus()
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const handleStatusChange = async (order: ApiRestaurantOrder, status: OrderStatus) => {
    const id = getOrderId(order)
    if (!id || status === order.status) return

    setUpdatingId(id)
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(t("statusUpdateSuccess"))
    } catch (err) {
      console.error("[AdminOrderDetails] status update failed", err)
      toast.error(getErrorMessage(err, t("statusUpdateError")))
    } finally {
      setUpdatingId(null)
    }
  }

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
        <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
          {t("retry")}
        </Button>
      </div>
    )
  }

  const address = data.deliveryAddress
    ? [data.deliveryAddress.street, data.deliveryAddress.city, data.deliveryAddress.country]
        .filter(Boolean)
        .join(", ")
    : null

  return (
    <div className="space-y-6">
      <Button
        nativeButton={false}
        render={<Link href="/dashboard/orders" />}
        variant="outline"
        className="gap-2 rounded-xl"
      >
        <ArrowLeft className="size-4" />
        <span>{t("backToOrders")}</span>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("orderDetails")}</h1>
          <p className="font-mono text-xs text-muted-foreground">
            #{data.orderGroupId}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(data.createdAt, locale)}
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
          {tOrders(`status${data.overallStatus.replace(/\s/g, "")}`)}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          {data.orders.map((order) => (
            <RestaurantOrderPanel
              key={getOrderId(order)}
              order={order}
              updatingId={updatingId}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        <Card className="rounded-xl border-border bg-card p-0 shadow-xs lg:sticky lg:top-20">
          <CardHeader className="p-5 pb-0">
            <h2 className="text-base font-bold">{t("sharedInfo")}</h2>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <User className="size-4" />
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  {t("customer")}
                </h3>
              </div>
              <p className="font-semibold">{data.fullName}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="size-3.5" />
                <span>{data.phoneNumber}</span>
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="break-all">{data.emailAddress}</span>
              </p>
            </section>
            <Separator />
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">
                {t("fulfillment")}
              </h3>
              <p className="text-sm font-semibold">{data.deliveryMethod}</p>
              {address && (
                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>{address}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">{data.paymentMethod}</p>
            </section>
            <Separator />
            <section className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("quantity")}</p>
                <p className="font-semibold">{data.totalQuantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("discount")}</p>
                <p className="font-semibold text-emerald-600">
                  - {formatCurrency(data.totalDiscount)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t("grandTotal")}</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(data.finalTotalPrice)}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
