"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"

import CheckoutStepper from "./components/CheckoutStepper"
import OrderSummary from "./components/OrderSummary"
import DetailsStep, { type DetailsFormData } from "./components/DetailsStep"
import DeliveryStep, { type DeliveryMethod } from "./components/DeliveryStep"
import PaymentStep, { type PaymentMethod } from "./components/PaymentStep"

const DELIVERY_FEE = 15

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

export default function CheckoutFlow() {
  const t = useTranslations("Checkout")
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [direction, setDirection] = useState(1)

  const [formData, setFormData] = useState<DetailsFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    deliveryAddress: "",
    specialNotes: "",
  })
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [promoCode, setPromoCode] = useState("")

  function goForward(next: 1 | 2 | 3) {
    setDirection(1)
    setStep(next)
  }

  function goBack(prev: 1 | 2 | 3) {
    setDirection(-1)
    setStep(prev)
  }

  function handlePlaceOrder() {
    router.push("/checkout/confirmed")
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
                  initialData={formData}
                  onContinue={(data) => {
                    setFormData(data)
                    goForward(2)
                  }}
                />
              )}
              {step === 2 && (
                <DeliveryStep
                  deliveryMethod={deliveryMethod}
                  promoCode={promoCode}
                  onDeliveryMethodChange={setDeliveryMethod}
                  onPromoCodeChange={setPromoCode}
                  onContinue={() => goForward(3)}
                  onBack={() => goBack(1)}
                />
              )}
              {step === 3 && (
                <PaymentStep
                  paymentMethod={paymentMethod}
                  deliveryFee={deliveryFee}
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
