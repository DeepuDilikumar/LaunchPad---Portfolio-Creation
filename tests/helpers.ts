import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { setStore } from "@/lib/db";
import { MemoryStore } from "@/lib/db/memory";
import { OutboxMailer, setMailer } from "@/lib/email/send";
import { LocalStorage, masterKey, setStorage } from "@/lib/storage";

export async function samplePdf(pages = 3): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages; i++)
    pdf.addPage([595, 842]).drawText(`page ${i + 1}`, { x: 50, y: 700 });
  return pdf.save();
}

/** Fresh in-memory store, outbox mailer and temp storage holding backend masters. */
export async function setupWorld() {
  const store = new MemoryStore();
  const mailer = new OutboxMailer();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sq-test-"));
  const storage = new LocalStorage(dir);
  setStore(store);
  setMailer(mailer);
  setStorage(storage);
  for (const e of ["a4", "phone"] as const)
    await storage.put(masterKey("backend", e), await samplePdf(), "application/pdf");
  return { store, mailer, storage, dir };
}
