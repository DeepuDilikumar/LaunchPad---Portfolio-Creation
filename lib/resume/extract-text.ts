"use client"

/**
 * Reads plain text from a resume file entirely in the browser (nothing is uploaded).
 * PDF via pdf.js with two-column detection, DOCX via mammoth, TXT as-is.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024
export const ACCEPTED_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
} as const
export type ResumeFormat = "PDF" | "DOCX" | "TXT"

export type ExtractedText = {
  text: string
  format: ResumeFormat
  pages: number
  layout: "single-column" | "two-column" | "unknown"
  hasTables: boolean
}

export class ResumeReadError extends Error {
  constructor(
    public code: "too_large" | "unsupported" | "empty" | "unreadable" | "protected",
    message: string
  ) {
    super(message)
  }
}

export function detectFormat(file: File): ResumeFormat | null {
  const byType = ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]
  if (byType) return byType
  const ext = file.name.toLowerCase().split(".").pop()
  if (ext === "pdf") return "PDF"
  if (ext === "docx") return "DOCX"
  if (ext === "txt") return "TXT"
  return null
}

type Item = { str: string; x: number; y: number; w: number }

/** Groups text items into lines by their baseline, left to right. */
function toLines(items: Item[]): Item[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: Item[][] = []
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) < 3)
    if (line) line.push(item)
    else lines.push([item])
  }
  return lines.map((l) => l.sort((a, b) => a.x - b.x))
}

function joinLine(items: Item[]): string {
  let out = ""
  let lastEnd = -Infinity
  for (const item of items) {
    const gap = item.x - lastEnd
    out += (out && gap > 1.5 ? " " : "") + item.str
    lastEnd = item.x + item.w
  }
  return out.replace(/\s+/g, " ").trim()
}

/**
 * Two-column resumes put a sidebar next to the main column. If many lines have text on
 * both sides of the same vertical gutter, read the left column fully, then the right one.
 */
function readPage(items: Item[], pageWidth: number) {
  const lines = toLines(items.filter((i) => i.str.trim().length > 0))
  const gutters: number[] = []
  let tableLike = 0
  for (const line of lines) {
    let wideGaps = 0
    for (let i = 1; i < line.length; i++) {
      const prevEnd = line[i - 1].x + line[i - 1].w
      const gap = line[i].x - prevEnd
      if (gap > pageWidth * 0.06) {
        wideGaps++
        const mid = (prevEnd + line[i].x) / 2
        if (mid > pageWidth * 0.2 && mid < pageWidth * 0.75) gutters.push(mid)
      }
    }
    if (wideGaps >= 2) tableLike++
  }

  const hasTables = lines.length > 0 && tableLike / lines.length > 0.2
  if (lines.length >= 8 && gutters.length / lines.length > 0.3) {
    const sortedG = [...gutters].sort((a, b) => a - b)
    const split = sortedG[Math.floor(sortedG.length / 2)]
    const consistent = sortedG.filter((g) => Math.abs(g - split) < pageWidth * 0.08).length / sortedG.length
    if (consistent > 0.6) {
      const left = lines.map((l) => l.filter((i) => i.x < split)).filter((l) => l.length)
      const right = lines.map((l) => l.filter((i) => i.x >= split)).filter((l) => l.length)
      return {
        text: [...left.map(joinLine), ...right.map(joinLine)].join("\n"),
        twoColumn: true,
        hasTables,
      }
    }
  }
  return { text: lines.map(joinLine).join("\n"), twoColumn: false, hasTables }
}

async function readPdf(file: File): Promise<Omit<ExtractedText, "format">> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  let doc
  try {
    doc = await loadingTask.promise
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new ResumeReadError("protected", "This PDF is password-protected. Save a copy without a password and try again.")
    }
    throw new ResumeReadError("unreadable", "We couldn't open this PDF. Try exporting it again, or upload a DOCX.")
  }
  const pages: string[] = []
  let twoColumnPages = 0
  let tablePages = 0
  for (let n = 1; n <= Math.min(doc.numPages, 6); n++) {
    const page = await doc.getPage(n)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const items: Item[] = []
    for (const raw of content.items) {
      if (!("str" in raw)) continue
      items.push({ str: raw.str, x: raw.transform[4], y: raw.transform[5], w: raw.width })
    }
    const result = readPage(items, viewport.width)
    if (result.twoColumn) twoColumnPages++
    if (result.hasTables) tablePages++
    pages.push(result.text)
  }
  await loadingTask.destroy()
  return {
    text: pages.join("\n"),
    pages: pages.length,
    layout: twoColumnPages > 0 ? "two-column" : "single-column",
    hasTables: tablePages > 0,
  }
}

async function readDocx(file: File): Promise<Omit<ExtractedText, "format">> {
  const mammoth = await import("mammoth")
  try {
    const arrayBuffer = await file.arrayBuffer()
    const [{ value: text }, { value: html }] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer }),
    ])
    return { text, pages: 1, layout: "unknown", hasTables: /<table/i.test(html) }
  } catch {
    throw new ResumeReadError("unreadable", "We couldn't open this Word file. Try saving it again as .docx or PDF.")
  }
}

export async function extractResumeText(file: File): Promise<ExtractedText> {
  if (file.size > MAX_RESUME_BYTES) {
    throw new ResumeReadError("too_large", "This file is over 5 MB. Try exporting your resume as a smaller PDF.")
  }
  const format = detectFormat(file)
  if (!format) {
    throw new ResumeReadError("unsupported", "Please upload a PDF, DOCX or TXT file.")
  }
  const result =
    format === "PDF"
      ? await readPdf(file)
      : format === "DOCX"
        ? await readDocx(file)
        : { text: await file.text(), pages: 1, layout: "single-column" as const, hasTables: false }
  if (result.text.replace(/\s/g, "").length < 40) {
    throw new ResumeReadError(
      "empty",
      format === "PDF"
        ? "This PDF has almost no selectable text (it may be a scanned image). Upload the original PDF or DOCX, or fill in your details manually."
        : "We couldn't find any text in this file. Try another file or fill in your details manually."
    )
  }
  return { ...result, format }
}
