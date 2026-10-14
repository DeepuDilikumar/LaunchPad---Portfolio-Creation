import fs from "node:fs";
import path from "node:path";

const dir = (pkg: string) => path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files");

function load(pkg: string, file: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(dir(pkg), file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** Fonts for generated preview images (satori reads woff, not woff2). */
export function ogFonts() {
  return [
    {
      name: "Bricolage",
      data: load("bricolage-grotesque", "bricolage-grotesque-latin-800-normal.woff"),
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Bricolage",
      data: load("bricolage-grotesque", "bricolage-grotesque-latin-ext-800-normal.woff"),
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Plex Mono",
      data: load("ibm-plex-mono", "ibm-plex-mono-latin-600-normal.woff"),
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Plex Sans",
      data: load("ibm-plex-sans", "ibm-plex-sans-latin-500-normal.woff"),
      weight: 500 as const,
      style: "normal" as const,
    },
    {
      name: "Caveat",
      data: load("caveat", "caveat-latin-600-normal.woff"),
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}
