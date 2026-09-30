// Copies the pdf.js worker into public/ so the browser can load it (kept in sync with the installed version).
import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const source = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs")
if (!existsSync("public")) mkdirSync("public")
copyFileSync(source, path.join("public", "pdf.worker.min.mjs"))
console.log("Copied pdf.js worker to public/pdf.worker.min.mjs")
