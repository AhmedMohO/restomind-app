"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
// Aliased: `ImportResult` is already the name of this feature's own result
// component, imported below.
import {
  CSVImporter,
  type ImportResult as CsvImportResult,
} from "@importcsv/react"
import { useTheme } from "@space-man/react-theme-animation"
import { Columns3 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IMPORT_TYPES, type ImportType } from "@/features/imports/api/type"
import { useImportUpload } from "@/features/imports/hooks/use-imports"
import {
  IMPORT_COLUMNS,
  rowsToCsvFile,
} from "@/features/imports/lib/import-columns"
import { ImportDropzone, MAX_FILE_SIZE_BYTES } from "./import-dropzone"
import { ImportHistory } from "./import-history"
import { ImportProgress } from "./import-progress"
import { ImportResult } from "./import-result"
import { ImportTypePicker } from "./import-type-picker"

/**
 * Top-level client state for the CSV import screen: the selected type and
 * the single chained upload+confirm mutation. Not in the brief's literal
 * file list, but follows the same pattern as `PredictionsDashboard` (Task
 * 4) — a thin orchestrator that owns shared state so the picker, dropzone,
 * progress, and result components stay presentational and independently
 * testable.
 *
 * The default path deliberately has no "Start import" / "Confirm" button:
 * dropping or choosing a file in `ImportDropzone` calls
 * `uploadMutation.mutate()` directly (brief Step 1 — "the manager picks a
 * type and drops a file; everything after that happens automatically").
 * The `CSVImporter` wizard at the bottom is an opt-in fallback for files
 * whose headers the backend can't auto-resolve — see the comment there.
 */
export function ImportWorkspace() {
  const t = useTranslations("imports")
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const [selectedType, setSelectedType] = React.useState<ImportType>(
    IMPORT_TYPES[0]
  )
  const [mapperOpen, setMapperOpen] = React.useState(false)

  const uploadMutation = useImportUpload()
  const isBusy = uploadMutation.isPending

  // Reused both for the type picker itself and for the dependency-violation
  // banner's "go to {prerequisite}" action — both cases mean "start over
  // with a different type," so the mutation resets either way.
  const handleSelectType = (type: ImportType) => {
    setSelectedType(type)
    uploadMutation.reset()
  }

  const handleFileSelected = (file: File) => {
    uploadMutation.mutate({ file, importType: selectedType })
  }

  // The mapping wizard hands back parsed rows, not the original file, so the
  // re-serialized CSV has to clear the same size gate `ImportDropzone`
  // enforces before it reaches the mutation. Canonical output is usually
  // smaller than the source (unmapped columns are dropped), but a 50k-row
  // sheet can still cross the line.
  const handleMapperComplete = (result: CsvImportResult) => {
    setMapperOpen(false)
    const file = rowsToCsvFile(result, selectedType)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(t("dropzone.tooLarge"))
      return
    }
    handleFileSelected(file)
  }

  const showResult =
    !isBusy &&
    (uploadMutation.data !== undefined || uploadMutation.error !== null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadCard.title")}</CardTitle>
          <CardDescription>{t("uploadCard.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImportTypePicker
            value={selectedType}
            onChange={handleSelectType}
            disabled={isBusy}
          />

          <ImportDropzone
            disabled={isBusy}
            onFileSelected={handleFileSelected}
          />

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <p className="text-xs text-muted-foreground">
              {t("mapper.prompt")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => setMapperOpen(true)}
            >
              <Columns3 className="size-3.5" />
              {t("mapper.open")}
            </Button>
          </div>

          <ImportProgress stage={uploadMutation.stage} />

          {showResult ? (
            <ImportResult
              importType={selectedType}
              data={uploadMutation.data}
              error={uploadMutation.error}
              onSelectPrerequisite={handleSelectType}
              onDismiss={() => uploadMutation.reset()}
            />
          ) : null}
        </CardContent>
      </Card>

      <ImportHistory />

      {/*
       * Opt-in escape hatch, NOT the default path: the brief's "core UX
       * decision, already made" is that dropping a file imports it with no
       * mapping or preview screen, and the dropzone above still does exactly
       * that. This wizard exists for the case that decision doesn't cover —
       * a file whose headers `autoSuggestMapping` can't resolve, which today
       * just fails server-side with no way to correct it short of the
       * manager editing their spreadsheet.
       *
       * `columns` (not the `schema` prop the docs show): the Zod path in
       * 0.6.1 introspects `_def.typeName` / `_def.checks[].kind`, which Zod 4
       * removed, and this app is on zod ^4.4.3 — it would derive silently
       * wrong types and validators rather than throw. `columns` is also the
       * only shape declared in the package's `index.d.ts`.
       *
       * `key` remounts the wizard when the type changes so it never carries
       * a previous type's mapping into a new one.
       */}
      <CSVImporter
        key={selectedType}
        columns={IMPORT_COLUMNS[selectedType]}
        isModal
        modalIsOpen={mapperOpen}
        modalOnCloseTriggered={() => setMapperOpen(false)}
        showDownloadTemplateButton
        invalidRowHandling="block"
        darkMode={resolvedTheme === "dark"}
        language={locale}
        onComplete={handleMapperComplete}
      />
    </div>
  )
}
