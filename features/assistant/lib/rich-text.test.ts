import { describe, expect, test } from "bun:test"

import { parseRichText } from "./rich-text"

describe("parseRichText", () => {
  test("splits bold runs out of a plain line", () => {
    expect(parseRichText("Waste hit **1,200 EGP** today")).toEqual([
      {
        bullet: false,
        spans: [
          { text: "Waste hit ", bold: false },
          { text: "1,200 EGP", bold: true },
          { text: " today", bold: false },
        ],
      },
    ])
  })

  test("detects bullets and strips their marker", () => {
    const [dash, arabicStar] = parseRichText("- Croissants\n* كرواسون")
    expect(dash).toEqual({
      bullet: true,
      spans: [{ text: "Croissants", bold: false }],
    })
    expect(arabicStar).toEqual({
      bullet: true,
      spans: [{ text: "كرواسون", bold: false }],
    })
  })

  test("blank lines carry no spans", () => {
    expect(parseRichText("a\n\nb")[1]).toEqual({ bullet: false, spans: [] })
  })

  test("leaves an unclosed marker as literal text", () => {
    expect(parseRichText("**not closed")).toEqual([
      { bullet: false, spans: [{ text: "**not closed", bold: false }] },
    ])
  })

  test("does not swallow an empty marker pair", () => {
    expect(parseRichText("a ** ** b")[0].spans.every((s) => !s.bold)).toBe(true)
  })
})
