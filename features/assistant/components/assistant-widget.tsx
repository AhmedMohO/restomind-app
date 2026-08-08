"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ChefHat, ChevronDown, RotateCcw, Send, Sparkles } from "lucide-react"

import { DegradedBanner } from "@/components/ai/degraded-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAssistantChat } from "@/features/assistant/hooks/use-assistant-chat"
import { useAssistantStore } from "@/features/assistant/store/use-assistant-store"
import { MessageThread } from "./message-thread"
import { RecommendationCarousel } from "./recommendation-carousel"
import type {
  AssistantPendingAction,
  AssistantRecommendation,
} from "@/features/assistant/api/type"

export function AssistantWidget() {
  const t = useTranslations("Dashboard.assistant")
  const {
    isOpen,
    open,
    close,
    messages,
    activeRecommendations,
    pendingActions,
    degradedReason,
    reset,
    resolveAction,
    resolveRecommendation,
  } = useAssistantStore()
  const { send, approve } = useAssistantChat()

  const [draft, setDraft] = useState("")
  // Which card/action the in-flight approval belongs to, so only that one
  // shows a spinner.
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)
  const [decidingTool, setDecidingTool] = useState<string | null>(null)

  const suggestions = t.raw("suggestions") as string[]
  const badgeCount = activeRecommendations.length + pendingActions.length

  function submit(text: string) {
    const message = text.trim()
    if (!message || send.isPending) return
    setDraft("")
    send.mutate(message)
  }

  function applyRecommendation(rec: AssistantRecommendation, index: number) {
    setApplyingIndex(index)
    approve.mutate(
      {
        recommendationActionId: rec.recommendationActionId,
        toolName: rec.actionPayload.toolName,
        arguments: rec.actionPayload.arguments,
        approved: true,
      },
      {
        onSuccess: () => resolveRecommendation(index),
        onSettled: () => setApplyingIndex(null),
      }
    )
  }

  function decideAction(action: AssistantPendingAction, approved: boolean) {
    setDecidingTool(action.toolName)
    approve.mutate(
      { toolName: action.toolName, arguments: action.arguments, approved },
      {
        onSuccess: () => resolveAction(action.toolName),
        onSettled: () => setDecidingTool(null),
      }
    )
  }

  return (
    <>
      {/* Trigger bubble — half-appeared at the side edge when idle so it never obstructs dashboard elements */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed end-0 bottom-8 z-50 flex items-center pointer-events-none"
          >
            <motion.button
              type="button"
              onClick={open}
              aria-label={t("open")}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "group relative flex items-center gap-3 rounded-s-full border border-e-0 border-border/80 bg-background/95 py-2 ps-2 pe-4 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out hover:border-primary/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none pointer-events-auto",
                "translate-x-[calc(100%-2rem)] opacity-95 hover:translate-x-0 hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 rtl:-translate-x-[calc(100%-2rem)] rtl:hover:translate-x-0 rtl:focus-visible:translate-x-0"
              )}
            >
              {/* Pulsing ring AI Chef Icon */}
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/40"
                  animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <ChefHat className="relative size-5 transition-transform duration-300 group-hover:scale-110" />
              </span>

              {/* RestoMind AI Branding Label */}
              <div className="flex flex-col text-start whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-xs font-bold tracking-tight text-foreground">
                    RestoMind AI
                  </span>
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Copilot
                </span>
              </div>

              {badgeCount > 0 && (
                <span className="ms-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums shadow-sm">
                  {badgeCount}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            role="dialog"
            aria-label={t("title")}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onKeyDown={(e) => e.key === "Escape" && close()}
            className="fixed end-6 bottom-6 z-50 flex h-[50vh] max-h-[50vh] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl backdrop-blur-md sm:w-[400px] lg:w-[450px]"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <ChefHat className="size-4" />
                <Sparkles className="absolute -end-0.5 -bottom-0.5 size-2.5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-heading text-sm font-semibold tracking-tight">
                    {t("title")}
                  </h2>
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    Bedrock AI
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
                onClick={reset}
                disabled={messages.length === 0 || send.isPending}
                aria-label={t("clear")}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={close}
                aria-label={t("collapse")}
              >
                <ChevronDown className="size-4" />
              </Button>
            </header>

            <RecommendationCarousel
              recommendations={activeRecommendations}
              applyingIndex={applyingIndex}
              onApply={applyRecommendation}
            />

            {degradedReason !== null && (
              <div className="shrink-0 px-4 pt-3">
                <DegradedBanner reason={degradedReason || undefined} />
              </div>
            )}

            {/* Thread */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {messages.length === 0 && !send.isPending ? (
                <p
                  dir="auto"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </p>
              ) : (
                <MessageThread
                  messages={messages}
                  pendingActions={pendingActions}
                  isThinking={send.isPending}
                  decidingTool={decidingTool}
                  onDecide={decideAction}
                />
              )}
            </div>

            {/* Quick suggestions — an opener, so they retire once the
                conversation has started and the thread carries the context. */}
            {messages.length === 0 && (
              <div className="shrink-0 border-t border-border px-4 py-3">
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {t("suggestionsHeading")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      dir="auto"
                      whileTap={{ scale: 0.96 }}
                      disabled={send.isPending}
                      onClick={() => submit(s)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <form
              className="flex shrink-0 items-center gap-2 border-t border-border bg-card/60 p-3"
              onSubmit={(e) => {
                e.preventDefault()
                submit(draft)
              }}
            >
              <Input
                dir="auto"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                className={cn("size-9 shrink-0 rounded-full")}
                disabled={!draft.trim() || send.isPending}
                aria-label={t("send")}
              >
                <Send className="size-4 rtl:-scale-x-100" />
              </Button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
