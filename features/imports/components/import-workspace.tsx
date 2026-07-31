"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IMPORT_TYPES, type ImportType } from "@/features/imports/api/type"
import { useImportUpload } from "@/features/imports/hooks/use-imports"
import { ImportDropzone } from "./import-dropzone"
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
 * There is deliberately no "Start import" / "Confirm" button anywhere in
 * this tree: dropping or choosing a file in `ImportDropzone` calls
 * `uploadMutation.mutate()` directly (brief Step 1 — "the manager picks a
 * type and drops a file; everything after that happens automatically").
 */
export function ImportWorkspace() {
  const t = useTranslations("imports")
  const [selectedType, setSelectedType] = React.useState<ImportType>(
    IMPORT_TYPES[0]
  )

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
    </div>
  )
}
