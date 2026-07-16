"use client"

import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3
}

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const t = useTranslations("Checkout")

  const steps = [
    { number: 1, label: t("step1") },
    { number: 2, label: t("step2") },
    { number: 3, label: t("step3") },
  ] as const

  return (
    <div className="flex items-center gap-0 mt-4 mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number
        const isActive = currentStep === step.number

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300",
                  isCompleted && "bg-primary/20 text-primary border-2 border-primary",
                  isActive && "bg-primary text-primary-foreground",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isActive && "text-primary",
                  isCompleted && "text-primary",
                  !isCompleted && !isActive && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-3 mb-5">
                <div
                  className={cn(
                    "h-px transition-colors duration-300",
                    currentStep > step.number ? "bg-primary/50" : "bg-border"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
