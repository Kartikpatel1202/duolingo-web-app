import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the REAL stack on dedicated ports, so it never touches the dev database:
 *   FastAPI  :8001  (SQLite file data/e2e.db, test routes enabled for POST /api/test/reset)
 *   Next.js  :3100  (production build in .next-e2e)
 */
export const API_PORT = 8001;
const WEB_PORT = 3100;
const BACKEND_DIR = path.resolve(process.cwd(), "..", "backend");
const PYTHON = path.join(
  BACKEND_DIR,
  ".venv",
  ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]),
);

export default defineConfig({
  testDir: "./e2e",
  // Tests share one backend database and reset it, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `"${PYTHON}" -m uvicorn app.main:app --port ${API_PORT}`,
      cwd: BACKEND_DIR,
      url: `http://localhost:${API_PORT}/api/health`,
      env: {
        DATABASE_URL: "sqlite:///./data/e2e.db",
        ENABLE_TEST_ROUTES: "true",
        ENABLE_DEMO_LOGIN: "true",
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
      },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run build && npx next start --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/learn`,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
      },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
