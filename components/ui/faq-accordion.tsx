"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { HelpCircle, Plus, Minus } from "lucide-react"

export interface FaqItem {
  question: string
  answer: React.ReactNode
}

export interface FaqAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: FaqItem[]
  title?: string
  subtitle?: string
  badgeText?: string
}

export function FaqAccordion({
  items = [],
  title,
  subtitle,
  badgeText,
  className,
  ...props
}: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl px-4 py-8 font-sans space-y-8",
        className
      )}
      {...props}
    >
      {/* Header */}
      {(title || badgeText) && (
        <div className="space-y-3 text-center">
          {badgeText && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7C4A27]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#7C4A27] dark:bg-[#C2733C]/20 dark:text-[#E68A49]">
              <HelpCircle className="size-4" />
              <span>{badgeText}</span>
            </div>
          )}

          {title && (
            <h2 className="text-center font-serif text-3xl font-bold text-[#2B1B15] sm:text-4xl dark:text-stone-100">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Accordion List */}
      <ul className="mx-auto flex w-full flex-col gap-3.5 p-0 list-none">
        {items.map((item, index) => {
          const isActive = activeIndex === index
          return (
            <li
              key={index}
              className={cn(
                "w-full overflow-hidden rounded-2xl border transition-all duration-300",
                isActive
                  ? "border-[#7C4A27]/30 bg-stone-50/80 shadow-md dark:border-[#C2733C]/30 dark:bg-neutral-900/90"
                  : "border-stone-200 bg-white hover:border-stone-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700"
              )}
            >
              <button
                className="flex w-full cursor-pointer items-center justify-between py-4.5 px-5 text-left outline-none transition-colors duration-200 sm:px-6 rtl:text-right"
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
              >
                <span
                  className={cn(
                    "pr-4 text-base font-medium transition-colors sm:text-lg rtl:pr-0 rtl:pl-4",
                    isActive
                      ? "font-semibold text-[#7C4A27] dark:text-[#E68A49]"
                      : "text-stone-800 dark:text-stone-200"
                  )}
                >
                  {item.question}
                </span>

                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                    isActive
                      ? "rotate-180 bg-[#7C4A27] text-white dark:bg-[#C2733C]"
                      : "bg-stone-100 text-stone-500 dark:bg-neutral-800 dark:text-stone-400"
                  )}
                >
                  {isActive ? (
                    <Minus className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                </span>
              </button>

              <div
                className={cn(
                  "grid w-full transition-all duration-300 ease-in-out",
                  isActive
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-dashed border-stone-200/70 px-5 pt-2 pb-5 text-sm leading-relaxed text-stone-600 sm:px-6 sm:text-base dark:border-neutral-800/80 dark:text-stone-300">
                    {item.answer}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default FaqAccordion
