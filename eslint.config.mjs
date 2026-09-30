import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Claude Code skills, not app code.
    ".claude/**",
    "test-results/**",
    "playwright-report/**",
    // Copied from pdfjs-dist at install time.
    "public/pdf.worker.min.mjs",
    ".data/**",
  ]),
]);

export default eslintConfig;
