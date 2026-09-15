import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  // Kompilasi rute pertama kali oleh Turbopack di mode dev bisa memakan
  // beberapa detik, jadi batas bawaan 5 detik terlalu ketat untuk assertion
  // pertama pada sebuah halaman.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      /*
       * Pengujian admin yang mengubah data hanya dijalankan sekali: mock
       * berbagi satu state per proses server, sehingga menjalankannya di dua
       * viewport membuat yang kedua bekerja pada data yang sudah berubah.
       * Tampilan panel admin tetap diuji di mobile lewat `admin-view.spec.ts`.
       */
      testIgnore: /admin-flow\.spec\.ts/,
    },
  ],
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
