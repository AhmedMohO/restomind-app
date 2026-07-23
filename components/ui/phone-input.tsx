"use client"

import * as React from "react"
import { ChevronDown, Search } from "lucide-react"
import {
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from "libphonenumber-js"

import { cn } from "@/lib/utils"
import { normalizeEgyptianPhone } from "@/lib/phone"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  prefix?: string
}

export const COUNTRIES: Country[] = [
  { code: "EG", name: "Egypt", dialCode: "+20", prefix: "+2", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "JO", name: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "IQ", name: "Iraq", dialCode: "+964", flag: "🇮🇶" },
  { code: "PS", name: "Palestine", dialCode: "+970", flag: "🇵🇸" },
  { code: "SD", name: "Sudan", dialCode: "+249", flag: "🇸🇩" },
  { code: "LY", name: "Libya", dialCode: "+218", flag: "🇱🇾" },
  { code: "MA", name: "Morocco", dialCode: "+212", flag: "🇲🇦" },
  { code: "TN", name: "Tunisia", dialCode: "+216", flag: "🇹🇳" },
  { code: "DZ", name: "Algeria", dialCode: "+213", flag: "🇩ℤ" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
]

export const EGYPT_COUNTRY = COUNTRIES[0]

export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "defaultValue"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultCountry?: string
}

/**
 * Computes full international E.164 phone string sent to Zod/backend.
 * For Egypt:
 * Always appends +20 / +2 to numbers:
 * - Mobile (010..., 011..., 012..., 015...) -> +2010...
 * - Landlines (02...) -> +202... (starts with +2)
 * - Dropped zero (10..., 2...) -> +2010..., +202...
 */
function computeFullPhoneNumber(country: Country, input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  if (country.code === "EG") {
    return normalizeEgyptianPhone(trimmed)
  }

  // Non-Egypt
  const cleaned = trimmed.replace(/[^\d]/g, "").replace(/^0+/, "")
  if (!cleaned) return ""
  return `${country.dialCode}${cleaned}`
}

/**
 * Parses incoming stored value from backend (e.g. "+201012345678", "+20234567890", "201012345678").
 * Strips the "+20" / "+2" / "20" prefix so the UI input box ONLY displays the local number (e.g. "01012345678" or "0234567890").
 */
function parseStoredPhoneNumber(
  storedVal: string | undefined,
  fallbackCountryCode = "EG"
): { country: Country; localValue: string } {
  const fallbackCountry =
    COUNTRIES.find((c) => c.code === fallbackCountryCode) || COUNTRIES[0]

  if (!storedVal || storedVal.trim() === "") {
    return { country: fallbackCountry, localValue: "" }
  }

  const clean = storedVal.trim()

  // Match Egypt prefixes +20, +2, or 20 (with at least 11 digits total e.g. 201012345678)
  if (
    clean.startsWith("+20") ||
    clean.startsWith("+2") ||
    (clean.startsWith("20") && clean.length >= 11)
  ) {
    const egCountry = COUNTRIES[0]
    let digits = clean.replace(/^(\+?20?)/, "")
    // Ensure standard local format starting with 0 (e.g. "01012345678" or "0234567890")
    if (digits.length > 0 && !digits.startsWith("0")) {
      digits = "0" + digits
    }
    return { country: egCountry, localValue: digits }
  }

  // Match other country dial codes
  for (const c of COUNTRIES) {
    if (
      c.code !== "EG" &&
      (clean.startsWith(c.dialCode) ||
        (clean.startsWith("+") && clean.startsWith(c.dialCode)))
    ) {
      const rest = clean.slice(c.dialCode.length).replace(/^0+/, "")
      return { country: c, localValue: rest }
    }
  }

  // Fallback: raw input under default country
  return { country: fallbackCountry, localValue: clean }
}

export interface ParsedPhoneResult {
  country: Country
  displayNational: string
  e164Value: string
}

export function parseAndFormatPhone(
  inputVal: string,
  fallbackCountryCode = "EG"
): ParsedPhoneResult {
  const parsed = parseStoredPhoneNumber(inputVal, fallbackCountryCode)
  const e164Value = computeFullPhoneNumber(parsed.country, parsed.localValue)

  let displayNational = parsed.localValue

  if (e164Value) {
    const phoneNumber = parsePhoneNumberFromString(e164Value)
    if (phoneNumber && phoneNumber.isValid()) {
      displayNational = phoneNumber.formatNational()
    } else {
      const asYouType = new AsYouType(parsed.country.code as CountryCode)
      displayNational = asYouType.input(parsed.localValue) || parsed.localValue
    }
  }

  return {
    country: parsed.country,
    displayNational,
    e164Value,
  }
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      defaultCountry = "EG",
      className,
      disabled,
      placeholder = "010 0000 0000",
      ...props
    },
    ref
  ) => {
    const incomingValue = value !== undefined ? value : defaultValue
    const initialParsed = parseStoredPhoneNumber(incomingValue, defaultCountry)

    const [selectedCountry, setSelectedCountry] = React.useState<Country>(
      initialParsed.country
    )
    const [localValue, setLocalValue] = React.useState<string>(
      initialParsed.localValue
    )
    const [search, setSearch] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    const internalInputRef = React.useRef<HTMLInputElement | null>(null)

    // Sync external ref with internal ref
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalInputRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node
        }
      },
      [ref]
    )

    // Sync state when incoming prop (value or defaultValue) changes
    const prevIncomingRef = React.useRef(incomingValue)
    React.useEffect(() => {
      if (incomingValue !== prevIncomingRef.current) {
        prevIncomingRef.current = incomingValue
        const parsed = parseStoredPhoneNumber(incomingValue, defaultCountry)
        setSelectedCountry(parsed.country)
        setLocalValue(parsed.localValue)
      }
    }, [incomingValue, defaultCountry])

    // Intercept property setter on the input element so React Hook Form reset() works seamlessly
    React.useEffect(() => {
      const inputEl = internalInputRef.current
      if (!inputEl) return

      const prototype = Object.getPrototypeOf(inputEl)
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value")

      if (descriptor && descriptor.set) {
        const originalSet = descriptor.set
        Object.defineProperty(inputEl, "value", {
          get() {
            return descriptor.get ? descriptor.get.call(this) : localValue
          },
          set(val: string) {
            const parsed = parseStoredPhoneNumber(val, selectedCountry.code)
            setSelectedCountry(parsed.country)
            setLocalValue(parsed.localValue)
            originalSet.call(this, parsed.localValue)
          },
          configurable: true,
        })
      }
    }, [selectedCountry.code, localValue])

    const handleCountrySelect = (c: Country) => {
      setSelectedCountry(c)
      setIsOpen(false)
      setSearch("")

      const newFullValue = computeFullPhoneNumber(c, localValue)
      if (onValueChange) {
        onValueChange(newFullValue)
      }
      if (onChange) {
        const event = {
          target: { name: props.name, value: newFullValue },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputVal = e.target.value

      // If user pasted a full number with +20 or country code, auto-parse it!
      if (inputVal.startsWith("+")) {
        const parsed = parseStoredPhoneNumber(inputVal, selectedCountry.code)
        setSelectedCountry(parsed.country)
        inputVal = parsed.localValue
      }

      setLocalValue(inputVal)
      const fullValue = computeFullPhoneNumber(selectedCountry, inputVal)

      if (onValueChange) {
        onValueChange(fullValue)
      }

      if (onChange) {
        const event = {
          ...e,
          target: {
            ...e.target,
            name: props.name || e.target.name,
            value: fullValue,
          },
        }
        onChange(event)
      }
    }

    const filteredCountries = React.useMemo(() => {
      if (!search.trim()) return COUNTRIES
      const q = search.toLowerCase().trim()
      return COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.dialCode.includes(q) ||
          c.code.toLowerCase().includes(q)
      )
    }, [search])

    return (
      <div
        className={cn(
          "relative flex h-8 w-full items-center rounded-md border border-input bg-background shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring dark:bg-neutral-850 dark:border-neutral-800 dark:text-neutral-100",
          props["aria-invalid"] &&
            "border-destructive focus-within:ring-destructive",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        dir="ltr"
      >
        {/* Country Selector Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            className="flex h-full items-center gap-1.5 border-e border-input px-2.5 text-xs text-foreground select-none hover:bg-accent/50 focus-visible:outline-none disabled:pointer-events-none dark:border-neutral-800"
            aria-label="Select Country"
          >
            <span className="text-base leading-none">
              {selectedCountry.flag}
            </span>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className="size-3 opacity-50" />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
          >
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs focus-visible:ring-1"
              />
            </div>

            {/* Country List */}
            <div className="max-h-56 space-y-0.5 overflow-y-auto pe-1">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No country found
                </div>
              ) : (
                filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                      selectedCountry.code === c.code &&
                        "bg-primary/10 font-semibold text-primary"
                    )}
                    onClick={() => handleCountrySelect(c)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="ms-2 font-mono text-[11px] text-muted-foreground">
                      {c.dialCode}
                    </span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Local Phone Input */}
        <input
          ref={setRef}
          type="tel"
          disabled={disabled}
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-1 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
