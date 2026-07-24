import { z } from "zod"
import { parsePhoneNumberFromString } from "libphonenumber-js"

export const partnerStep1Schema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" })
    .min(3, { message: "validationMin3" }),
  businessType: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" }),
})

export const partnerStep2Schema = z.object({
  ownerName: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" }),
  email: z
    .email({ message: "validationInvalidEmail" })
    .trim()
    .min(1, { message: "validationRequired" }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" })
    .refine(
      (val) => {
        if (!val || val.trim() === "") return false
        const parsed = parsePhoneNumberFromString(val)
        return parsed ? parsed.isValid() : false
      },
      { message: "validationInvalidPhone" }
    ),
})

export const partnerStep3Schema = z.object({
  city: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" }),
  district: z
    .string()
    .trim()
    .min(1, { message: "validationRequired" }),
  commercialReg: z.string().optional(),
  socialLink: z.string().optional(),
  notes: z.string().optional(),
})

export const partnerApplicationSchema = partnerStep1Schema
  .merge(partnerStep2Schema)
  .merge(partnerStep3Schema)

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>
