import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5175",
    channel:
      process.env.PW_BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5175",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
