/** Mirrors `StructuredRecommendation` in the NestJS agentic-RAG service. */
export interface AssistantRecommendation {
  recommendationId?: string
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
}

/** A tool the planner selected but refused to run without a human. */
export interface AssistantPendingAction {
  toolName: string
  arguments: Record<string, unknown>
  status: string
}

/** Body of `POST /assistant/chat`. */
export interface AssistantChatResponse {
  sessionId: string
  intent: string
  response: string
  recommendations: AssistantRecommendation[]
  pendingActions: AssistantPendingAction[]
  requiresApproval: boolean
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
