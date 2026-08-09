"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { clientFetch } from "@/lib/api/fetch-client"
import { getErrorMessage } from "@/lib/api/utils"
import { useAssistantStore } from "@/features/assistant/store/use-assistant-store"
import type {
  AssistantApprovalResponse,
  AssistantChatResponse,
} from "@/features/assistant/api/type"

export interface ApproveActionVariables {
  // Display/query-invalidation only — the backend executes whatever tool and
  // arguments are sealed inside `approvalToken`, not these.
  toolName: string
  arguments: Record<string, unknown>
  approved: boolean
  /**
   * The action row id. The chat endpoint does not currently return one — see
   * the note in assistant-widget.tsx — so this is normally omitted and the
   * backend logs the run without linking it to a recommendation_action row.
   */
  recommendationActionId?: string
  /** Required. Signed by the backend when this action/recommendation was proposed. */
  approvalToken: string
}

export function useAssistantChat() {
  const t = useTranslations("Dashboard.assistant")
  const qc = useQueryClient()
  const addMessage = useAssistantStore((s) => s.addMessage)
  const applyReply = useAssistantStore((s) => s.applyReply)

  const send = useMutation({
    mutationFn: async (message: string) =>
      (await clientFetch<AssistantChatResponse>("/assistant/chat", {
        method: "POST",
        body: {
          message,
          // Read at call time, not render time: the id only exists after the
          // first reply, and a stale closure here would fork the thread.
          sessionId: useAssistantStore.getState().sessionId ?? undefined,
        },
      }))!,
    // Echo the user turn immediately; the round trip runs tools + two Bedrock
    // calls and can take several seconds.
    onMutate: (message) => addMessage("user", message),
    onSuccess: (reply) => applyReply(reply),
    onError: (err: unknown) => {
      const status = (err as { status?: number })?.status
      toast.error(
        status === 429
          ? t("errors.rateLimited")
          : getErrorMessage(err, t("errors.send"))
      )
    },
  })

  const approve = useMutation({
    mutationFn: async (vars: ApproveActionVariables) =>
      (await clientFetch<AssistantApprovalResponse>(
        "/assistant/approve-action",
        {
          method: "POST",
          body: {
            ...vars,
            sessionId: useAssistantStore.getState().sessionId ?? undefined,
          },
        }
      ))!,
    onSuccess: (result, vars) => {
      if (!vars.approved) {
        toast.info(t("action.rejected"))
        return
      }
      // The backend answers 200 with status FAILED when the tool itself
      // threw — a success envelope is not a successful action.
      if (result?.status === "SUCCESS") {
        toast.success(t("action.executed"))
        addMessage("assistant", t("action.executedNote"))
      } else {
        toast.error(result?.message || t("errors.action"))
      }
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, t("errors.action"))),
    // An approved tool writes real offers / purchase orders / production
    // plans. Map each known write-tool to the query keys it actually
    // affects instead of invalidating every active query app-wide.
    onSettled: (_data, _err, vars) => {
      if (!vars.approved) return

      const toolQueryKeys: Record<string, string[][]> = {
        createOffer: [["offers"]],
        updateProductionPlan: [["production-plan"]],
        createPurchaseOrder: [["purchase-orders"]],
      }

      const keys = toolQueryKeys[vars.toolName]
      if (keys) {
        keys.forEach((k) => qc.invalidateQueries({ queryKey: k }))
      } else {
        // Unknown tool — broad invalidation as a safety net. Log so we
        // can add the mapping once the tool ships.
        console.warn(
          `[assistant] Unmapped tool "${vars.toolName}" — falling back to broad invalidation`
        )
        qc.invalidateQueries()
      }
    },
  })

  return { send, approve }
}
