import { z } from "zod"

export const assistantChatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1).optional(),
})

export const assistantApproveActionSchema = z.object({
  recommendationActionId: z.string().optional(),
  // Not trusted for execution — the backend executes only the toolName/
  // arguments sealed inside `approvalToken`. Kept optional so the client can
  // still display what it thinks it's approving.
  toolName: z.string().min(1).optional(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  approvalToken: z.string().min(1),
  approved: z.boolean(),
  sessionId: z.string().min(1).optional(),
})

export type AssistantChatInput = z.infer<typeof assistantChatSchema>
export type AssistantApproveActionInput = z.infer<
  typeof assistantApproveActionSchema
>
