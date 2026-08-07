"use client"

/**
 * Client-side state for the floating AI assistant.
 *
 * Deliberately in-memory only: the backend already persists every turn under
 * `sessionId` (GET /assistant/sessions/:id), so persisting a second copy here
 * would just create two histories that can drift apart.
 */

import { create } from "zustand"

import type {
  AssistantMessage,
  AssistantPendingAction,
  AssistantRecommendation,
} from "@/features/assistant/api/type"

let messageSeq = 0

interface AssistantState {
  isOpen: boolean
  /** null until the first reply — the backend mints the id. */
  sessionId: string | null
  messages: AssistantMessage[]
  /** Recommendations from the most recent reply. */
  activeRecommendations: AssistantRecommendation[]
  /** Actions from the most recent reply that still need a human decision. */
  pendingActions: AssistantPendingAction[]

  open: () => void
  close: () => void
  toggle: () => void
  addMessage: (role: AssistantMessage["role"], content: string) => void
  /** Folds a chat reply into the store: id, answer, cards, pending actions. */
  applyReply: (reply: {
    sessionId: string
    response: string
    recommendations: AssistantRecommendation[]
    pendingActions: AssistantPendingAction[]
  }) => void
  /** Drops one pending action once the user has approved or rejected it. */
  resolveAction: (toolName: string) => void
  /** Drops one recommendation card once its CTA has been acted on. */
  resolveRecommendation: (index: number) => void
  /** Forgets the session so the next message starts a fresh backend thread. */
  reset: () => void
}

export const useAssistantStore = create<AssistantState>((set) => ({
  isOpen: false,
  sessionId: null,
  messages: [],
  activeRecommendations: [],
  pendingActions: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addMessage: (role, content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `m${++messageSeq}`, role, content, timestamp: Date.now() },
      ],
    })),

  applyReply: (reply) =>
    set((s) => ({
      sessionId: reply.sessionId,
      messages: [
        ...s.messages,
        {
          id: `m${++messageSeq}`,
          role: "assistant" as const,
          content: reply.response,
          timestamp: Date.now(),
        },
      ],
      // Each reply supersedes the previous turn's cards; stale ones would
      // otherwise let the user approve an action computed from old data.
      activeRecommendations: reply.recommendations ?? [],
      pendingActions: reply.pendingActions ?? [],
    })),

  resolveAction: (toolName) =>
    set((s) => ({
      pendingActions: s.pendingActions.filter((a) => a.toolName !== toolName),
    })),

  resolveRecommendation: (index) =>
    set((s) => ({
      activeRecommendations: s.activeRecommendations.filter(
        (_, i) => i !== index
      ),
    })),

  reset: () =>
    set({
      sessionId: null,
      messages: [],
      activeRecommendations: [],
      pendingActions: [],
    }),
}))
