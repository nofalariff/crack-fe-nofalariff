import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { env } from "@/env"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${env.NEXT_PUBLIC_APP_NAME} — Kirim Kargo Udara dari Jakarta`,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "Booking pengiriman kargo udara dari Bandara Soekarno-Hatta ke Sulawesi dan seluruh Pulau Jawa. Cek ongkir, booking sendiri, dan pantau status kiriman.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: env.NEXT_PUBLIC_APP_NAME,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
