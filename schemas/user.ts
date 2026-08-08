import { z } from "zod"
import { egyptianPhoneSchema, optionalEgyptianPhoneSchema } from "@/lib/phone"

export const userRoleEnum = z.enum(["admin", "manager", "customer", "staff"], {
  message: "required",
})
export const userGenderEnum = z.enum(["male", "female"], {
  message: "required",
})

export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "firstNameMin" })
    .max(20, { message: "firstNameMax" }),
  lastName: z
    .string()
    .min(3, { message: "lastNameMin" })
    .max(20, { message: "lastNameMax" }),
  email: z.email({ message: "invalidEmail" }),
  password: z.string().min(6, { message: "passwordMin" }).optional().or(z.literal("")),
  phone: egyptianPhoneSchema,
  role: userRoleEnum,
  restaurantId: z.string().optional().nullable(),
  gender: userGenderEnum.optional().nullable(),
  DOB: z.string().optional().nullable(),
  employeeCode: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "firstNameMin" })
    .max(20, { message: "firstNameMax" })
    .optional(),
  lastName: z
    .string()
    .min(3, { message: "lastNameMin" })
    .max(20, { message: "lastNameMax" })
    .optional(),
  phone: optionalEgyptianPhoneSchema,
  role: userRoleEnum.optional(),
  restaurantId: z.string().optional().nullable(),
  gender: userGenderEnum.optional().nullable(),
  DOB: z.string().optional().nullable(),
  employeeCode: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  employmentStatus: z.enum(["active", "inactive", "terminated"]).optional(),
})


export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
