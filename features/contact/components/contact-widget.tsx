"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  Headset,
  MessageCircle,
  Package,
  Send,
  User,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectFetchResult,
} from "@/components/ui/paginated-select"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { fetchMyOrderSummaries } from "../actions/fetch-orders"

const WHATSAPP_NUMBER = "201020697551"

export function ContactWidget() {
  const t = useTranslations("ContactWidget")
  const user = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [relatedOrder, setRelatedOrder] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  // Pre-fill name from session
  useEffect(() => {
    if (user && !name) {
      setName(`${user.firstName} ${user.lastName}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function resetForm() {
    setSubject("")
    setRelatedOrder("")
    setMessage("")
    setSent(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !subject.trim() || !message.trim()) return

    const formattedOrder = relatedOrder.trim()
      ? relatedOrder.length > 6
        ? `#${relatedOrder.slice(-6).toUpperCase()} (${relatedOrder})`
        : relatedOrder
      : null

    const lines = [
      `📌 *RestoMind — ${t("whatsapp.header")}*`,
      `──────────────────`,
      `👤 *${t("fields.name")}:* ${name.trim()}`,
      `📝 *${t("fields.subject")}:* ${subject.trim()}`,
    ]

    if (formattedOrder) {
      lines.push(`📦 *${t("fields.relatedOrder")}:* ${formattedOrder}`)
    }

    lines.push(`──────────────────`)
    lines.push(`💬 *${t("fields.message")}:*`)
    lines.push(message.trim())

    const text = encodeURIComponent(lines.join("\n"))
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`

    window.open(url, "_blank", "noopener,noreferrer")
    setSent(true)
  }

  return (
    <>
      {/* ── Trigger Bubble ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed start-0 bottom-8 z-50 flex items-center pointer-events-none"
          >
            <motion.button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={t("open")}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "group relative flex items-center gap-3 rounded-e-full border border-s-0 border-border/80 bg-background/95 py-2 pe-2 ps-4 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out hover:border-emerald-500/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none pointer-events-auto",
                "-translate-x-[calc(100%-2rem)] opacity-95 hover:translate-x-0 hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 rtl:translate-x-[calc(100%-2rem)] rtl:hover:translate-x-0 rtl:focus-visible:translate-x-0"
              )}
            >
              {/* Label */}
              <div className="flex flex-col text-start whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-xs font-bold tracking-tight text-foreground">
                    {t("title")}
                  </span>
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {t("subtitle")}
                </span>
              </div>

              {/* WhatsApp-themed Icon */}
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-emerald-500/40"
                  animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <MessageCircle className="relative size-5 transition-transform duration-300 group-hover:scale-110" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            role="dialog"
            aria-label={t("title")}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
            className="fixed start-6 bottom-6 z-50 flex max-h-[70vh] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl backdrop-blur-md sm:w-[400px] lg:w-[420px]"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Headset className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-heading text-sm font-semibold tracking-tight">
                    {t("title")}
                  </h2>
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    WhatsApp
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {t("status")}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={() => setIsOpen(false)}
                aria-label={t("collapse")}
              >
                <ChevronDown className="size-4" />
              </Button>
            </header>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {sent ? (
                /* ── Success state ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 px-6 py-10 text-center"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <MessageCircle className="size-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold">
                      {t("success.title")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("success.description")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 rounded-full"
                    onClick={resetForm}
                  >
                    {t("success.sendAnother")}
                  </Button>
                </motion.div>
              ) : (
                /* ── Form ── */
                <form
                  id="contact-form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3.5 p-4"
                >
                  {/* Intro text */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("description")}
                  </p>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-name"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <User className="size-3.5 text-muted-foreground" />
                      {t("fields.name")}
                    </label>
                    <Input
                      id="contact-name"
                      dir="auto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("placeholders.name")}
                      required
                      className="rounded-lg"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      {t("fields.subject")}
                    </label>
                    <Input
                      id="contact-subject"
                      dir="auto"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("placeholders.subject")}
                      required
                      className="rounded-lg"
                    />
                  </div>

                  {/* Related Order (only for logged-in users with orders) */}
                  {isLoggedIn() && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-order"
                        className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                      >
                        <Package className="size-3.5 text-muted-foreground" />
                        {t("fields.relatedOrder")}
                        <span className="text-[10px] text-muted-foreground">
                          ({t("fields.optional")})
                        </span>
                      </label>
                      <PaginatedSelect
                        id="contact-order"
                        value={relatedOrder}
                        onValueChange={(val) => setRelatedOrder(val)}
                        fetchData={(
                          params: PaginatedSelectFetchParams
                        ): Promise<PaginatedSelectFetchResult> =>
                          fetchMyOrderSummaries(params)
                        }
                        queryKey={["my-orders-contact-widget"]}
                        placeholder={t("placeholders.selectOrder")}
                        searchPlaceholder={t("placeholders.searchOrder")}
                        limit={5}
                        className="rounded-lg h-9 text-xs"
                      />
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <MessageCircle className="size-3.5 text-muted-foreground" />
                      {t("fields.message")}
                    </label>
                    <Textarea
                      id="contact-message"
                      dir="auto"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("placeholders.message")}
                      required
                      className="rounded-lg"
                      rows={4}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Footer / Submit */}
            {!sent && (
              <div className="shrink-0 border-t border-border bg-card/60 p-3">
                <Button
                  type="submit"
                  form="contact-form"
                  className="w-full gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={
                    !name.trim() || !subject.trim() || !message.trim()
                  }
                >
                  <Send className="size-4 rtl:-scale-x-100" />
                  {t("send")}
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  {t("disclaimer")}
                </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
