/**
 * The assistant answers in light markdown — `**bold**`, `- ` bullets, `### `
 * headings, GFM pipe tables, and blank-line paragraphs. That is the whole
 * vocabulary the system prompt produces, so it's parsed here instead of
 * pulling in a markdown engine plus an HTML sanitiser.
 *
 * ponytail: this exact vocabulary only. Swap in react-markdown + remark-gfm +
 * rehype-sanitize if the prompt ever starts emitting links, images or code
 * fences.
 */

export interface RichSpan {
  text: string
  bold: boolean
}

export type TableAlign = "start" | "center" | "end"

export type RichBlock =
  | { type: "blank" }
  | { type: "heading"; level: number; spans: RichSpan[] }
  | { type: "bullet"; spans: RichSpan[] }
  | { type: "paragraph"; spans: RichSpan[] }
  | {
      type: "table"
      align: TableAlign[]
      header: RichSpan[][]
      rows: RichSpan[][][]
    }

const BULLET = /^\s*[-*•]\s+/
const HEADING = /^\s*(#{1,6})\s+(.*)$/
const TABLE_ROW = /^\s*\|(.*)\|\s*$/
const TABLE_SEPARATOR_CELL = /^:?-+:?$/

function parseInline(content: string): RichSpan[] {
  return content
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part !== "")
    .map((part) => {
      // `** **` is not bold — an all-whitespace run would render as an
      // empty <strong> and silently eat the spacing around it.
      const inner = part.slice(2, -2)
      return part.startsWith("**") && part.endsWith("**") && inner.trim()
        ? { text: inner, bold: true }
        : { text: part, bold: false }
    })
}

/** Splits a `| a | b |` row into raw cell strings, honoring `\|` escapes. */
function splitTableRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "")
  return inner.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"))
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => TABLE_SEPARATOR_CELL.test(c.trim()))
}

function cellAlign(cell: string): TableAlign {
  const c = cell.trim()
  if (c.startsWith(":") && c.endsWith(":")) return "center"
  if (c.endsWith(":")) return "end"
  return "start"
}

export function parseRichText(text: string): RichBlock[] {
  const lines = text.split("\n")
  const blocks: RichBlock[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // A `|...|` row is only a table when the very next line is a valid
    // `|---|---:|` separator — otherwise a stray pipe in prose (rare, but
    // possible) would get misread as a one-cell table.
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_ROW.test(lines[i + 1])) {
      const sepCells = splitTableRow(lines[i + 1])
      if (isSeparatorRow(sepCells)) {
        const headerCells = splitTableRow(line)
        const align = sepCells.map(cellAlign)
        const rows: RichSpan[][][] = []
        let j = i + 2
        while (j < lines.length && TABLE_ROW.test(lines[j])) {
          rows.push(splitTableRow(lines[j]).map(parseInline))
          j++
        }
        blocks.push({ type: "table", align, header: headerCells.map(parseInline), rows })
        i = j - 1
        continue
      }
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, spans: parseInline(heading[2]) })
      continue
    }

    const bullet = BULLET.test(line)
    const content = bullet ? line.replace(BULLET, "") : line
    if (!content.trim()) {
      blocks.push({ type: "blank" })
      continue
    }

    blocks.push({ type: bullet ? "bullet" : "paragraph", spans: parseInline(content) })
  }

  return blocks
}
