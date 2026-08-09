/** Mirrors `StructuredRecommendation` in the NestJS agentic-RAG service. */
export interface AssistantRecommendation {
  recommendationId?: string
  /** `recommendation_actions` row id — links an approval back to its action. */
  recommendationActionId?: string
  title: string
  description: string
  priority: "HIGH" | "MEDIUM" | "LOW"
  estimatedSaving: number
  confidence: number
  requiredTools: string[]
  requiresApproval: boolean
  actionPayload: {
    toolName: string
    arguments: Record<string, unknown>
  }
  /**
   * Signed proof of exactly what `actionPayload` was proposed. Approval
   * executes only what this token carries — send it back unmodified with
   * `POST /assistant/approve-action`, it isn't something the client derives.
   */
  approvalToken: string
}

/** A tool the planner selected but refused to run without a human. */
export interface AssistantPendingAction {
  toolName: string
  arguments: Record<string, unknown>
  status: string
  /** Same contract as `AssistantRecommendation.approvalToken`. */
  approvalToken: string
}

/** Body of `POST /assistant/chat`. */
export interface AssistantChatResponse {
  sessionId: string
  intent: string
  response: string
  recommendations: AssistantRecommendation[]
  pendingActions: AssistantPendingAction[]
  requiresApproval: boolean
  /** True when semantic retrieval or the LLM was unavailable for this answer. */
  degraded?: boolean
  degradedReason?: string
}

/** Body of `POST /assistant/approve-action`. */
export interface AssistantApprovalResponse {
  status: "SUCCESS" | "REJECTED_BY_USER" | "FAILED" | (string & {})
  message?: string
  result?: unknown
}

export interface AssistantMessage {
  id: string
  role: "user" | "assistant"
  content: string
  /** Epoch ms — kept as a number so the store stays serialisable. */
  timestamp: number
}
