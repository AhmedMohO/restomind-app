import { z } from "zod"

export const assistantChatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1).optional(),
})

export const assistantApproveActionSchema = z.object({
  recommendationActionId: z.string().optional(),
  toolName: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()),
  approved: z.boolean(),
  sessionId: z.string().min(1).optional(),
})

export type AssistantChatInput = z.infer<typeof assistantChatSchema>
export type AssistantApproveActionInput = z.infer<
  typeof assistantApproveActionSchema
>
