"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"

import { useCart } from "@/hooks/use-cart"
import { createOrderAction } from "@/features/orders/actions"
import { DELIVERY_FEE } from "@/features/checkout/constants"
import { getErrorMessage } from "@/lib/api/utils"
import type { UserAddress } from "@/features/profile/api/profile"

import CheckoutStepper from "./components/CheckoutStepper"
import OrderSummary from "./components/OrderSummary"
import DetailsStep from "./components/DetailsStep"
import DeliveryStep, { type DeliveryMethod } from "./components/DeliveryStep"
import PaymentStep, { type PaymentMethod } from "./components/PaymentStep"

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
}

interface CheckoutFlowProps {
  initialAddresses: UserAddress[]
  customer: {
    fullName: string
    email: string
    phone: string
  }
}

export default function CheckoutFlow({ initialAddresses, customer }: CheckoutFlowProps) {
  const t = useTranslations("Checkout")
  const router = useRouter()
  const { resetCart } = useCart()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [direction, setDirection] = useState(1)

  // Contact details are injected server-side from the profile (docs §9.1), so
  // the flow only carries the customer's optional notes.
  const [specialNotes, setSpecialNotes] = useState("")

  // Saved delivery addresses (mutable so an inline-added address appears instantly)
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddresses.find((a) => a.isDefault)?._id ??
      initialAddresses[0]?._id ??
      null
  )

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  function goForward(next: 1 | 2 | 3) {
    setDirection(1)
    setStep(next)
  }

  function goBack(prev: 1 | 2 | 3) {
    setDirection(-1)
    setStep(prev)
  }

  // Called after the inline AddressDialog successfully saves a new address.
  function handleAddressesChange(updated: UserAddress[], newAddressId?: string) {
    setAddresses(updated)
    if (newAddressId) {
      setSelectedAddressId(newAddressId)
    } else if (!selectedAddressId && updated.length > 0) {
      setSelectedAddressId(updated.find((a) => a.isDefault)?._id ?? updated[0]._id)
    }
  }

  async function handlePlaceOrder() {
    const isHomeDelivery = deliveryMethod === "home"

    // Home Delivery requires a saved address; Store Pickup must omit it.
    if (isHomeDelivery && !selectedAddressId) {
      toast.error(t("selectAddressError"))
      setDirection(-1)
      setStep(1)
      return
    }

    setIsPlacingOrder(true)
    // "Store Pickup" must omit the address entirely (docs §9.1).
    const res = await createOrderAction({
      deliveryMethod: isHomeDelivery ? "Home Delivery" : "Store Pickup",
      ...(isHomeDelivery && selectedAddressId
        ? { deliveryAddress: { addressId: selectedAddressId } }
        : {}),
      ...(specialNotes ? { specialNotes } : {}),
      paymentMethod: "Cash on Delivery",
    })

    if (res.success) {
      resetCart()
      router.push("/checkout/confirmed")
      setIsPlacingOrder(false)
      setStep(1)
      return
    }

    setIsPlacingOrder(false)
    if (res.error === "UNAUTHENTICATED") {
      router.push("/login")
      return
    }
    toast.error(getErrorMessage(res, t("orderError")))
  }

  const deliveryFee = deliveryMethod === "home" ? DELIVERY_FEE : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>

      <CheckoutStepper currentStep={step} />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 items-start">
        {/* Left: Step content */}
        <div className="lg:col-span-2 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {step === 1 && (
                <DetailsStep
                  specialNotes={specialNotes}
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  defaultPhone={customer.phone}
                  defaultName={customer.fullName}
                  onSelectAddress={setSelectedAddressId}
                  onAddressesChange={handleAddressesChange}
                  onContinue={(notes) => {
                    setSpecialNotes(notes)
                    goForward(2)
                  }}
                />
              )}
              {step === 2 && (
                <DeliveryStep
                  deliveryMethod={deliveryMethod}
                  onDeliveryMethodChange={setDeliveryMethod}
                  onContinue={() => goForward(3)}
                  onBack={() => goBack(1)}
                />
              )}
              {step === 3 && (
                <PaymentStep
                  paymentMethod={paymentMethod}
                  deliveryFee={deliveryFee}
                  isPlacingOrder={isPlacingOrder}
                  onPaymentMethodChange={setPaymentMethod}
                  onPlaceOrder={handlePlaceOrder}
                  onBack={() => goBack(2)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <OrderSummary deliveryFee={deliveryFee} />
        </div>
      </div>
    </div>
  )
}
