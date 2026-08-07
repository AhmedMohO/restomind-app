"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { Check, Loader2, ShieldQuestion, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { parseRichText } from "@/features/assistant/lib/rich-text"
import type {
  AssistantMessage,
  AssistantPendingAction,
} from "@/features/assistant/api/type"

function RichText({ text }: { text: string }) {
  return (
    <>
      {parseRichText(text).map((line, i) =>
        line.spans.length === 0 ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i} className={cn(line.bullet && "ms-4 list-item list-disc")}>
            {line.spans.map((span, j) =>
              span.bold ? (
                <strong key={j} className="font-semibold">
                  {span.text}
                </strong>
              ) : (
                <span key={j}>{span.text}</span>
              )
            )}
          </p>
        )
      )}
    </>
  )
}

function Timestamp({ value }: { value: number }) {
  const locale = useLocale()
  return (
    <time
      dateTime={new Date(value).toISOString()}
      className="mt-1 block text-[10px] text-muted-foreground"
    >
      {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
        hour: "numeric",
        minute: "2-digit",
      }).format(value)}
    </time>
  )
}

/**
 * Human-in-the-loop gate. The planner has already chosen the tool and its
 * arguments; nothing runs until this card is answered.
 */
function ApprovalCard({
  action,
  onDecide,
  isPending,
}: {
  action: AssistantPendingAction
  onDecide: (approved: boolean) => void
  isPending: boolean
}) {
  const t = useTranslations("Dashboard.assistant")

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <ShieldQuestion className="size-4 shrink-0" />
        {t("approval.title")}
      </div>

      <p className="mt-2 font-mono text-xs text-foreground">
        {action.toolName}
      </p>
      <dl className="mt-1.5 space-y-0.5">
        {Object.entries(action.arguments ?? {}).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-[11px]">
            <dt className="shrink-0 text-muted-foreground">{key}</dt>
            <dd className="truncate font-medium" dir="ltr">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-full"
          disabled={isPending}
          onClick={() => onDecide(true)}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          {t("approval.approve")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 rounded-full"
          disabled={isPending}
          onClick={() => onDecide(false)}
        >
          <X className="size-3.5" />
          {t("approval.reject")}
        </Button>
      </div>
    </motion.div>
  )
}

export interface MessageThreadProps {
  messages: AssistantMessage[]
  pendingActions: AssistantPendingAction[]
  isThinking: boolean
  decidingTool: string | null
  onDecide: (action: AssistantPendingAction, approved: boolean) => void
}

export function MessageThread({
  messages,
  pendingActions,
  isThinking,
  decidingTool,
  onDecide,
}: MessageThreadProps) {
  const t = useTranslations("Dashboard.assistant")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isThinking, pendingActions.length])

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex",
            m.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            dir="auto"
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "rounded-ee-sm bg-primary text-primary-foreground"
                : "rounded-es-sm bg-muted text-foreground"
            )}
          >
            <RichText text={m.content} />
            <Timestamp value={m.timestamp} />
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {pendingActions.map((action) => (
          <ApprovalCard
            key={action.toolName}
            action={action}
            isPending={decidingTool === action.toolName}
            onDecide={(approved) => onDecide(action, approved)}
          />
        ))}
      </AnimatePresence>

      {isThinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Sparkles className="size-3.5 animate-pulse text-primary" />
          {t("thinking")}
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </span>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  )
}
