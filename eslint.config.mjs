import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "reference/**",
      "dist/**",
      "next-env.d.ts",
      ".claude/**",
      ".data/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // "// section labels" are a deliberate part of the notebook design.
      "react/jsx-no-comment-textnodes": "off",
    },
  },
];

export default config;
