import { z } from "zod"

/**
 * Validasi environment variable saat modul pertama kali dimuat.
 *
 * Variabel NEXT_PUBLIC_* harus ditulis lengkap (bukan process.env[key]) karena
 * Next.js mengganti nilainya saat build lewat pencocokan teks statis.
 */
const envSchema = z.object({
  API_URL: z.url({ error: "API_URL harus berupa URL yang valid" }),
  NEXT_PUBLIC_APP_URL: z.url({
    error: "NEXT_PUBLIC_APP_URL harus berupa URL yang valid",
  }),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("LogiSend"),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
})

const parsed = envSchema.safeParse({
  API_URL: process.env.API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
})

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")

  throw new Error(
    `Konfigurasi environment tidak valid:\n${detail}\n\nSalin .env.example menjadi .env.local lalu lengkapi nilainya.`
  )
}

export const env = parsed.data

export const isMockingEnabled = env.NEXT_PUBLIC_API_MOCKING === "enabled"
