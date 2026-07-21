import {
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { cn } from "@/lib/utils"

interface SharedInfoPanelProps {
  orderGroup: ApiOrderGroup
  t: (key: string) => string
  className?: string
  mobile?: boolean
}

function SharedInfoContent({
  orderGroup,
  t,
}: Omit<SharedInfoPanelProps, "className" | "mobile">) {
  const address = orderGroup.deliveryAddress
    ? [
        orderGroup.deliveryAddress.street,
        orderGroup.deliveryAddress.city,
        orderGroup.deliveryAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : null

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
          <User className="size-4" />
          <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("customer")}
          </h4>
        </div>
        <div className="space-y-1.5 text-start text-xs text-muted-foreground">
          <p className="font-semibold text-[#2B1B15] dark:text-neutral-200">
            {orderGroup.fullName}
          </p>
          <p className="flex min-w-0 items-center gap-1.5">
            <Phone className="size-3.5 shrink-0" />
            <span className="break-words">{orderGroup.phoneNumber}</span>
          </p>
          <p className="flex min-w-0 items-center gap-1.5">
            <Mail className="size-3.5 shrink-0" />
            <span className="break-words">{orderGroup.emailAddress}</span>
          </p>
        </div>
      </section>

      <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
          <Truck className="size-4" />
          <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("deliveryMethod")}
          </h4>
        </div>
        <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
          {orderGroup.deliveryMethod === "Home Delivery"
            ? t("homeDelivery")
            : t("storePickup")}
        </p>
        {address && (
          <p className="flex items-start gap-1.5 text-start text-xs leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0 break-words">{address}</span>
          </p>
        )}
      </section>

      <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
          <CreditCard className="size-4" />
          <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("paymentMethod")}
          </h4>
        </div>
        <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
          {orderGroup.paymentMethod === "Cash on Delivery"
            ? t("cashOnDelivery")
            : orderGroup.paymentMethod}
        </p>
      </section>

      {orderGroup.specialNotes && (
        <>
          <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
              <FileText className="size-4" />
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("specialNotes")}
              </h4>
            </div>
            <p className="dark:bg-neutral-850 rounded-2xl border border-[#ECE6DB]/60 bg-[#FAF7F2] p-3.5 text-start text-xs leading-relaxed text-muted-foreground italic dark:border-neutral-800">
              &quot;{orderGroup.specialNotes}&quot;
            </p>
          </section>
        </>
      )}
    </div>
  )
}

export default function SharedInfoPanel({
  orderGroup,
  t,
  className,
  mobile = false,
}: SharedInfoPanelProps) {
  if (mobile) {
    return (
      <Accordion className={cn("lg:hidden", className)} defaultValue={[]}>
        <AccordionItem
          value="shared-info"
          className="rounded-2xl border border-[#ECE6DB] bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <AccordionTrigger className="py-3 font-serif text-base font-bold text-[#2B1B15] hover:no-underline dark:text-neutral-100">
            {t("sharedInfo")}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <SharedInfoContent orderGroup={orderGroup} t={t} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  return (
    <Card
      className={cn(
        "hidden rounded-[24px] border-[#ECE6DB] bg-white p-0 shadow-xs lg:flex dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      <CardHeader className="px-5 pt-5 pb-0">
        <h2 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
          {t("sharedInfo")}
        </h2>
      </CardHeader>
      <CardContent className="p-5">
        <SharedInfoContent orderGroup={orderGroup} t={t} />
      </CardContent>
    </Card>
  )
}
