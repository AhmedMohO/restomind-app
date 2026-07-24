"use client"

import { useTranslations } from "next-intl"
import FaqAccordion, { FaqItem } from "@/components/ui/faq-accordion"

export default function FaqSection() {
  const t = useTranslations("Faq")

  const faqItems: FaqItem[] = [
    {
      question: t("q1"),
      answer: t("a1"),
    },
    {
      question: t("q2"),
      answer: t("a2"),
    },
    {
      question: t("q3"),
      answer: t("a3"),
    },
    {
      question: t("q4"),
      answer: t("a4"),
    },
    {
      question: t("q5"),
      answer: t("a5"),
    },
    {
      question: t("q6"),
      answer: t("a6"),
    },
  ]

  return (
    <section className="w-full py-12 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <FaqAccordion
          badgeText={t("badge")}
          title={t("title")}
          subtitle={t("subtitle")}
          items={faqItems}
        />
      </div>
    </section>
  )
}
