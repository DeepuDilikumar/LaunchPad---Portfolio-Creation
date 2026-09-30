import { defineConfig } from "@playwright/test"

const PORT = Number(process.env.PORT ?? 3100)

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    // Demo mode with a throwaway database, so the full journey runs without external services.
    command: `rm -rf test-results/e2e-data && pnpm start -p ${PORT}`,
    env: { LAUNCHPAD_DEMO_MODE: "1", LAUNCHPAD_DATA_DIR: "test-results/e2e-data", ANTHROPIC_API_KEY: "" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
