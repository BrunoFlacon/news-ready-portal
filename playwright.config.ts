import { defineConfig, devices } from "@playwright/test";

// ===========================================================================
// Config VALIDAÇÃO desktop/celular real (Playwright standalone — sem depender
// do pacote externo lovable-agent-playwright-config, que não está nos deps).
// usa o chromium baixado localmente + webServer no preview do dist já
// buildado (porta 8080, mesma do vite dev) + baseURL "/".
// Projetos:
//   • Desktop Chrome  1280×800
//   • Mobile Chrome   (Pixel 7) 390×844 com touch (tap real)
// ===========================================================================
export default defineConfig({
  testDir: "./src/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 8080",
    port: 8080,
    reuseExistingServer: true,
  },
});
