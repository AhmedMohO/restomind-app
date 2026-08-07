/**
 * The assistant answers in light markdown — `**bold**`, `- ` bullets and
 * blank-line paragraphs. That is the whole vocabulary the system prompt
 * produces, so it's parsed here instead of pulling in a markdown engine plus
 * an HTML sanitiser.
 *
 * ponytail: bold + bullets only. Swap in react-markdown + rehype-sanitize if
 * the prompt ever starts emitting tables, links or code fences.
 */

export interface RichSpan {
  text: string
  bold: boolean
}

export interface RichLine {
  bullet: boolean
  /** Empty for a blank line, which renders as paragraph spacing. */
  spans: RichSpan[]
}

const BULLET = /^\s*[-*•]\s+/

export function parseRichText(text: string): RichLine[] {
  return text.split("\n").map((line) => {
    const bullet = BULLET.test(line)
    const content = bullet ? line.replace(BULLET, "") : line
    if (!content.trim()) return { bullet: false, spans: [] }

    const spans = content
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

    return { bullet, spans }
  })
}
