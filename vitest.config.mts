import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Menghormati alias "@/*" dari tsconfig.json
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // e2e dijalankan Playwright, bukan Vitest
    exclude: ["node_modules", ".next", "e2e"],
  },
})
