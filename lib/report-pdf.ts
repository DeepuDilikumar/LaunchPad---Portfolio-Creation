import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { site } from "@/config/site";
import type { QuizOutcome } from "./quiz";
import { winAnsiSafe } from "./stamp";

const ink = rgb(0.11, 0.1, 0.09);
const muted = rgb(0.36, 0.34, 0.28);
const blue = rgb(0.14, 0.25, 0.69);
const green = rgb(0.18, 0.48, 0.29);
const red = rgb(0.76, 0.25, 0.18);

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = winAnsiSafe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The full Readiness Check report, emailed as a PDF when the visitor asks for it. */
export async function buildQuizReport(
  outcome: QuizOutcome,
  warmup: Record<string, string>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = pdf.addPage([595, 842]);
  const left = 56;
  const width = 595 - left * 2;
  let y = 790;

  const ensure = (h: number) => {
    if (y - h < 60) {
      page = pdf.addPage([595, 842]);
      y = 790;
    }
  };
  const text = (
    t: string,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {},
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 11;
    for (const line of wrap(t, font, size, width)) {
      ensure(size + 4);
      page.drawText(line, { x: left, y, size, font, color: opts.color ?? ink });
      y -= size + 5;
    }
    y -= opts.gap ?? 6;
  };

  text(`${site.name} · Readiness Check`, { font: bold, size: 12, color: muted, gap: 14 });
  text(`You picked the strong answer on ${outcome.strong} of ${outcome.total} follow-ups.`, {
    font: bold,
    size: 20,
    gap: 10,
  });
  const seg = Object.values(warmup).filter(Boolean).join(" · ");
  if (seg) text(seg, { color: muted, gap: 16 });

  text("Score by area", { font: bold, size: 13, gap: 8 });
  for (const a of outcome.areas) {
    ensure(26);
    page.drawText(winAnsiSafe(a.title), { x: left, y, size: 11, font: regular, color: ink });
    page.drawText(`${a.correct}/${a.total}`, {
      x: left + width - 30,
      y,
      size: 11,
      font: bold,
      color: ink,
    });
    y -= 8;
    page.drawRectangle({ x: left, y, width, height: 6, color: rgb(0.94, 0.91, 0.85) });
    const ratio = a.total ? a.correct / a.total : 0;
    if (ratio > 0)
      page.drawRectangle({
        x: left,
        y,
        width: width * ratio,
        height: 6,
        color: ratio === 1 ? green : blue,
      });
    y -= 18;
  }
  y -= 6;
  if (outcome.weakest) {
    text(`Your weakest area: ${outcome.weakest.title}`, {
      font: bold,
      size: 14,
      color: red,
      gap: 10,
    });
  }

  for (const { question, picked } of outcome.missed) {
    text("The one you missed", { font: bold, size: 10, color: red, gap: 2 });
    text(question.prompt, { font: bold, size: 12, gap: 4 });
    const pickedText = question.options.find((o) => o.key === picked)?.text;
    if (pickedText) text(`You picked: ${pickedText}`, { color: muted, gap: 4 });
    text(`Strong answer: ${question.strong_answer}`, { color: green, gap: 14 });
  }

  text("What to do next", { font: bold, size: 13, gap: 6 });
  text(
    outcome.weakest
      ? `Work through the ${outcome.weakest.title.toLowerCase()} module first. Answer each follow-up out loud before reading the strong answer.`
      : "You picked the strong answer every time. Practise saying these answers out loud with a project of your own.",
  );
  text(`Backend Switch Guide: ${site.url}/guides/backend`, { color: blue, gap: 20 });
  text(`${site.business.legalName} · ${site.support.email}`, { size: 9, color: muted });
  return pdf.save();
}
