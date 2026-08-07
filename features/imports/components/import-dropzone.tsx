"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FileSpreadsheet, UploadCloud } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Exported because the optional `CSVImporter` path in `ImportWorkspace`
 * produces its own `File` and calls `onFileSelected` directly, bypassing
 * `validateAndEmit` below — it has to enforce the same ceiling rather than
 * redeclare it.
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export interface ImportDropzoneProps {
  disabled?: boolean
  /** Fired once per valid file — the caller starts the upload+confirm mutation immediately, no separate confirm step. */
  onFileSelected: (file: File) => void
}

/**
 * Drop-or-browse target for a single CSV file. Client-side validation
 * (extension, size) happens here and rejects BEFORE any network call, per
 * brief Step 3's first failure row — `onFileSelected` only fires for a file
 * that already passed both checks.
 *
 * The outer area is a plain (non-semantic) click/drag target, not a
 * `role="button"`, specifically so it doesn't nest one interactive control
 * inside another around the real `<Button>` below — Task 6 shipped that
 * exact bug with a base-ui Tooltip trigger inside an `<a>`. Keyboard and
 * screen-reader users get the file picker via the real Button (and the
 * native `<input type="file">` it triggers); the outer div's click/drag
 * handlers are a mouse/touch convenience layered on top, not the only path.
 */
export function ImportDropzone({
  disabled,
  onFileSelected,
}: ImportDropzoneProps) {
  const t = useTranslations("imports")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  )

  const validateAndEmit = (file: File | undefined | null) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationError(t("dropzone.invalidType"))
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(t("dropzone.tooLarge"))
      return
    }
    setValidationError(null)
    onFileSelected(file)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (disabled) return
          validateAndEmit(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-border/60 opacity-60"
            : "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/30",
          isDragging && !disabled && "border-primary bg-primary/5"
        )}
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t("dropzone.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("dropzone.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          <FileSpreadsheet className="size-3.5" />
          {t("dropzone.browse")}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          {t("dropzone.hint")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            validateAndEmit(e.target.files?.[0])
            // Reset so re-selecting the exact same file still fires onChange.
            e.target.value = ""
          }}
        />
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
