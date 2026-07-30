"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { ImportType } from "@/features/imports/api/type"
import { IMPORT_TYPE_CONFIG } from "@/features/imports/lib/import-type-config"

export interface ImportTypePickerProps {
  value: ImportType
  onChange: (type: ImportType) => void
  disabled?: boolean
}

/**
 * The five import types as an ordered, numbered list that teaches the
 * onboarding order the backend enforces — not an alphabetical dropdown
 * (brief Step 2). Each row also surfaces the CSV headers
 * `CsvParsingService.autoSuggestMapping` recognizes for that type, since
 * showing them up front is what prevents most failed imports.
 */
export function ImportTypePicker({
  value,
  onChange,
  disabled,
}: ImportTypePickerProps) {
  const t = useTranslations("imports")

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium text-foreground">
        {t("typePicker.legend")}
      </legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => v && onChange(v as ImportType)}
        disabled={disabled}
        className="gap-3"
      >
        {IMPORT_TYPE_CONFIG.map((config) => {
          const isSelected = value === config.type
          return (
            <label
              key={config.type}
              className={cn(
                "flex min-h-11 items-start gap-3 rounded-lg border p-3.5 transition-colors",
                disabled
                  ? "cursor-not-allowed border-border/60 opacity-60"
                  : "cursor-pointer border-border hover:bg-muted/40",
                isSelected &&
                  !disabled &&
                  "border-primary bg-primary/5 ring-1 ring-primary/20 hover:bg-primary/5",
                isSelected && disabled && "border-primary/50"
              )}
            >
              <RadioGroupItem value={config.type} className="mt-0.5" />
              <span className="flex-1 space-y-1.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <bdi dir="ltr">{config.order}</bdi>
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {t(`types.${config.type}.title`)}
                  </span>
                  {config.prerequisites.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal text-muted-foreground"
                    >
                      {t("typePicker.needs", {
                        list: config.prerequisites
                          .map((p) => t(`types.${p}.title`))
                          .join(" + "),
                      })}
                    </Badge>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t(`types.${config.type}.description`)}
                </span>
                <span className="flex flex-wrap gap-1 pt-0.5">
                  {config.headers.map((header) => (
                    <span
                      key={header}
                      className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {header}
                    </span>
                  ))}
                </span>
              </span>
            </label>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}
