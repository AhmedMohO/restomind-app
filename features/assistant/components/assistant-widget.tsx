"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ChevronDown, RotateCcw, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        // The chat payload carries `recommendationId` (the Recommendation
        // doc) but not the recommendation_action row id the backend wants,
        // so the link is left unset — the run is still audit-logged.
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
      {/* Trigger bubble — logical `end` so it flips to the left in Arabic. */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={open}
            aria-label={t("open")}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-6 end-6 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/40"
              animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <Sparkles className="relative size-6" />

            {badgeCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 z-10 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white tabular-nums">
                {badgeCount}
              </span>
            )}
          </motion.button>
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
            className="fixed bottom-6 end-6 z-50 flex max-h-[85vh] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl backdrop-blur-md sm:w-[400px] lg:w-[450px]"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/60 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-heading text-sm font-semibold">
                  {t("title")}
                </h2>
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

            {/* Thread */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-4">
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
            </ScrollArea>

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
