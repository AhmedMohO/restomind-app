import { z } from "zod"

export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.email().optional(),
  phone: z.string().optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
})
