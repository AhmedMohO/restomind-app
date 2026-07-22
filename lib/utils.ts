import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateErr(
  tValidation: (k: string) => string,
  message?: string
): string {
  if (!message) return ""
  try {
    return tValidation(message)
  } catch {
    return message
  }
}