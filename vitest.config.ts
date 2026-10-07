import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "tests/unit/stubs/server-only.ts") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: { DB_MEMORY: "1", MOCK_MODE: "true" },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
