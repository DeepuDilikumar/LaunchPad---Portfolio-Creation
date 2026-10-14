import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface StampInfo {
  email: string;
  orderId: string;
}

/** Standard PDF fonts only cover WinAnsi; replace anything else so stamping never throws. */
export function winAnsiSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/·/g, "-")
    .replace(/₹/g, "Rs ")
    .replace(/[^\x20-\x7E]/g, "?");
}

export function stampLine(info: StampInfo): string {
  return winAnsiSafe(`Licensed to ${info.email} - order ${info.orderId} - please don't share`);
}

/**
 * Writes the buyer's email and order ID into the footer of every page and into the
 * document metadata. Returns the stamped PDF bytes.
 */
export async function stampPdf(master: Uint8Array, info: StampInfo): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(master);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const text = stampLine(info);

  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const size = width < 400 ? 5.5 : 7;
    const margin = width < 400 ? 20 : 45;
    page.drawText(text, {
      x: margin,
      y: width < 400 ? 14 : 22,
      size,
      font,
      color: rgb(0.64, 0.6, 0.53),
    });
  }
  pdf.setSubject(text);
  pdf.setKeywords([info.email, info.orderId]);
  return pdf.save();
}
