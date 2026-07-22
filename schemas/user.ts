import { z } from "zod"
import { egyptianPhoneSchema, optionalEgyptianPhoneSchema } from "@/lib/phone"

export const userRoleEnum = z.enum(["admin", "manager", "customer"])
export const userGenderEnum = z.enum(["male", "female"])

export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "firstNameMin" })
    .max(20, { message: "firstNameMax" }),
  lastName: z
    .string()
    .min(3, { message: "lastNameMin" })
    .max(20, { message: "lastNameMax" }),
  email: z.string().email({ message: "invalidEmail" }),
  password: z.string().min(6, { message: "passwordMin" }),
  phone: egyptianPhoneSchema,
  role: userRoleEnum,
  gender: userGenderEnum.optional().nullable(),
  DOB: z.string().optional().nullable(),
})

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "firstNameMin" })
    .max(20, { message: "firstNameMax" }),
  lastName: z
    .string()
    .min(3, { message: "lastNameMin" })
    .max(20, { message: "lastNameMax" }),
  phone: optionalEgyptianPhoneSchema,
  role: userRoleEnum,
  gender: userGenderEnum.optional().nullable(),
  DOB: z.string().optional().nullable(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
