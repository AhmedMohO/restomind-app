import { describe, expect, test } from "bun:test"

import { parseRichText } from "./rich-text"

describe("parseRichText", () => {
  test("splits bold runs out of a plain line", () => {
    expect(parseRichText("Waste hit **1,200 EGP** today")).toEqual([
      {
        type: "paragraph",
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
      type: "bullet",
      spans: [{ text: "Croissants", bold: false }],
    })
    expect(arabicStar).toEqual({
      type: "bullet",
      spans: [{ text: "كرواسون", bold: false }],
    })
  })

  test("blank lines carry no spans", () => {
    expect(parseRichText("a\n\nb")[1]).toEqual({ type: "blank" })
  })

  test("leaves an unclosed marker as literal text", () => {
    expect(parseRichText("**not closed")).toEqual([
      { type: "paragraph", spans: [{ text: "**not closed", bold: false }] },
    ])
  })

  test("does not swallow an empty marker pair", () => {
    const [block] = parseRichText("a ** ** b")
    expect(block.type).toBe("paragraph")
    expect(block.type === "paragraph" && block.spans.every((s) => !s.bold)).toBe(true)
  })

  test("parses a heading and strips the marker", () => {
    expect(parseRichText("### المكونات")).toEqual([
      { type: "heading", level: 3, spans: [{ text: "المكونات", bold: false }] },
    ])
  })

  test("parses a GFM table with alignment and inline bold cells", () => {
    const md = [
      "| منتج | الطلبات المتوقعة | الثقة |",
      "|---|---:|---|",
      "| **منتج 1** | 100 | عالية |",
      "| منتج 2 | 148 | متوسطة |",
    ].join("\n")

    expect(parseRichText(md)).toEqual([
      {
        type: "table",
        align: ["start", "end", "start"],
        header: [
          [{ text: "منتج", bold: false }],
          [{ text: "الطلبات المتوقعة", bold: false }],
          [{ text: "الثقة", bold: false }],
        ],
        rows: [
          [
            [{ text: "منتج 1", bold: true }],
            [{ text: "100", bold: false }],
            [{ text: "عالية", bold: false }],
          ],
          [
            [{ text: "منتج 2", bold: false }],
            [{ text: "148", bold: false }],
            [{ text: "متوسطة", bold: false }],
          ],
        ],
      },
    ])
  })

  test("a lone pipe row with no separator line is not read as a table", () => {
    const result = parseRichText("Price is a|b split")
    expect(result).toEqual([
      { type: "paragraph", spans: [{ text: "Price is a|b split", bold: false }] },
    ])
  })

  test("a table can be followed by more prose", () => {
    const md = ["| a | b |", "|---|---|", "| 1 | 2 |", "", "done"].join("\n")
    const blocks = parseRichText(md)
    expect(blocks[0].type).toBe("table")
    expect(blocks[1]).toEqual({ type: "blank" })
    expect(blocks[2]).toEqual({ type: "paragraph", spans: [{ text: "done", bold: false }] })
  })
})
