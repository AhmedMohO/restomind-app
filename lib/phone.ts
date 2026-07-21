import { z } from "zod"

/**
 * Normalizes any user-entered phone number input into international E.164 Egyptian phone format (+20...).
 *
 * Handles edge cases:
 * - Local Egyptian format: "01012345678" -> "+201012345678"
 * - Dropped leading zero: "1012345678" -> "+201012345678"
 * - User prepended +2: "+201012345678" -> "+201012345678"
 * - User prepended +2 to local format: "+201012345678" or "+2 01012345678" -> "+201012345678"
 * - User typed 20 prefix: "201012345678" -> "+201012345678"
 * - User typed +210...: "+21012345678" -> "+201012345678"
 * - Handles spaces, dashes, parentheses.
 */
export function normalizeEgyptianPhone(input: string): string {
  if (!input) return ""

  // Clean non-digit characters except leading '+'
  const cleaned = input.trim().replace(/[^\d+]/g, "")
  if (!cleaned) return ""

  const hasPlus = cleaned.startsWith("+")
  let digits = cleaned.replace(/^\+/, "")

  // Edge case: user typed "+20..." or "20..." prefix with full length (12 digits for mobile e.g. 201012345678)
  if (digits.startsWith("20") && (digits.length === 12 || digits.length === 11)) {
    digits = digits.slice(2)
  }
  // Edge case: user typed "+2..." followed by mobile/landline digits
  else if (hasPlus && digits.startsWith("2")) {
    digits = digits.slice(1)
  }

  // If 10 digits without leading 0 (e.g. 1012345678), add leading 0 to make it standard local format
  if (digits.length === 10 && !digits.startsWith("0")) {
    digits = "0" + digits
  }

  // Prepend +2 to local Egyptian format (e.g. +2 + 01012345678 -> +201012345678)
  if (digits.startsWith("0")) {
    return "+2" + digits
  }

  return "+20" + digits
}

/**
 * Regex for valid Egyptian phone numbers in international format (+20...):
 * Mobile: +2010xxxxxxxx, +2011xxxxxxxx, +2012xxxxxxxx, +2015xxxxxxxx (13 chars)
 * Landlines: +202xxxxxxxx (Cairo/Giza), +203xxxxxxx (Alex), etc.
 */
export const EGYPTIAN_PHONE_REGEX =
  /^\+20(1[0125]\d{8}|2\d{8}|3\d{7}|(13|40|45|47|48|50|55|57|62|64|65|66|68|69|82|84|86|88|92|93|95|96|97)\d{7})$/

export function isValidEgyptianPhone(phone: string): boolean {
  return EGYPTIAN_PHONE_REGEX.test(phone)
}

/**
 * Zod schema that normalizes input to +20... format and validates Egyptian phone numbers.
 */
export const egyptianPhoneSchema = z
  .string()
  .transform((val) => normalizeEgyptianPhone(val))
  .refine((val) => isValidEgyptianPhone(val), {
    message: "errorValidPhone",
  })

/**
 * Optional Zod schema that normalizes input if present and validates Egyptian phone numbers.
 */
export const optionalEgyptianPhoneSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val.trim() === "") return undefined
    return normalizeEgyptianPhone(val)
  })
  .refine((val) => val === undefined || isValidEgyptianPhone(val), {
    message: "errorValidPhone",
  })
