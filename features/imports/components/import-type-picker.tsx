"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Utensils,
  Wheat,
  BookOpen,
  Boxes,
  TrendingUp,
  Check,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { ImportType } from "@/features/imports/api/type"
import {
  IMPORT_TYPE_CONFIG,
  getImportTypeConfig,
} from "@/features/imports/lib/import-type-config"

export interface ImportTypePickerProps {
  value: ImportType
  onChange: (type: ImportType) => void
  disabled?: boolean
}

const TYPE_ICONS: Record<ImportType, React.ComponentType<{ className?: string }>> = {
  menu_items: Utensils,
  ingredients: Wheat,
  recipes: BookOpen,
  inventory_transactions: Boxes,
  sales_history: TrendingUp,
}

/**
 * The five import types presented as a compact, column-directed responsive grid,
 * with a detailed section for the currently selected item directly below.
 */
export function ImportTypePicker({
  value,
  onChange,
  disabled,
}: ImportTypePickerProps) {
  const t = useTranslations("imports")
  const selectedConfig = getImportTypeConfig(value)
  const SelectedIcon = TYPE_ICONS[value]

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-semibold text-foreground flex items-center gap-2">
        <span>{t("typePicker.legend")}</span>
      </legend>

      {/* Responsive grid for column-oriented selection cards */}
      <RadioGroup
        value={value}
        onValueChange={(v) => v && onChange(v as ImportType)}
        disabled={disabled}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3"
      >
        {IMPORT_TYPE_CONFIG.map((config) => {
          const isSelected = value === config.type
          const Icon = TYPE_ICONS[config.type]

          return (
            <label
              key={config.type}
              className={cn(
                "group relative flex flex-col items-center justify-between text-center rounded-xl border p-3 transition-all duration-200 select-none cursor-pointer min-h-[120px]",
                disabled
                  ? "cursor-not-allowed border-border/60 opacity-60 bg-muted/20"
                  : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 hover:shadow-2xs",
                isSelected &&
                  !disabled &&
                  "border-2 border-primary bg-primary/5 shadow-xs ring-2 ring-primary/15",
                isSelected && disabled && "border-primary/50 bg-primary/5"
              )}
            >
              <RadioGroupItem value={config.type} className="sr-only" />

              {/* Top row: Order step number & check indicator */}
              <div className="w-full flex items-center justify-between gap-1 mb-1">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}
                >
                  <bdi dir="ltr">{config.order}</bdi>
                </span>

                {isSelected ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="size-3.5 rounded-full border border-muted-foreground/30 transition-colors group-hover:border-primary/50" />
                )}
              </div>

              {/* Center Content Column: Icon & Title */}
              <div className="flex flex-col items-center gap-1.5 py-1 w-full">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition-all duration-200",
                    isSelected
                      ? "bg-primary/15 text-primary scale-105"
                      : "bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                  )}
                >
                  <Icon className="size-4.5" />
                </div>

                <h3
                  className={cn(
                    "text-xs sm:text-sm font-semibold transition-colors leading-tight text-center line-clamp-2",
                    isSelected ? "text-primary font-bold" : "text-foreground group-hover:text-primary"
                  )}
                >
                  {t(`types.${config.type}.title`)}
                </h3>
              </div>

              {/* Bottom: Prerequisite indicator badge */}
              {config.prerequisites.length > 0 ? (
                <div className="mt-1 w-full">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 font-normal leading-tight w-full justify-center truncate",
                      isSelected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    )}
                  >
                    {t("typePicker.needs", {
                      list: config.prerequisites
                        .map((p) => t(`types.${p}.title`))
                        .join(" + "),
                    })}
                  </Badge>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </label>
          )
        })}
      </RadioGroup>

      {/* Selected Item Details & Needed Fields Section */}
      {selectedConfig && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Header of details card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SelectedIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    <bdi dir="ltr">{selectedConfig.order}</bdi>
                  </span>
                  <h4 className="font-heading text-base font-bold text-foreground">
                    {t(`types.${selectedConfig.type}.title`)}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("typePicker.selectedDetailsTitle")}
                </p>
              </div>
            </div>

            {selectedConfig.prerequisites.length > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1.5 py-1 px-2.5 text-xs font-medium"
              >
                <AlertCircle className="size-3.5" />
                <span>
                  {t("typePicker.needs", {
                    list: selectedConfig.prerequisites
                      .map((p) => t(`types.${p}.title`))
                      .join(" + "),
                  })}
                </span>
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(`types.${selectedConfig.type}.description`)}
          </p>

          {/* Needed Fields / Recognized Headers */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-foreground/80 flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5 text-primary" />
                {t("typePicker.expectedHeadersTitle")} ({selectedConfig.headers.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {selectedConfig.headers.map((header) => (
                <span
                  key={header}
                  className="inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </fieldset>
  )
}
